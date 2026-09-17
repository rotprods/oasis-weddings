#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

SCHEMA_VERSION = "OW-MISSION-CONTROL-1.0"
DEFAULT_LEASE_SECONDS = 1800
DEFAULT_TEAM_LEAD_SECONDS = 1800
LIVE_STATES = {"ACTIVE", "BLOCKED"}
TERMINAL_WORK_STATES = {"COMPLETE", "SUPERSEDED"}
AUTHORITY_SOURCES = {"TEAM_LEAD_CLAIM", "HUMAN_OVERRIDE", "RECOVERY_TAKEOVER"}


class MissionControlError(ValueError):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def format_utc(value: datetime) -> str:
    if value.tzinfo is None:
        raise MissionControlError("timestamp must be timezone-aware")
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_utc(value: str) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise MissionControlError("timestamp must use UTC Z form")
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise MissionControlError(f"invalid UTC timestamp: {value}") from exc
    return parsed.astimezone(timezone.utc)


def is_git_sha(value: str) -> bool:
    return isinstance(value, str) and len(value) == 40 and all(c in "0123456789abcdef" for c in value)


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode()).hexdigest()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:16].upper()}"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent, text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=False)
            handle.write("\n")
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass
        raise


def append_event(path: Path, event: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(canonical_json(dict(event)) + "\n")


def _list(state: Mapping[str, Any], key: str) -> list[dict[str, Any]]:
    value = state.get(key, [])
    if not isinstance(value, list):
        raise MissionControlError(f"{key} must be a list")
    return [dict(item) for item in value if isinstance(item, Mapping)]


def _work_map(work_units: Sequence[Mapping[str, Any]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for raw in work_units:
        item = dict(raw)
        work_id = item.get("work_unit_id")
        if not isinstance(work_id, str) or not work_id:
            raise MissionControlError("work_unit_id is required")
        if work_id in result:
            raise MissionControlError(f"duplicate work_unit_id: {work_id}")
        result[work_id] = item
    return result


def validate_state(state: Mapping[str, Any]) -> list[str]:
    errors: list[str] = []
    if state.get("project_id") != "PRJ-OW-001":
        errors.append("INVALID_PROJECT_ID")
    team = state.get("team_lead")
    if not isinstance(team, Mapping) or team.get("agent_id") != "AGT-OW-TL-001":
        errors.append("INVALID_TEAM_LEAD")
    token = state.get("fencing", {}).get("last_issued_token") if isinstance(state.get("fencing"), Mapping) else None
    if isinstance(token, bool) or not isinstance(token, int) or token < 0:
        errors.append("INVALID_FENCING_WATERMARK")
    seen_sessions: set[str] = set()
    for session in _list(state, "active_sessions"):
        session_id = session.get("session_id")
        if not isinstance(session_id, str) or not session_id:
            errors.append("SESSION_WITHOUT_ID")
        elif session_id in seen_sessions:
            errors.append(f"DUPLICATE_SESSION:{session_id}")
        else:
            seen_sessions.add(session_id)
    claims = _list(state, "active_claims")
    seen_claims: set[str] = set()
    for claim in claims:
        claim_id = claim.get("claim_id")
        if not isinstance(claim_id, str) or not claim_id:
            errors.append("CLAIM_WITHOUT_ID")
        elif claim_id in seen_claims:
            errors.append(f"DUPLICATE_CLAIM:{claim_id}")
        else:
            seen_claims.add(claim_id)
        f = claim.get("fencing_token")
        if isinstance(f, bool) or not isinstance(f, int) or f < 1:
            errors.append(f"INVALID_CLAIM_TOKEN:{claim_id}")
    for i, left in enumerate(claims):
        for right in claims[i + 1 :]:
            if left.get("state") not in LIVE_STATES or right.get("state") not in LIVE_STATES:
                continue
            if scope_overlap(left, right):
                errors.append(f"LIVE_SCOPE_COLLISION:{left.get('claim_id')}:{right.get('claim_id')}")
    return sorted(set(errors))


def validate_runtime(
    state: Mapping[str, Any],
    work_units: Sequence[Mapping[str, Any]],
    *,
    now: datetime | None = None,
) -> list[str]:
    now = now or utc_now()
    errors = list(validate_state(state))
    by_id = _work_map(work_units)
    claims = _list(state, "active_claims")
    leases = {str(x.get("lease_id")): x for x in _list(state, "active_leases")}
    for claim in claims:
        work_id = str(claim.get("work_unit_id", ""))
        if work_id not in by_id:
            errors.append(f"CLAIM_UNKNOWN_WORK_UNIT:{claim.get('claim_id')}:{work_id}")
            continue
        lease = leases.get(str(claim.get("lease_id", "")))
        if lease is None:
            errors.append(f"CLAIM_WITHOUT_LEASE:{claim.get('claim_id')}")
        elif claim.get("state") in LIVE_STATES and not lease_is_live(lease, now):
            errors.append(f"STALE_ACTIVE_CLAIM:{claim.get('claim_id')}")
    claimed_work = {str(x.get("work_unit_id")) for x in claims if x.get("state") in LIVE_STATES}
    for work_id, unit in by_id.items():
        if unit.get("status") == "ACTIVE" and work_id not in claimed_work:
            errors.append(f"ORPHAN_ACTIVE_WORK_UNIT:{work_id}")
        if unit.get("status") == "COMPLETE" and work_id in claimed_work:
            errors.append(f"COMPLETE_WORK_STILL_CLAIMED:{work_id}")
    team = state.get("team_lead", {})
    if isinstance(team, Mapping) and team.get("state") == "BOUND":
        expires = team.get("expires_at")
        if not isinstance(expires, str) or now >= parse_utc(expires):
            errors.append("STALE_TEAM_LEAD_BINDING")
    return sorted(set(errors))


def scope_overlap(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
    for key in ("resource_scopes", "semantic_scopes"):
        l = {str(x) for x in left.get(key, []) if str(x)}
        r = {str(x) for x in right.get(key, []) if str(x)}
        if l & r:
            return True
    return False


def lease_is_live(lease: Mapping[str, Any], now: datetime) -> bool:
    return lease.get("state") == "ACTIVE" and now < parse_utc(str(lease["expires_at"]))


def _lease_by_id(state: Mapping[str, Any], lease_id: str) -> dict[str, Any] | None:
    return next((x for x in _list(state, "active_leases") if x.get("lease_id") == lease_id), None)


def _claim_by_work(state: Mapping[str, Any], work_unit_id: str) -> dict[str, Any] | None:
    return next((x for x in _list(state, "active_claims") if x.get("work_unit_id") == work_unit_id and x.get("state") in LIVE_STATES), None)


def _dependencies_complete(unit: Mapping[str, Any], by_id: Mapping[str, Mapping[str, Any]]) -> bool:
    return all(by_id.get(dep, {}).get("status") == "COMPLETE" for dep in unit.get("dependencies", []))


def _active_scope_collision(state: Mapping[str, Any], unit: Mapping[str, Any], now: datetime, ignore_claim_id: str | None = None) -> bool:
    candidate = {"resource_scopes": unit.get("resource_scopes", []), "semantic_scopes": unit.get("semantic_scopes", [])}
    for claim in _list(state, "active_claims"):
        if claim.get("claim_id") == ignore_claim_id or claim.get("state") not in LIVE_STATES:
            continue
        lease = _lease_by_id(state, str(claim.get("lease_id", "")))
        if lease and lease_is_live(lease, now) and scope_overlap(candidate, claim):
            return True
    return False


def select_next_work_unit(
    work_units: Sequence[Mapping[str, Any]],
    state: Mapping[str, Any],
    *,
    niche_ids: Iterable[str] = (),
    now: datetime | None = None,
    include_recoverable: bool = True,
) -> dict[str, Any] | None:
    now = now or utc_now()
    by_id = _work_map(work_units)
    wanted = {x for x in niche_ids if x}
    candidates: list[tuple[int, int, str, dict[str, Any]]] = []
    for unit in by_id.values():
        status = unit.get("status")
        if status in TERMINAL_WORK_STATES or status == "BLOCKED":
            continue
        unit_niches = set(unit.get("niche_ids", []))
        if wanted and not (wanted & unit_niches):
            continue
        if not _dependencies_complete(unit, by_id):
            continue
        claim = _claim_by_work(state, str(unit["work_unit_id"]))
        recoverable = False
        if claim:
            lease = _lease_by_id(state, str(claim.get("lease_id", "")))
            if lease and lease_is_live(lease, now):
                continue
            recoverable = True
            if not include_recoverable:
                continue
        if _active_scope_collision(state, unit, now, ignore_claim_id=claim.get("claim_id") if claim else None):
            continue
        item = copy.deepcopy(unit)
        item["admission"] = "RECOVERY_TAKEOVER" if recoverable else "CLAIMABLE"
        priority = int(item.get("priority", 0))
        impact = int(item.get("impact", 0))
        candidates.append((-priority, -impact, str(item["work_unit_id"]), item))
    return sorted(candidates)[0][3] if candidates else None


def _next_token(state: dict[str, Any]) -> int:
    fencing = state.setdefault("fencing", {})
    current = int(fencing.get("last_issued_token", 0))
    fencing["last_issued_token"] = current + 1
    return current + 1


def _team_lead_live(state: Mapping[str, Any], now: datetime) -> bool:
    team = state.get("team_lead", {})
    if not isinstance(team, Mapping) or team.get("state") != "BOUND":
        return False
    expires = team.get("expires_at")
    return isinstance(expires, str) and now < parse_utc(expires)


def bind_team_lead(
    state: Mapping[str, Any],
    *,
    main_sha: str,
    authorized_by: str,
    now: datetime | None = None,
    ttl_seconds: int = DEFAULT_TEAM_LEAD_SECONDS,
) -> tuple[dict[str, Any], dict[str, Any]]:
    now = now or utc_now()
    if authorized_by != "HUM-ROB-001":
        raise MissionControlError("TEAM_LEAD binding requires HUM-ROB-001 authorization")
    if not is_git_sha(main_sha):
        raise MissionControlError("main_sha must be a 40-character git SHA")
    if ttl_seconds <= 0:
        raise MissionControlError("ttl_seconds must be positive")
    result = copy.deepcopy(state)
    if _team_lead_live(result, now):
        raise MissionControlError("TEAM_LEAD already has a live binding")
    session_id, run_id = new_id("SES"), new_id("RUN")
    team = result.setdefault("team_lead", {})
    team.update(
        {
            "agent_id": "AGT-OW-TL-001",
            "state": "BOUND",
            "session_id": session_id,
            "run_id": run_id,
            "bound_at": format_utc(now),
            "last_heartbeat_at": format_utc(now),
            "expires_at": format_utc(now + timedelta(seconds=ttl_seconds)),
            "base_main_sha": main_sha,
            "authority_source": "HUMAN_OVERRIDE",
            "authorized_by": authorized_by,
        }
    )
    result.setdefault("active_sessions", []).append(
        {
            "session_id": session_id,
            "run_id": run_id,
            "agent_id": "AGT-OW-TL-001",
            "parent_agent_id": "HUM-ROB-001",
            "role": "TEAM_LEAD",
            "state": "ACTIVE",
            "started_at": format_utc(now),
            "last_heartbeat_at": format_utc(now),
            "base_main_sha": main_sha,
            "authority_source": "HUMAN_OVERRIDE",
        }
    )
    result["mode"] = "TEAM_LEAD_BOUND"
    event = make_event(
        "TEAM_LEAD_BOUND",
        now=now,
        agent_id="AGT-OW-TL-001",
        session_id=session_id,
        run_id=run_id,
        main_sha=main_sha,
        summary="TEAM_LEAD bound by explicit founder authorization",
    )
    return finalize_state(result), event


def _assert_authority(
    state: Mapping[str, Any],
    *,
    authority_source: str,
    authorized_by: str,
    issued_by_agent_id: str | None,
    now: datetime,
) -> None:
    if authority_source not in AUTHORITY_SOURCES:
        raise MissionControlError(f"unsupported authority_source: {authority_source}")
    if authority_source == "HUMAN_OVERRIDE":
        if authorized_by != "HUM-ROB-001":
            raise MissionControlError("HUMAN_OVERRIDE requires HUM-ROB-001")
        return
    if authority_source == "TEAM_LEAD_CLAIM":
        if not _team_lead_live(state, now):
            raise MissionControlError("TEAM_LEAD is not live")
        if issued_by_agent_id != "AGT-OW-TL-001":
            raise MissionControlError("TEAM_LEAD_CLAIM must be issued by AGT-OW-TL-001")
        return
    # RECOVERY_TAKEOVER is validated against the predecessor lease in claim_work.


def claim_work(
    state: Mapping[str, Any],
    work_units: Sequence[Mapping[str, Any]],
    *,
    work_unit_id: str,
    agent_id: str,
    parent_agent_id: str,
    main_sha: str,
    authority_source: str,
    authorized_by: str,
    issued_by_agent_id: str | None = None,
    now: datetime | None = None,
    lease_seconds: int = DEFAULT_LEASE_SECONDS,
    session_id: str | None = None,
    run_id: str | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    now = now or utc_now()
    if not is_git_sha(main_sha):
        raise MissionControlError("main_sha must be a 40-character git SHA")
    if lease_seconds <= 0:
        raise MissionControlError("lease_seconds must be positive")
    _assert_authority(
        state,
        authority_source=authority_source,
        authorized_by=authorized_by,
        issued_by_agent_id=issued_by_agent_id,
        now=now,
    )
    units = [copy.deepcopy(x) for x in work_units]
    by_id = _work_map(units)
    unit = by_id.get(work_unit_id)
    if unit is None:
        raise MissionControlError(f"unknown work_unit_id: {work_unit_id}")
    if unit.get("status") in TERMINAL_WORK_STATES:
        raise MissionControlError("terminal work unit cannot be claimed")
    if not _dependencies_complete(unit, by_id):
        raise MissionControlError("work unit dependencies are not complete")

    result = copy.deepcopy(state)
    existing = _claim_by_work(result, work_unit_id)
    existing_lease = _lease_by_id(result, str(existing.get("lease_id", ""))) if existing else None
    if existing and existing_lease and lease_is_live(existing_lease, now):
        raise MissionControlError("work unit already has a live writer")
    if _active_scope_collision(result, unit, now, ignore_claim_id=existing.get("claim_id") if existing else None):
        raise MissionControlError("work unit collides with another live scope")
    if existing:
        if authority_source != "RECOVERY_TAKEOVER":
            raise MissionControlError("stale/expired work requires RECOVERY_TAKEOVER")
        if session_id and session_id == existing.get("session_id"):
            raise MissionControlError("recovery requires a fresh session_id")
        if run_id and run_id == existing.get("run_id"):
            raise MissionControlError("recovery requires a fresh run_id")
    elif authority_source == "RECOVERY_TAKEOVER":
        raise MissionControlError("RECOVERY_TAKEOVER requires a predecessor claim")

    session_id = session_id or new_id("SES")
    run_id = run_id or new_id("RUN")
    if any(x.get("session_id") == session_id for x in _list(result, "active_sessions")):
        raise MissionControlError("session_id already exists")
    token = _next_token(result)
    if existing and token <= int(existing.get("fencing_token", 0)):
        raise MissionControlError("successor fencing token must exceed predecessor")
    claim_id, lease_id = new_id("CLM"), new_id("LSE")
    expires_at = format_utc(now + timedelta(seconds=lease_seconds))

    session = {
        "session_id": session_id,
        "run_id": run_id,
        "agent_id": agent_id,
        "parent_agent_id": parent_agent_id,
        "role": "EXECUTOR",
        "state": "ACTIVE",
        "started_at": format_utc(now),
        "last_heartbeat_at": format_utc(now),
        "base_main_sha": main_sha,
        "authority_source": authority_source,
        "work_unit_id": work_unit_id,
        "claim_id": claim_id,
        "fencing_token": token,
    }
    claim = {
        "claim_id": claim_id,
        "work_unit_id": work_unit_id,
        "project_id": result.get("project_id"),
        "agent_id": agent_id,
        "parent_agent_id": parent_agent_id,
        "session_id": session_id,
        "run_id": run_id,
        "state": "ACTIVE",
        "claimed_at": format_utc(now),
        "fencing_token": token,
        "lease_id": lease_id,
        "base_main_sha": main_sha,
        "authority_source": authority_source,
        "goal_ids": list(unit.get("goal_ids", [])),
        "niche_ids": list(unit.get("niche_ids", [])),
        "protect_ids": list(unit.get("protect_ids", [])),
        "resource_scopes": list(unit.get("resource_scopes", [])),
        "semantic_scopes": list(unit.get("semantic_scopes", [])),
    }
    lease = {
        "lease_id": lease_id,
        "claim_id": claim_id,
        "work_unit_id": work_unit_id,
        "owner_agent_id": agent_id,
        "session_id": session_id,
        "run_id": run_id,
        "state": "ACTIVE",
        "acquired_at": format_utc(now),
        "expires_at": expires_at,
        "fencing_token": token,
        "base_main_sha": main_sha,
    }

    if existing:
        existing["state"] = "SUPERSEDED"
        existing["superseded_at"] = format_utc(now)
        old_lease = _lease_by_id(result, str(existing.get("lease_id", "")))
        old_session = next((x for x in _list(result, "active_sessions") if x.get("session_id") == existing.get("session_id")), None)
        if old_lease:
            old_lease["state"] = "RELEASED"
            old_lease["released_at"] = format_utc(now)
            old_lease["release_reason"] = "RECOVERY_TAKEOVER"
            result.setdefault("lease_history", []).append(copy.deepcopy(old_lease))
            result["active_leases"] = [x for x in _list(result, "active_leases") if x.get("lease_id") != old_lease.get("lease_id")]
        if old_session:
            old_session["state"] = "SUPERSEDED"
            old_session["ended_at"] = format_utc(now)
            result.setdefault("session_history", []).append(copy.deepcopy(old_session))
            result["active_sessions"] = [x for x in _list(result, "active_sessions") if x.get("session_id") != old_session.get("session_id")]
        result.setdefault("claim_history", []).append(copy.deepcopy(existing))
        result["active_claims"] = [x for x in _list(result, "active_claims") if x.get("claim_id") != existing.get("claim_id")]
        result["active_writers"] = [x for x in _list(result, "active_writers") if x.get("claim_id") != existing.get("claim_id")]
    result.setdefault("active_sessions", []).append(session)
    result.setdefault("active_claims", []).append(claim)
    result.setdefault("active_leases", []).append(lease)
    result.setdefault("active_writers", []).append(
        {"work_unit_id": work_unit_id, "agent_id": agent_id, "session_id": session_id, "claim_id": claim_id, "fencing_token": token}
    )

    unit["status"] = "ACTIVE"
    unit["active_claim_id"] = claim_id
    unit["active_agent_id"] = agent_id
    unit["updated_at"] = format_utc(now)
    units = [unit if x["work_unit_id"] == work_unit_id else x for x in units]
    event = make_event(
        "WORK_CLAIMED" if not existing else "WORK_RECOVERED",
        now=now,
        agent_id=agent_id,
        session_id=session_id,
        run_id=run_id,
        work_unit_id=work_unit_id,
        claim_id=claim_id,
        fencing_token=token,
        main_sha=main_sha,
        summary=f"{work_unit_id} claimed under {authority_source}",
    )
    return finalize_state(result), units, event


def heartbeat(
    state: Mapping[str, Any],
    *,
    session_id: str,
    main_sha: str,
    now: datetime | None = None,
    lease_seconds: int = DEFAULT_LEASE_SECONDS,
    next_safe_action: str = "",
) -> tuple[dict[str, Any], dict[str, Any]]:
    now = now or utc_now()
    if not is_git_sha(main_sha):
        raise MissionControlError("main_sha must be a 40-character git SHA")
    result = copy.deepcopy(state)
    session = next((x for x in result.get("active_sessions", []) if x.get("session_id") == session_id), None)
    if not session or session.get("state") not in LIVE_STATES:
        raise MissionControlError("session is not active")
    if main_sha != session.get("base_main_sha"):
        raise MissionControlError("session base_main_sha changed; reconcile exact-head before continuing")
    session["last_heartbeat_at"] = format_utc(now)
    session["next_safe_action"] = next_safe_action

    if session.get("role") == "TEAM_LEAD":
        team = result.get("team_lead", {})
        if not isinstance(team, dict) or team.get("session_id") != session_id or team.get("state") != "BOUND":
            raise MissionControlError("TEAM_LEAD binding does not match session")
        if not _team_lead_live(result, now):
            raise MissionControlError("TEAM_LEAD binding is expired; bind a fresh session")
        team["last_heartbeat_at"] = format_utc(now)
        team["expires_at"] = format_utc(now + timedelta(seconds=lease_seconds))
        event = make_event(
            "HEARTBEAT",
            now=now,
            agent_id=str(session["agent_id"]),
            session_id=session_id,
            run_id=str(session["run_id"]),
            main_sha=main_sha,
            summary=next_safe_action or "TEAM_LEAD heartbeat",
        )
        return finalize_state(result), event

    claim = next((x for x in result.get("active_claims", []) if x.get("claim_id") == session.get("claim_id")), None)
    lease = next((x for x in result.get("active_leases", []) if x.get("lease_id") == (claim or {}).get("lease_id")), None)
    if not claim or not lease or not lease_is_live(lease, now):
        raise MissionControlError("cannot heartbeat without a live claim/lease")
    lease["expires_at"] = format_utc(now + timedelta(seconds=lease_seconds))
    event = make_event(
        "HEARTBEAT",
        now=now,
        agent_id=str(session["agent_id"]),
        session_id=session_id,
        run_id=str(session["run_id"]),
        work_unit_id=str(session["work_unit_id"]),
        claim_id=str(session["claim_id"]),
        fencing_token=int(session["fencing_token"]),
        main_sha=main_sha,
        summary=next_safe_action or "heartbeat",
    )
    return finalize_state(result), event


def release_work(
    state: Mapping[str, Any],
    work_units: Sequence[Mapping[str, Any]],
    *,
    session_id: str,
    outcome: str,
    main_sha: str,
    now: datetime | None = None,
    next_safe_action: str = "",
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    now = now or utc_now()
    if outcome not in {"COMPLETE", "BLOCKED", "RELEASED", "SUPERSEDED"}:
        raise MissionControlError("invalid release outcome")
    if not is_git_sha(main_sha):
        raise MissionControlError("main_sha must be a 40-character git SHA")
    result = copy.deepcopy(state)
    units = [copy.deepcopy(x) for x in work_units]
    session = next((x for x in result.get("active_sessions", []) if x.get("session_id") == session_id), None)
    if not session:
        raise MissionControlError("unknown session")
    claim = next((x for x in result.get("active_claims", []) if x.get("claim_id") == session.get("claim_id")), None)
    lease = next((x for x in result.get("active_leases", []) if x.get("lease_id") == (claim or {}).get("lease_id")), None)
    if not claim or not lease:
        raise MissionControlError("session has no live claim/lease")
    if main_sha != session.get("base_main_sha"):
        raise MissionControlError("exact-head mismatch; reconcile before release")
    work_id = str(session["work_unit_id"])
    session["state"] = "COMPLETE" if outcome == "COMPLETE" else outcome
    session["ended_at"] = format_utc(now)
    session["next_safe_action"] = next_safe_action
    claim["state"] = "RELEASED" if outcome in {"COMPLETE", "RELEASED"} else outcome
    claim["released_at"] = format_utc(now)
    lease["state"] = "RELEASED"
    lease["released_at"] = format_utc(now)
    lease["release_reason"] = outcome
    result.setdefault("session_history", []).append(copy.deepcopy(session))
    result.setdefault("claim_history", []).append(copy.deepcopy(claim))
    result.setdefault("lease_history", []).append(copy.deepcopy(lease))
    result["active_sessions"] = [x for x in _list(result, "active_sessions") if x.get("session_id") != session_id]
    result["active_claims"] = [x for x in _list(result, "active_claims") if x.get("claim_id") != claim.get("claim_id")]
    result["active_leases"] = [x for x in _list(result, "active_leases") if x.get("lease_id") != lease.get("lease_id")]
    result["active_writers"] = [x for x in result.get("active_writers", []) if x.get("session_id") != session_id]
    for unit in units:
        if unit.get("work_unit_id") == work_id:
            unit["status"] = "COMPLETE" if outcome == "COMPLETE" else ("BLOCKED" if outcome == "BLOCKED" else "CLAIMABLE")
            unit.pop("active_claim_id", None)
            unit.pop("active_agent_id", None)
            unit["updated_at"] = format_utc(now)
            unit["next_safe_action"] = next_safe_action
    event = make_event(
        "WORK_COMPLETED" if outcome == "COMPLETE" else "WORK_RELEASED",
        now=now,
        agent_id=str(session["agent_id"]),
        session_id=session_id,
        run_id=str(session["run_id"]),
        work_unit_id=work_id,
        claim_id=str(session["claim_id"]),
        fencing_token=int(session["fencing_token"]),
        main_sha=main_sha,
        summary=f"{work_id} -> {outcome}: {next_safe_action}".strip(),
    )
    return finalize_state(result), units, event


def finalize_state(state: dict[str, Any]) -> dict[str, Any]:
    state = copy.deepcopy(state)
    state["generation"] = int(state.get("generation", 0)) + 1
    payload = dict(state)
    payload.pop("projection_revision", None)
    state["projection_revision"] = sha256_json(payload)
    errors = validate_state(state)
    if errors:
        raise MissionControlError("state validation failed: " + ",".join(errors))
    return state


def make_event(
    event_type: str,
    *,
    now: datetime,
    agent_id: str,
    session_id: str,
    run_id: str,
    main_sha: str,
    summary: str,
    work_unit_id: str | None = None,
    claim_id: str | None = None,
    fencing_token: int | None = None,
) -> dict[str, Any]:
    event = {
        "schema_version": SCHEMA_VERSION,
        "event_id": new_id("EVT"),
        "event_type": event_type,
        "occurred_at": format_utc(now),
        "project_id": "PRJ-OW-001",
        "agent_id": agent_id,
        "session_id": session_id,
        "run_id": run_id,
        "main_sha_observed": main_sha,
        "summary": summary,
    }
    if work_unit_id:
        event["work_unit_id"] = work_unit_id
    if claim_id:
        event["claim_id"] = claim_id
    if fencing_token is not None:
        event["fencing_token"] = fencing_token
    event["idempotency_key"] = sha256_json(event)
    return event


def _paths(root: Path) -> tuple[Path, Path, Path]:
    return (
        root / "runtime/agent-graph/STATE.json",
        root / "runtime/agent-graph/WORK_UNITS.json",
        root / "runtime/agent-graph/EVENTS.jsonl",
    )


def _read_runtime(root: Path) -> tuple[dict[str, Any], list[dict[str, Any]], Path, Path, Path]:
    state_path, work_path, events_path = _paths(root)
    state = load_json(state_path)
    work_units = load_json(work_path)
    if not isinstance(work_units, list):
        raise MissionControlError("WORK_UNITS.json must contain a list")
    return state, work_units, state_path, work_path, events_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="OASIS WEDDINGS Mission Control v1")
    parser.add_argument("--root", default=".", help="repository root")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("check")

    nxt = sub.add_parser("next")
    nxt.add_argument("--niche", action="append", default=[])

    bind = sub.add_parser("bind-team-lead")
    bind.add_argument("--main-sha", required=True)
    bind.add_argument("--authorized-by", required=True)
    bind.add_argument("--ttl", type=int, default=DEFAULT_TEAM_LEAD_SECONDS)

    claim = sub.add_parser("claim")
    claim.add_argument("work_unit_id")
    claim.add_argument("--agent-id", required=True)
    claim.add_argument("--parent-agent-id", default="AGT-OW-TL-001")
    claim.add_argument("--main-sha", required=True)
    claim.add_argument("--authority-source", choices=sorted(AUTHORITY_SOURCES), required=True)
    claim.add_argument("--authorized-by", default="")
    claim.add_argument("--issued-by-agent-id")
    claim.add_argument("--lease-seconds", type=int, default=DEFAULT_LEASE_SECONDS)

    beat = sub.add_parser("heartbeat")
    beat.add_argument("--session-id", required=True)
    beat.add_argument("--main-sha", required=True)
    beat.add_argument("--lease-seconds", type=int, default=DEFAULT_LEASE_SECONDS)
    beat.add_argument("--next-safe-action", default="")

    release = sub.add_parser("release")
    release.add_argument("--session-id", required=True)
    release.add_argument("--outcome", choices=["COMPLETE", "BLOCKED", "RELEASED", "SUPERSEDED"], required=True)
    release.add_argument("--main-sha", required=True)
    release.add_argument("--next-safe-action", default="")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = Path(args.root).resolve()
    state, work_units, state_path, work_path, events_path = _read_runtime(root)

    if args.command == "check":
        errors = validate_runtime(state, work_units)
        if errors:
            print(json.dumps({"ok": False, "errors": errors}, indent=2))
            return 1
        print(json.dumps({"ok": True, "generation": state.get("generation", 0), "projection_revision": state.get("projection_revision")}, indent=2))
        return 0

    if args.command == "next":
        selected = select_next_work_unit(work_units, state, niche_ids=args.niche)
        print(json.dumps(selected, ensure_ascii=False, indent=2))
        return 0 if selected else 2

    if args.command == "bind-team-lead":
        state, event = bind_team_lead(state, main_sha=args.main_sha, authorized_by=args.authorized_by, ttl_seconds=args.ttl)
        atomic_write_json(state_path, state)
        append_event(events_path, event)
        print(json.dumps({"team_lead": state["team_lead"], "event": event}, indent=2))
        return 0

    if args.command == "claim":
        state, work_units, event = claim_work(
            state,
            work_units,
            work_unit_id=args.work_unit_id,
            agent_id=args.agent_id,
            parent_agent_id=args.parent_agent_id,
            main_sha=args.main_sha,
            authority_source=args.authority_source,
            authorized_by=args.authorized_by,
            issued_by_agent_id=args.issued_by_agent_id,
            lease_seconds=args.lease_seconds,
        )
        atomic_write_json(state_path, state)
        atomic_write_json(work_path, work_units)
        append_event(events_path, event)
        claim = next(x for x in state["active_claims"] if x["claim_id"] == event["claim_id"])
        print(json.dumps({"claim": claim, "event": event}, indent=2))
        return 0

    if args.command == "heartbeat":
        state, event = heartbeat(
            state,
            session_id=args.session_id,
            main_sha=args.main_sha,
            lease_seconds=args.lease_seconds,
            next_safe_action=args.next_safe_action,
        )
        atomic_write_json(state_path, state)
        append_event(events_path, event)
        print(json.dumps(event, indent=2))
        return 0

    if args.command == "release":
        state, work_units, event = release_work(
            state,
            work_units,
            session_id=args.session_id,
            outcome=args.outcome,
            main_sha=args.main_sha,
            next_safe_action=args.next_safe_action,
        )
        atomic_write_json(state_path, state)
        atomic_write_json(work_path, work_units)
        append_event(events_path, event)
        print(json.dumps(event, indent=2))
        return 0

    raise AssertionError("unreachable")


if __name__ == "__main__":
    raise SystemExit(main())
