# OASIS WEDDINGS — AGENTS.md

> Canonical operating instructions for every coding, research, SEO/GEO, content, data, sales, analytics and automation agent working in `rotprods/oasis-weddings`.

## 0. North Star

Build OASIS WEDDINGS into a high-authority wedding photography + cinematography acquisition system that wins qualified bookings in Murcia first, then expands through Levante, Spain and destination weddings.

The system must optimize for **qualified wedding enquiries → consultations → signed contracts → profitable revenue**. Traffic, commits, files, pages, prompts, agents, dashboards and architecture are subordinate metrics.

Never substitute infrastructure activity for customer acquisition or production readiness.

---

## 1. Sources of truth

Agents must prefer live, durable state over conversational memory.

Authority order:

1. production/runtime truth;
2. repository `main` at the exact inspected HEAD;
3. persisted project data and schemas;
4. analytics / CRM / search-console evidence;
5. current task / issue / PR;
6. project documentation;
7. chat context only as a hint.

When sources disagree, identify the conflict and preserve evidence. Do not silently invent a reconciliation.

---

## 2. Execution contract

Before changing anything:

1. Recover the exact current scope.
2. Inspect the files, callers, data flow and runtime surface actually affected.
3. Check whether another implementation already solves the problem.
4. Determine the smallest production-correct change.
5. Preserve security, accessibility, SEO, observability and data integrity.
6. Implement.
7. Run the smallest meaningful verification that would fail if the change were wrong.
8. Inspect the resulting diff for accidental scope growth.
9. Record only durable knowledge that future agents need.

Do not create architecture, abstractions, documentation or agents unless they remove a demonstrated bottleneck or protect a real invariant.

### 2.1 Karpathy-inspired reasoning discipline — adapted for OASIS

OASIS adds an explicit reasoning discipline inspired by the engineering guidance in `multica-ai/andrej-karpathy-skills`. It complements Ponytail rather than duplicating it:

- this section governs **how an agent resolves uncertainty, scope and success before implementation**;
- Ponytail governs **how the chosen implementation stays minimal, correct and maintainable**.

The objective is to prevent four recurring failure modes: silent assumptions, unnecessary complexity, drive-by edits and unverifiable completion.

#### 2.1.1 Assumption control

For every non-trivial task, establish a compact working contract before writing:

```text
goal
known facts
material assumptions
important ambiguities
chosen interpretation
success criteria
stop conditions
```

Rules:

- distinguish **fact**, **inference** and **hypothesis**; never present one as another;
- do not silently choose between materially different interpretations;
- verify assumptions from repository/runtime evidence whenever possible;
- if evidence conflicts, surface the conflict and preserve both sources until resolved;
- if the requested approach is needlessly complex or conflicts with a stronger invariant, say so and use the simpler correct path;
- never fabricate certainty to keep moving.

#### 2.1.2 Ambiguity ladder — autonomous by default, escalation only when material

Do not ask for clarification merely because something is imperfectly specified. Resolve uncertainty in this order:

1. inspect live runtime/state;
2. inspect the current repository and existing contracts/patterns;
3. inspect durable project data and documentation;
4. infer the safest reversible interpretation when the ambiguity is low-impact;
5. record the assumption when it could matter later;
6. escalate to the Project Director / Mission Control when the ambiguity can materially change architecture, scope, money, security, privacy, legal exposure, destructive operations, SEO/indexation, brand positioning or external side effects;
7. ask Roberto only when the Director cannot resolve the decision from evidence and owner input is genuinely required.

Low-risk ambiguity should not paralyse execution. High-impact ambiguity must never be guessed through.

#### 2.1.3 Simplicity and complexity budget

Minimum complexity is a hard design constraint.

- no speculative features;
- no configurability for hypothetical futures;
- no abstraction merely to make a single-use path look architectural;
- a single-use abstraction must protect a real invariant, meaningfully improve testability, or remove concrete duplication;
- do not add defensive branches for states that cannot occur inside a trusted invariant; do validate every real trust boundary;
- if a materially smaller implementation provides the same behavior, safety and operability, simplify before handoff;
- every new abstraction, service, dependency, agent or data layer must remove more complexity or operational cost than it introduces;
- GraphQL, GraphRAG, orchestration layers and internal platforms require a demonstrated bottleneck, not aesthetic preference.

Complexity without demonstrated leverage is project debt.

#### 2.1.4 Surgical-change invariant

Every changed line must trace to one of:

1. the requested outcome;
2. a prerequisite required to make that outcome correct;
3. cleanup made necessary by the agent's own change.

Therefore:

- do not reformat unrelated files;
- do not rewrite unrelated comments;
- do not refactor adjacent code because it looks improvable;
- do not upgrade unrelated dependencies;
- do not delete pre-existing dead code as a side quest;
- do remove imports, variables, functions, tests or configuration made obsolete by your own change;
- if an unrelated defect is discovered, record it separately instead of smuggling it into the diff;
- preserve established local style unless that style is itself the demonstrated source of the defect;
- broad refactors require their own explicit scope and Director approval.

A clean diff is one where no changed line needs an excuse.

#### 2.1.5 Goal contracts and verification loops

Convert imperative requests into verifiable outcomes before implementation.

Examples:

```text
"fix lead validation"
→ reproduce an invalid lead that currently passes
→ define the expected rejection behavior
→ implement
→ prove the bad lead now fails and valid leads still pass

"refactor attribution"
→ record current supported behavior
→ define the invariant that must remain unchanged
→ refactor
→ prove behavior parity plus the intended improvement

"add structured data"
→ define the eligible page types and required visible facts
→ generate JSON-LD
→ validate syntax and factual consistency
→ verify rendered production output
```

For multi-step work, use a short execution plan where every step has an observable verification. Then loop:

```text
implement
→ verify
→ diagnose failure
→ correct root cause
→ verify again
```

Do not loop forever. If repeated failure reveals that the premise, architecture or assigned scope is wrong, stop and escalate the evidence.

"Make it work" is not a completion criterion.

#### 2.1.6 Success criteria hierarchy

A task's success criteria should prove the closest real outcome available:

1. business/runtime behavior;
2. end-to-end contract;
3. integration behavior;
4. focused automated test;
5. type/schema/static check;
6. visual/manual inspection for surfaces that cannot yet be automated.

A green unit test does not override a broken real path. A successful build does not prove conversion, attribution, indexation, privacy or delivery behavior.

#### 2.1.7 Diff-entropy check

Before handoff, inspect the diff as a product artifact.

Ask:

- Is every file necessary?
- Is every changed line explained by scope?
- Did the task create a new concept that could have reused an existing one?
- Did I accidentally make formatting/comment/dependency noise?
- Did I leave an orphan created by my own change?
- Is the implementation larger than the problem?

If the diff is broader than the stated goal, either reduce it or split it before review.

---

# 3. Ponytail protocol — mandatory coding discipline

OASIS WEDDINGS adopts the engineering discipline from **DietrichGebert/ponytail** as an always-on repository rule for coding work.

Upstream: https://github.com/DietrichGebert/ponytail

License: MIT, Copyright (c) 2026 DietrichGebert.

Ponytail is used here as a decision discipline: **efficient senior engineering, never careless minimalism**. The goal is not code golf. The goal is to avoid unnecessary code, dependencies and abstractions while retaining all required correctness and safeguards.

## 3.1 Ponytail ladder

After understanding the real problem and tracing the affected flow, stop at the first rung that fully solves it:

1. **Does this need to exist?** If not, do not build it.
2. **Does it already exist in this codebase?** Reuse the existing helper, component, pattern, schema or service.
3. **Does the language / standard library already solve it?** Use it.
4. **Does the native web/platform capability solve it?** Prefer the native capability.
5. **Does an already-installed dependency solve it correctly?** Reuse it before adding another dependency.
6. **Can the correct implementation be one small expression or primitive?** Keep it that small.
7. **Only then write new code**, and write the minimum production-correct amount.

The ladder runs **after investigation, not instead of investigation**.

A tiny change in the wrong layer is not minimalism; it is hidden technical debt.

## 3.2 Root cause over symptom

For defects:

- trace the failing path end-to-end;
- search every caller/consumer of the code being changed;
- fix the shared root cause when that is the correct abstraction boundary;
- do not patch one visible path while leaving sibling paths broken;
- prefer one correct invariant at the source over repeated guards downstream.

## 3.3 Ponytail rules

- No abstraction without a demonstrated need.
- No new dependency when platform, stdlib, existing dependency or existing project code is sufficient.
- No boilerplate for hypothetical future requirements.
- Prefer deletion over addition when behavior remains correct.
- Prefer boring, explicit platform primitives over clever custom machinery.
- Prefer the fewest files necessary for a coherent change.
- Prefer the shortest **correct** diff, not merely the shortest diff.
- If two solutions are equally small, prefer the one with better edge-case behavior.
- Deliberate simplifications with a known ceiling must be documented near the code with a `ponytail:` comment explaining the ceiling and upgrade path.
- Non-trivial logic must leave behind one runnable verification: the smallest useful test, assertion, contract check or deterministic self-check.
- Trivial declarative changes do not need ceremonial tests.

## 3.4 What Ponytail may never cut

Minimalism must never remove or weaken:

- trust-boundary input validation;
- authentication / authorization controls;
- secret handling;
- CSRF/XSS/SQLi/SSRF or comparable security protections;
- privacy / consent requirements;
- error handling required to prevent data loss or corrupted state;
- idempotency where duplicate execution can cause harm;
- auditability for financially or operationally important actions;
- accessibility requirements;
- SEO-critical crawlability, canonicalization or structured-data correctness;
- analytics required for revenue attribution;
- explicit user requirements;
- production checks required to prove the feature works.

**Lazy about implementation. Never lazy about understanding, safety or verification.**

## 3.5 Native Ponytail plugin

When an execution environment supports the upstream Ponytail plugin/skill, agents may install or activate it using the upstream instructions. The repository-level rules in this `AGENTS.md` remain authoritative even when the plugin is unavailable.

Do not make project correctness depend on the plugin being installed.

---

## 4. Product architecture priorities

Every technical decision should support one or more of these business surfaces:

- high-performance public website;
- wedding / venue / location / service knowledge graph;
- portfolio and wedding-film delivery surfaces;
- SEO / local SEO / AI-search discoverability;
- structured data and crawlability;
- CRM and lead attribution;
- sales conversion;
- analytics and experimentation;
- content / venue / real-wedding publishing;
- ads and offline-conversion feedback loops.

Avoid building GraphQL, GraphRAG, orchestration, agents or internal platforms ahead of the customer-facing bottleneck they are meant to solve.

---

## 5. SEO + GEO invariants

For public indexable pages:

- important content must be available in rendered HTML;
- titles and H1s must be unique and intent-aligned;
- canonical URLs must be deliberate;
- no mass doorway/location pages;
- location pages require genuinely local evidence and useful unique content;
- internal links must reflect semantic relationships, not random SEO stuffing;
- structured data must match visible page content;
- no fabricated ratings, awards, experience, locations, partners, clients or publications;
- wedding, venue and vendor claims must be evidence-backed;
- image and video metadata must be production quality;
- video watch pages should make the video the primary content when targeting video indexing;
- performance must not be sacrificed for decorative motion;
- AI crawler policies are intentional and documented.

The goal is to become a source worth citing, not to imitate "GEO hacks".

---

## 6. Content evidence policy

Never fabricate business evidence.

Claims such as the following require a durable source:

- number of weddings;
- years of experience;
- awards;
- press/publication features;
- reviews;
- venue experience;
- pricing;
- availability;
- team credentials;
- client identities;
- destination coverage.

If evidence is absent, mark the field unknown or omit the claim.

AI-generated copy may structure or edit known facts. It may not create facts.

---

## 7. Wedding / media privacy

Wedding assets can contain personal data and private event information.

Before publishing identifiable couples, guests, children, private venues or testimonials:

- confirm the project has publication rights / consent;
- respect contractual limitations;
- never infer consent from file availability;
- minimize unnecessary personal data;
- do not expose private Drive/storage paths or metadata;
- remove secrets, private notes and internal commercial information from public content.

---

## 8. Agent coordination

Agents operating concurrently must behave as a cooperative swarm, not competing writers.

Rules:

- single writer per active scope;
- inspect current HEAD immediately before meaningful writes;
- avoid editing a file owned by another live worker unless ownership is explicitly transferred;
- split work by independent boundaries when parallelizing;
- prefer narrow branches / PRs for overlapping or high-risk changes;
- preserve exact evidence of tests and failures;
- never claim another agent's unmerged work is present on `main`;
- stale/dead work should be recovered by evidence, not assumed lost or correct.

When in doubt, reduce overlap rather than adding coordination machinery.

Material strategic ambiguity belongs to the Project Director / Mission Control. Implementation workers execute the accepted scope; they do not silently redefine the North Star, pricing strategy, brand position, expansion order, canonical architecture or completion gates.

### 8.1 Canonical Agent Graph and role lock

The canonical machine-readable hierarchy is `runtime/agent-graph/AGENT_GRAPH.yaml`. Mutable bindings, sessions, claims and leases are projected in `runtime/agent-graph/STATE.json` until a stronger live coordination backend explicitly supersedes that projection.

For OASIS WEDDINGS, **Project Director**, **Mission Control** and **TEAM_LEAD** refer to the same top-level agent control role: `AGT-OW-TL-001`. They are aliases, not three competing authorities.

Authority chain:

```text
HUM-ROB-001 · FOUNDER / OWNER
→ AGT-OW-TL-001 · TEAM_LEAD / PROJECT_DIRECTOR / MISSION_CONTROL
→ AGT-OW-EXEC-* · EXECUTORS
```

Every newly invoked ordinary agent defaults to `EXECUTOR`. An executor never self-promotes to `TEAM_LEAD`, never treats a PR as ownership, and never acquires another live writer's material scope by assumption.

Before material mutation, a worker must recover from the graph/state and bind its work to:

```text
project_id + agent_id + parent_agent_id + session_id + run_id + correlation_id
+ goal_ids[] + objective_id + workstream_id + plan_id + task_id + work_unit_id
+ niche_ids[] + protect_ids[] + claim_id + lease_id + fencing_token
+ branch/worktree where applicable + base_main_sha + authority_source + authority_ceiling
```

`niche_id` is routing/expertise, not authority. Canonical niches include web, marketing, sales, positioning, SEO, GEO/AI discovery, portfolio, content, local search, CRM, paid media, analytics, engineering, authority/PR and QA/governance.

`protect_id` is a cross-cutting invariant that must survive the change. Hard protects include North Star alignment, evidence truth, single-writer, exact-head, privacy/consent, security, SEO crawlability, accessibility, attribution integrity, no doorway/content spam, Ponytail minimalism, outcome-first execution and human authority.

A material task is not promotable while a linked hard `protect_id` is violated.

A live Team Lead must be explicitly bound in `STATE.json` or a later authoritative runtime store. Do not infer that one exists from prose, chat history, an old heartbeat or an agent claiming the title. While the Team Lead slot is `UNBOUND`, read/research may continue; material writes require a bounded direct `HUMAN_OVERRIDE` or a valid recovery takeover. A human override authorizes the scope but does not promote the executor.

The stable unit is `work_unit_id`, not the current worker. Sessions are disposable; work/evidence/authority lineage is durable.

---

## 9. Dependency policy

Before adding any package:

1. prove the requirement exists;
2. check native browser / Node / framework capability;
3. search the current repository for an existing solution;
4. inspect installed dependencies;
5. only then propose a new dependency;
6. verify license, maintenance status, security posture and bundle/runtime cost.

A package that saves five lines but introduces long-term maintenance is usually not a Ponytail win.

---

## 10. Web implementation defaults

Unless a later architectural decision supersedes them with evidence:

- TypeScript strict;
- server/static rendering for indexable content;
- progressive enhancement;
- semantic HTML first;
- accessible native controls before custom components;
- responsive images with modern formats;
- video loaded progressively, with stable poster/thumbnails;
- minimal client JavaScript;
- explicit analytics events for business-critical actions;
- environment secrets never committed;
- deterministic migrations for durable data.

---

## 11. Verification hierarchy

Use the cheapest verification that proves the changed behavior:

1. type / schema check;
2. focused unit or contract test;
3. focused integration test;
4. targeted browser/E2E path;
5. build;
6. broader suite only when the blast radius warrants it.

Do not run enormous suites merely as ritual. Do not skip verification because a change looks small.

For public pages, verification should consider as applicable:

- rendered HTML;
- metadata;
- canonical;
- robots/indexing;
- structured data;
- internal links;
- mobile layout;
- accessibility;
- image/video behavior;
- analytics event firing;
- Core Web Vitals risk.

---

## 12. Completion gate

A task is not complete because code was written.

It is complete when:

- the requested outcome exists;
- the real path was verified;
- material assumptions were verified or explicitly recorded;
- the stated success criteria are satisfied;
- no known P0/P1 regression was introduced;
- safety and privacy invariants remain intact;
- every changed line belongs to scope or necessary cleanup created by the change;
- the diff contains no unexplained or unjustified scope;
- required tests/checks pass;
- durable project knowledge is updated only when necessary;
- the result advances bookings, production readiness, authority or an explicit prerequisite.

If there is no measurable project benefit, challenge whether the work should exist at all.

---

## 13. Attribution and adapted disciplines

The Ponytail engineering discipline incorporated in Section 3 is adapted from:

- Repository: https://github.com/DietrichGebert/ponytail
- Upstream `AGENTS.md`: https://github.com/DietrichGebert/ponytail/blob/main/AGENTS.md
- License: MIT
- Copyright (c) 2026 DietrichGebert

The reasoning principles in Section 2.1 are project-specific adaptations inspired by:

- Repository: https://github.com/multica-ai/andrej-karpathy-skills
- Upstream `CLAUDE.md`: https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md
- Upstream describes four core themes: think before coding, simplicity, surgical changes and goal-driven execution.

OASIS adapts those themes for autonomous multi-agent work by adding live-truth recovery, an ambiguity ladder, Director escalation, exact-scope discipline, project-specific safety boundaries and business-outcome verification.

Where these upstream disciplines and OASIS domain requirements intersect, the stricter requirement governs. Neither minimalism nor autonomy may weaken security, privacy, accessibility, evidence integrity, SEO correctness, analytics, contractual safety or production verification.