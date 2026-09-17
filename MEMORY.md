# OASIS WEDDINGS — DURABLE MEMORY

> Durable project decisions only. This is not a chat transcript, not a task list and never a store for client PII, secrets or private wedding details.

## Memory law

Allowed:
- approved positioning and offer logic;
- architecture decisions;
- operating invariants;
- validated research conclusions;
- known failure patterns;
- experiment outcomes;
- production/SEO/sales rules that future agents must preserve.

Forbidden:
- client emails or phones;
- payment details;
- private messages;
- secrets/API keys;
- private wedding notes;
- guest/minor data;
- unverified claims presented as facts.

Each durable item should include `date`, `status`, `evidence/source` and, when relevant, `supersedes`.

---

## MEM-001 — Business North Star
- Date: 2026-09-17
- Status: ACTIVE
- Decision: OASIS optimizes for qualified wedding enquiries → consultations → signed contracts → profitable booked contribution margin.
- Consequence: traffic, agent count, commits, documents and architecture are subordinate metrics.
- Source: `AGENTS.md`, `NORTH_STAR.md`.

## MEM-002 — Geographic expansion order
- Date: 2026-09-17
- Status: ACTIVE
- Decision: Murcia first; Levante/Spain/destination only after acquisition economics, proof and production capacity are repeatable.
- Source: `NORTH_STAR.md`.

## MEM-003 — Truth/evidence policy
- Date: 2026-09-17
- Status: ACTIVE
- Decision: never fabricate reviews, awards, venue experience, clients, pricing, availability, publications or authority.
- Consequence: unknown remains unknown; editorial/styled work must not be presented as client weddings.
- Source: `AGENTS.md`.

## MEM-004 — Engineering discipline
- Date: 2026-09-17
- Status: ACTIVE
- Decision: Ponytail minimalism + Karpathy-inspired assumption/scope/verification discipline govern implementation.
- Consequence: smallest production-correct change; no speculative abstraction; surgical diffs; real-path verification.
- Source: `AGENTS.md`.

## MEM-005 — Agent authority
- Date: 2026-09-17
- Status: ACTIVE
- Decision: `AGT-OW-TL-001` is Team Lead / Project Director / Mission Control. Executors never self-promote.
- Consequence: material scope requires claim + lease + fencing + exact-head context.
- Source: `runtime/agent-graph/AGENT_GRAPH.yaml`, `AGENTS.md`.

## MEM-006 — Web worker isolation
- Date: 2026-09-17
- Status: ACTIVE
- Fact: draft PR #5 owns current web/design foundation scope on `agent/web-design-assetsgraph`.
- Rule: Mission Control does not edit that worker's files while the scope is under review.
- Source: GitHub issue #4 and PR #5.

## MEM-007 — Web preproduction indexing
- Date: 2026-09-17
- Status: ACTIVE_PENDING_REVIEW
- Fact: PR #5 intentionally applies global `noindex` during preproduction to avoid publishing unproven content.
- Promotion implication: public indexation must remain blocked until proof, copy, schema and conversion/privacy gates are satisfied.
- Source: PR #5 evidence packet.

## MEM-008 — Knowledge/data architecture
- Date: 2026-09-17
- Status: ACTIVE
- Decision: start with relational canonical entities + provenance. Add embeddings only for demonstrated retrieval use. Add graph projections before considering a graph database. GraphRAG/GraphQL require a proven bottleneck.
- Source: `NORTH_STAR.md`, `AGENTS.md`.

## MEM-009 — Architecture freeze
- Date: 2026-09-17
- Status: ACTIVE
- Decision: three consecutive waves without external business output trigger `ARCHITECTURE_FREEZE`.
- Allowed during freeze: web launch blockers, portfolio/proof, CRM/sales, paid experiments, partner acquisition, production and critical safety.
- Source: `NORTH_STAR.md`.

## MEM-010 — Current uncertainty
- Date: 2026-09-17
- Status: OPEN
- Known unknowns: verified current portfolio inventory, publication rights, real review corpus, canonical pricing, current CRM/account configuration, production capacity, real venue/planner relationships.
- Consequence: these become CP0/CP1 discovery tasks; agents must not guess them.
