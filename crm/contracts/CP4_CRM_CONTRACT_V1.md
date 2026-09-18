# OASIS WEDDINGS — CP4 CRM / LEAD / ATTRIBUTION CONTRACT v1

Status: **DIRECTOR-ACCEPTED CONTRACT CANDIDATE · DDL NOT APPLIED**  
Work unit: `WU-OW-CP4-CRM-001` · Issue #12 · Branch `agent/cp4-crm-contract`

## 1. Decision

Use the existing Supabase project `oasis-prod` as infrastructure, but do **not** reuse the current B2B `public.leads` table for wedding couples.

The operational source of truth for OASIS WEDDINGS is an isolated `ow_*` domain:

- `public.ow_leads`
- `public.ow_lead_attribution`
- `public.ow_lead_consents`
- `public.ow_lead_events`

Public website submissions must flow:

`browser form → validated server-side endpoint → ow_* tables`

The browser never receives a service-role secret and never chooses `business_id`.

### Build vs buy

| Option | Decision | Reason |
|---|---|---|
| Supabase `oasis-prod` | **USE** | Already active, EU-hosted, Postgres/RLS primitives exist, no new platform needed. |
| Existing `public.leads` | **DO NOT USE FOR COUPLES** | B2B prospect schema is semantically wrong (`business_name`, web-quality fields, pain points, etc.). |
| HubSpot | **OPTIONAL DOWNSTREAM SYNC** | Read works; current write permission requires reauthorization; there is no legacy deal pipeline to preserve. |
| Airtable | **REJECT AS SOT** | No OASIS WEDDINGS base or migration advantage; would create another authority surface. |
| Custom CRM service | **DO NOT BUILD** | No demonstrated need beyond the existing Postgres/runtime primitives. |

## 2. Canonical lead boundary

Machine-readable contract: `crm/contracts/lead_contract.json`.

Minimum public capture:

- first name;
- email;
- wedding date;
- service interest;
- privacy-processing consent;
- optional phone, partner first name, venue/location, budget band.

Server-only fields include owner, lead score, qualification, loss reason, duplicate linkage, contract/deposit timestamps and booked value.

`business_id` is resolved from trusted server configuration (`OASIS_WEDDINGS_BUSINESS_ID`), never from form input.

## 3. Idempotency and duplicates

`submission_key` is unique per `business_id`.

- Retry with the same submission key returns the existing lead.
- Email/phone similarity does **not** auto-merge people.
- Suspected identity duplicates are flagged through `duplicate_of_lead_id` for human review.
- State-change events use a second idempotency key scoped by `business_id`.

This prevents network retries from creating duplicate enquiries without collapsing legitimate repeat enquiries.

## 4. Pipeline state machine

Machine-readable contract: `crm/contracts/pipeline_contract.json`.

Canonical states:

`NEW → CONTACTED → QUALIFIED → DISCOVERY_BOOKED → DISCOVERY_DONE → PROPOSAL → VERBAL_YES → CONTRACT_SENT → DEPOSIT_PENDING → WON | LOST`

Key rules:

- `WON` requires a signed contract, a recorded deposit receipt and `deposit_amount_eur > 0`.
- A zero-deposit/waived-deposit booking is an explicit contract exception; automation must not silently mark it `WON`.
- `LOST` requires a canonical loss reason.
- `LOST → CONTACTED` requires an admin/founder human override plus reopen reason.
- `WON` is terminal in CRM; later cancellation/refund belongs to post-sale booking/finance lifecycle, not a CRM status rewrite.

Canonical lost reasons:

`not_a_fit, budget, date_unavailable, location, service_mismatch, ghosted, competitor, duplicate, spam, cancelled_event, other`

## 5. Attribution contract

Attribution is separated from contact PII in `ow_lead_attribution`.

Supported fields:

- landing page and referrer;
- first-touch + last-touch source / medium / campaign / term / content;
- optional Google/Meta click identifiers;
- consent signal used when those identifiers were captured.

Rules:

- first touch is immutable after lead creation;
- last touch may update until the lead becomes `WON` or `LOST`;
- generic product analytics must not receive name, email or phone;
- client analytics must not receive CRM lead IDs;
- ad click identifiers are optional, server-side only, and remain disabled unless the project CMP/privacy configuration explicitly permits capture and retention;
- offline-conversion exports are a later integration and must be separately consent/permission reviewed.

## 6. Consent and privacy boundary

Consent history is append-only in `ow_lead_consents`.

Purposes:

- `privacy_processing`
- `email_marketing`
- `whatsapp_marketing`
- `ad_measurement`

Engineering defaults:

- enquiry processing consent/legal basis is distinct from marketing consent;
- marketing toggles are never pre-assumed from enquiry submission;
- no contact PII in attribution or generic analytics contracts;
- consent evidence stores policy version/source, not unnecessary browser fingerprinting;
- exact retention periods and ad-measurement activation remain gated by the final CMP/privacy review before production.

## 7. SLA v1 — internal operating targets

These are approved as internal CP4 targets, not public promises.

| Stage | Target |
|---|---|
| automated acknowledgement | ≤ 2 minutes |
| first human response, 09:00–20:00 Europe/Madrid | ≤ 30 minutes |
| first human response outside that window | by 10:00 next local day |
| qualification attempt | ≤ 24 hours from lead creation |
| proposal after completed discovery | ≤ 24 hours |
| contract after verbal yes | ≤ 4 business hours |
| stale follow-up cadence | 24h → 72h → 7d → 14d |

Escalation:

- missed first-response target → owner alert;
- no human activity at 24h → CRM stale event + owner escalation;
- proposal overdue → sales owner + Director queue;
- no answer after final 14d follow-up → `LOST/ghosted` only after human review.

## 8. Canonical events

### CRM/audit events

`lead_created, lead_acknowledged, lead_contacted, lead_qualified, discovery_booked, discovery_cancelled, discovery_completed, proposal_sent, verbal_yes_recorded, contract_sent, contract_signed, deposit_received, lead_won, lead_lost, lead_reopened, owner_assigned, duplicate_flagged, consent_updated, attribution_captured`

### Web/analytics events

`ow_lead_form_view, ow_lead_form_start, ow_lead_form_submit, ow_lead_submit_success, ow_lead_submit_error, ow_cta_click, ow_discovery_booking_start, ow_discovery_booking_complete`

Web analytics payloads must be non-PII.

## 9. Web W2 server contract

The future endpoint should accept only the public lead boundary and:

1. validate body size/types and normalize email/phone;
2. ignore/reject server-only fields;
3. resolve `business_id` from server config;
4. enforce rate limiting + bot/honeypot controls at the edge/server layer;
5. upsert by `(business_id, submission_key)` idempotently;
6. create the privacy-consent event;
7. persist attribution separately;
8. append `lead_created`;
9. return a non-sensitive stable acknowledgement payload;
10. emit notification/acknowledgement jobs only after the DB write succeeds.

No Web W2 implementation is part of this PR.

## 10. Migration/integration plan

1. Mission Control accepts this contract PR.
2. Create/identify one canonical `public.businesses` row for OASIS WEDDINGS.
3. Set `OASIS_WEDDINGS_BUSINESS_ID` in the server runtime.
4. Review `crm/pipeline/001_ow_crm_domain.sql`.
5. Apply DDL through Supabase migration tooling in a separate approved work unit.
6. Run RLS and idempotency integration tests.
7. Implement Web W2 server endpoint against this contract.
8. Add internal notification flow.
9. Only then enable optional HubSpot sync after write authorization.
10. Paid/offline conversion export remains blocked until consent/CMP + event-quality gates pass.

There is no destructive migration and no legacy wedding CRM data to import based on current evidence.

## 11. Promotion gates

CP4 contract passes only if:

- B2B `public.leads` remains untouched;
- `ow_*` domain is isolated and RLS-enabled;
- anon direct writes are absent;
- retry semantics are deterministic;
- PII is separated from generic attribution analytics;
- `WON` condition is mechanically unambiguous;
- event log and consent history are append-only to ordinary authenticated users;
- DDL remains unapplied in this PR;
- contract tests pass.

Verification command once checked out:

```bash
python -m unittest crm.tooling.test_cp4_contract -v
```
