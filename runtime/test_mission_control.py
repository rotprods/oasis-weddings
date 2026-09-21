from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from runtime.mission_control import (
    MissionControlError,
    bind_team_lead,
    claim_work,
    heartbeat,
    release_work,
    select_next_work_unit,
    validate_runtime,
)

SHA = "a" * 40
NOW = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)


def state():
    return {
        "schema_version": "1.0.0",
        "project_id": "PRJ-OW-001",
        "graph_id": "AGR-OW-001",
        "mode": "READY_FOR_TEAM_LEAD_BINDING",
        "authority": {"last_observed_main_sha": SHA},
        "team_lead": {"agent_id": "AGT-OW-TL-001", "state": "UNBOUND"},
        "active_sessions": [],
        "active_claims": [],
        "active_leases": [],
        "active_writers": [],
        "session_history": [],
        "claim_history": [],
        "lease_history": [],
        "fencing": {"last_issued_token": 0},
    }


def units():
    return [
        {
            "work_unit_id": "WU-HIGH",
            "title": "High",
            "status": "CLAIMABLE",
            "priority": 100,
            "impact": 9,
            "goal_ids": ["G-1"],
            "niche_ids": ["NIC-SEO"],
            "protect_ids": ["PROT-TRUTH"],
            "dependencies": [],
            "resource_scopes": ["research/high"],
            "semantic_scopes": ["intel:high"],
        },
        {
            "work_unit_id": "WU-LOW",
            "title": "Low",
            "status": "CLAIMABLE",
            "priority": 50,
            "impact": 10,
            "goal_ids": ["G-2"],
            "niche_ids": ["NIC-WEB"],
            "protect_ids": ["PROT-TRUTH"],
            "dependencies": [],
            "resource_scopes": ["research/low"],
            "semantic_scopes": ["intel:low"],
        },
    ]


class MissionControlTests(unittest.TestCase):
    def test_next_prefers_priority_and_niche(self):
        self.assertEqual(select_next_work_unit(units(), state(), now=NOW)["work_unit_id"], "WU-HIGH")
        self.assertEqual(select_next_work_unit(units(), state(), niche_ids=["NIC-WEB"], now=NOW)["work_unit_id"], "WU-LOW")

    def test_human_override_claim_blocks_second_writer(self):
        claimed, work, _ = claim_work(
            state(), units(), work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW, lease_seconds=60,
        )
        self.assertEqual(claimed["fencing"]["last_issued_token"], 1)
        self.assertEqual(work[0]["status"], "ACTIVE")
        with self.assertRaisesRegex(MissionControlError, "live writer"):
            claim_work(
                claimed, work, work_unit_id="WU-HIGH", agent_id="AGT-B", parent_agent_id="AGT-OW-TL-001",
                main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW + timedelta(seconds=1),
            )

    def test_team_lead_claim_requires_live_binding(self):
        with self.assertRaisesRegex(MissionControlError, "TEAM_LEAD is not live"):
            claim_work(
                state(), units(), work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
                main_sha=SHA, authority_source="TEAM_LEAD_CLAIM", authorized_by="",
                issued_by_agent_id="AGT-OW-TL-001", now=NOW,
            )

    def test_team_lead_binding_and_heartbeat(self):
        bound, _ = bind_team_lead(state(), main_sha=SHA, authorized_by="HUM-ROB-001", now=NOW, ttl_seconds=60)
        renewed, _ = heartbeat(
            bound, session_id=bound["team_lead"]["session_id"], main_sha=SHA,
            now=NOW + timedelta(seconds=30), lease_seconds=60,
        )
        self.assertEqual(renewed["team_lead"]["state"], "BOUND")
        self.assertEqual(renewed["team_lead"]["expires_at"], "2026-09-17T12:01:30Z")

    def test_expired_writer_requires_recovery_takeover(self):
        claimed, work, _ = claim_work(
            state(), units(), work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW,
            lease_seconds=60, session_id="SES-OLD", run_id="RUN-OLD",
        )
        with self.assertRaisesRegex(MissionControlError, "RECOVERY_TAKEOVER"):
            claim_work(
                claimed, work, work_unit_id="WU-HIGH", agent_id="AGT-B", parent_agent_id="AGT-OW-TL-001",
                main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW + timedelta(seconds=61),
            )
        recovered, recovered_work, _ = claim_work(
            claimed, work, work_unit_id="WU-HIGH", agent_id="AGT-B", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="RECOVERY_TAKEOVER", authorized_by="", now=NOW + timedelta(seconds=61),
            session_id="SES-NEW", run_id="RUN-NEW",
        )
        self.assertEqual(recovered["fencing"]["last_issued_token"], 2)
        self.assertEqual(recovered["session_history"][0]["state"], "SUPERSEDED")
        self.assertEqual(recovered["claim_history"][0]["state"], "SUPERSEDED")
        self.assertEqual(recovered["lease_history"][0]["release_reason"], "RECOVERY_TAKEOVER")
        self.assertEqual(validate_runtime(recovered, recovered_work, now=NOW + timedelta(seconds=62)), [])

    def test_same_session_cannot_recover(self):
        claimed, work, _ = claim_work(
            state(), units(), work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW,
            lease_seconds=1, session_id="SES-OLD", run_id="RUN-OLD",
        )
        with self.assertRaisesRegex(MissionControlError, "fresh session_id"):
            claim_work(
                claimed, work, work_unit_id="WU-HIGH", agent_id="AGT-B", parent_agent_id="AGT-OW-TL-001",
                main_sha=SHA, authority_source="RECOVERY_TAKEOVER", authorized_by="", now=NOW + timedelta(seconds=2),
                session_id="SES-OLD", run_id="RUN-NEW",
            )

    def test_release_moves_records_to_history(self):
        claimed, work, _ = claim_work(
            state(), units(), work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW,
        )
        released, released_work, _ = release_work(
            claimed, work, session_id=claimed["active_sessions"][0]["session_id"], outcome="COMPLETE",
            main_sha=SHA, now=NOW + timedelta(seconds=1),
        )
        self.assertEqual(released_work[0]["status"], "COMPLETE")
        self.assertEqual(released["active_sessions"], [])
        self.assertEqual(released["active_claims"], [])
        self.assertEqual(released["active_leases"], [])
        self.assertEqual(len(released["session_history"]), 1)
        self.assertEqual(validate_runtime(released, released_work, now=NOW + timedelta(seconds=2)), [])

    def test_dependency_gate(self):
        work = units()
        work[1]["dependencies"] = ["WU-HIGH"]
        self.assertIsNone(select_next_work_unit(work, state(), niche_ids=["NIC-WEB"], now=NOW))
        work[0]["status"] = "COMPLETE"
        self.assertEqual(select_next_work_unit(work, state(), niche_ids=["NIC-WEB"], now=NOW)["work_unit_id"], "WU-LOW")

    def test_scope_collision_blocks_parallel_work(self):
        work = units()
        work[1]["resource_scopes"] = ["research/high"]
        claimed, current_work, _ = claim_work(
            state(), work, work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW,
        )
        self.assertIsNone(select_next_work_unit(current_work, claimed, niche_ids=["NIC-WEB"], now=NOW))

    def test_stale_active_claim_is_detected(self):
        claimed, work, _ = claim_work(
            state(), units(), work_unit_id="WU-HIGH", agent_id="AGT-A", parent_agent_id="AGT-OW-TL-001",
            main_sha=SHA, authority_source="HUMAN_OVERRIDE", authorized_by="HUM-ROB-001", now=NOW, lease_seconds=1,
        )
        errors = validate_runtime(claimed, work, now=NOW + timedelta(seconds=2))
        self.assertTrue(any(error.startswith("STALE_ACTIVE_CLAIM:") for error in errors))


if __name__ == "__main__":
    unittest.main()
