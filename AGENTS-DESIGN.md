# OASIS WEDDINGS — AGENTS-DESIGN.md

> Canonical design, web-experience, motion, 3D and portfolio-asset operating contract for `rotprods/oasis-weddings`.
>
> This file is **subordinate to `AGENTS.md`**. If the two conflict, `AGENTS.md`, the live Agent Graph, explicit human authority and stronger runtime truth win.

---

## 0. Scope, authority and worker contract

This document governs work inside:

- `G-OW-0200` — WEB_CONVERSION_PRODUCT;
- `G-OW-0500` — PORTFOLIO_PROOF where the website consumes/presents it;
- `G-OW-1300` — ENGINEERING_PLATFORM only where required by the public web product;
- `NIC-WEB-001`, `NIC-ENGINEERING-001`, plus read-only dependencies on portfolio, SEO, GEO and QA niches.

Current worker bootstrap:

```text
project_id: PRJ-OW-001
agent_id: AGT-OW-EXEC-WEB-001
parent_agent_id: AGT-OW-TL-001
correlation_id: COR-OW-ISSUE-4
workstream_id: WS-OW-WEB-001
plan_id: PLN-OW-WEB-001
work_unit_id: WU-OW-WEB-001
authority_source: HUMAN_OVERRIDE
authority_ceiling: CLAIMED_SCOPE_ONLY
branch: agent/web-design-assetsgraph
base_main_sha: 662555023bb8b63e49c86678ab61c5bcb216cc76
claim_request: GitHub issue #4
```

The Team Lead role `AGT-OW-TL-001` was `UNBOUND` when this scope was claimed. Issue #4 is therefore a durable **claim request/handoff**, not fabricated Team Lead approval. A later authoritative Team Lead binding, claim/lease backend or higher fencing token supersedes this bootstrap and must reconcile the scope before promotion.

Hard protects inherited from `AGENTS.md`:

`PROT-NORTHSTAR-001`, `PROT-TRUTH-001`, `PROT-SINGLEWRITER-001`, `PROT-EXACTHEAD-001`, `PROT-PRIVACY-001`, `PROT-SECURITY-001`, `PROT-SEO-001`, `PROT-A11Y-001`, `PROT-ATTRIBUTION-001`, `PROT-PONYTAIL-001`, `PROT-OUTCOMEFIRST-001`, `PROT-HUMAN-001`.

---

# 1. North Star for the web product

The website is not an art experiment and not a portfolio archive. It is a premium acquisition product that must convert qualified couples into **availability enquiries → consultations → signed profitable contracts**, while compounding organic/AI discovery and proof.

Every section must do at least one of five jobs:

1. **Attract** — satisfy high-intent search or referral intent.
2. **Prove** — show real, permissioned photography/film and credible evidence.
3. **Differentiate** — make the OASIS creative point of view legible.
4. **Resolve** — answer objections, fit, process, scope and expectations.
5. **Convert** — move the visitor toward a low-friction availability enquiry.

Anything that does none of these is a deletion candidate.

## 1.1 Experience thesis

Target experience: **cinematic editorial + human intimacy + technical restraint**.

The site should feel closer to a high-end film/editorial experience than a template wedding site, but it may never sacrifice:

- indexable rendered content;
- fast first paint and LCP;
- accessible navigation and controls;
- stable layout;
- readable copy;
- discoverable calls to action;
- low-end mobile usability;
- reduced-motion support;
- portfolio privacy/consent;
- attribution and measurement.

A static, clear, beautiful experience is the baseline. Motion, Three.js, R3F or WebGPU are progressive enhancement layers.

---

# 2. Evidence: recovered wedding-site benchmark

A prior OASIS research pass on **17 September 2026** produced a benchmark cohort of **59 wedding photography / film sites**. The currently recoverable durable summary does **not** support the stronger claim that all 59 were “the top sites in Spain”. Roberto recalls a narrower set of ~49 Spanish/high-ranking sites; treat that as a revalidation target, not as a fact already proven.

Recovered cohort:

SuperWeddings, Dalmare, Kudrya, I Do Films, Emotion & Motion, Joy Zamora, Sandra Mañas, Óscar Guillén, Rice and Roses, Vanessa & Ivo, Tipos, ARTEFOTO, The Ibiza Photographer, MOSU, Unique Wedding, Solvèra, M2VISUALSTUDIO, iArtist, La Vie en Film, Lof-it, Darista, Rocío Vega, Feinheidt, SSY, Alisby, Michel Films, Pai Pai, Paramonova, Santiago Boceta, SLOWL, OS Pixel, Laguna Santa, Aenaon, Cordès, Robert Marcillas, Bottega53, Nordica, Christina Hohner, Liller, Foudamour, Cassandra Ladru, Kirsten Noelle, Caro Weiss, Albert Palmer, Kayla Fisher, Hafenliebe, David Bastianoni, Danilo & Sharon, Guy Collier, Lieben, Brandi Toole, A Fist Full Of Bolts, Sergio Espin, Cayuela, Genius, Benja Caballero, Fotobodas, FotoMadrid/Olivier Melín and Nargiza.

## 2.1 Patterns recovered from the benchmark

Patterns to preserve because they support discovery, proof or conversion:

- entity-oriented SEO rather than keyword-stuffed page farms;
- homepage with crawlable text plus a clear CTA, not only fullscreen media;
- real wedding pages that are independently indexable;
- venue/location pages only when supported by genuinely useful local or first-hand evidence;
- photography + film capability presented coherently;
- portfolio broken into intentional collections, not an undifferentiated gallery dump;
- credible external authority, reviews and publications when evidence exists;
- pricing/collections may use evidence-backed “from” anchors instead of hiding every commercial signal;
- contextual reviews near the relevant service/proof;
- freshness through new real weddings, guides, venue knowledge and films;
- strong internal relationships between service ↔ wedding ↔ venue ↔ location ↔ guide;
- `VideoObject` and video-first watch/detail pages when targeting video discovery;
- SSR/SSG or equivalent server-rendered HTML for critical content;
- forms that qualify with date, venue/location, service and useful fit/budget signals without becoming interrogation forms.

## 2.2 Anti-copy rule

Benchmark sources are evidence and pattern inputs. They are **not** design templates.

Never:

- clone a competitor’s layout, identity, composition or copy;
- imitate one site so closely that OASIS loses independent creative authorship;
- fabricate awards, reviews, venues, experience or results because another site has them;
- produce near-duplicate locality pages solely because competitors rank with them.

Synthesize patterns; do not plagiarize executions.

---

# 3. Upstream skill stack and activation law

The following upstream repositories are approved knowledge sources for design implementation. They are guidance, not authority over `AGENTS.md` or this file.

## 3.1 `cazala/webgpu-skill`

Use only when a GPU-native effect has a demonstrated product/creative reason that CSS/DOM/Canvas/Three cannot meet efficiently enough.

Imported rules:

- define explicit capability, data, pass, presentation and lifecycle contracts;
- build the smallest observable GPU result first;
- gate optional GPU features and provide fallback/reduced modes;
- resize from CSS size + DPR and clamp to device limits;
- do not create GPU resources every frame unless descriptors truly change;
- surface shader compilation/validation/device-loss errors;
- teardown observers/loops/resources cleanly;
- never compile network-fetched or user-supplied WGSL by default;
- correctness and compatibility precede micro-optimization.

**OASIS override:** no WebGPU in the critical rendering path. The page must remain complete, usable and conversion-capable without it.

## 3.2 `CloudAI-X/threejs-skills`

Use for direct Three.js scenes when React ownership adds no value or a self-contained canvas is the simpler correct tool.

Imported rules:

- explicit scene/camera/renderer ownership;
- cap pixel ratio instead of blindly rendering at full device DPR;
- resize camera projection and renderer correctly;
- use delta-time animation, not frame-count-dependent movement;
- dispose geometries/materials/textures/renderers when ownership ends;
- minimize draw calls, use instancing/LOD/culling when justified;
- avoid expensive world-space calculations in hot loops;
- loading/error state is part of the experience contract.

## 3.3 `EnzeD/r3f-skills`

Preferred when the site’s React tree should declaratively own a Three.js experience.

Imported rules:

- inspect installed React/R3F/Three/Drei versions before selecting APIs;
- do not upgrade the application merely to match a skill recipe;
- keep one render loop per scene;
- React state for discrete UI, refs for transient per-frame motion;
- use delta time;
- prefer `frameloop="demand"` when a scene can rest;
- avoid reconstructing expensive geometry/materials through unstable props;
- respect R3F resource ownership/disposal semantics;
- WebGPU/TSL remains optional, not silently assumed;
- verify browser render, console, resize and unmount/remount behavior.

## 3.4 `freshtechbro/claudedesignskills`

Use primarily as a meta-pattern library for modern web design and integration choices.

Imported rules:

- performance-first design;
- progressive enhancement: core content works without non-essential JavaScript;
- meaningful micro-interactions, not motion for motion’s sake;
- large editorial typography and deliberate negative space may be used when they improve hierarchy;
- lazy-load image/video/3D media;
- use transform/opacity for animation where possible;
- custom cursor effects must disappear on touch and respect reduced motion;
- design systems must encode repeatable decisions rather than one-off styling;
- personalization or analytics must not cause layout shift or violate privacy expectations.

**OASIS override:** aesthetic trends such as glassmorphism, custom cursors, 3D scrollytelling or oversized type are optional ingredients. They are never defaults simply because a skill documents them.

## 3.5 `greensock/gsap-skills`

Preferred motion engine when timeline choreography or scroll-linked motion materially improves storytelling.

Imported rules:

- in React/Next, prefer `useGSAP()` with a scoped ref;
- GSAP/ScrollTrigger execute client-side, never during SSR;
- cleanup/revert every context and remove listeners;
- prefer transforms and opacity over layout-heavy animation;
- use stagger/quickTo where appropriate instead of spawning unnecessary tweens;
- use `will-change` only on elements that actually animate;
- pin only when necessary;
- pause/kill off-screen or inactive work;
- test ScrollTrigger and animation behavior on lower-end devices;
- respect `prefers-reduced-motion` and provide non-animated equivalents.

---

# 4. Design decision ladder

Before adding visual technology, stop at the first rung that achieves the desired effect:

1. semantic HTML + typography + composition;
2. CSS layout / transforms / transitions;
3. native media (`picture`, `video`, SVG);
4. small client-side interaction;
5. GSAP timeline / ScrollTrigger;
6. Three.js or R3F;
7. WebGPU / custom shaders.

Higher rungs require stronger evidence and stronger QA.

A cinematic effect does not justify a 3D/GPU dependency if a poster, video, masked image or CSS transform delivers the same customer-facing result.

---

# 5. Visual system

## 5.1 Direction

Canonical direction: **editorial cinematic minimalism**.

Characteristics:

- real photography and film remain the highest visual authority;
- layouts feel composed, not templated;
- strong contrast between intimate full-bleed imagery and quiet editorial whitespace;
- typography carries hierarchy without decorative clutter;
- motion reveals story rhythm rather than announcing technology;
- cards are not the universal primitive; prefer editorial sequences, contact sheets, film strips, chapters and full-bleed moments where appropriate;
- mobile composition is designed independently, not treated as desktop compressed to 390 px.

## 5.2 Tokens

Do not invent final brand colors or fonts until brand assets/rights are verified. Build semantic tokens first:

```text
color.canvas
color.surface
color.text.primary
color.text.muted
color.accent
color.border
color.inverse.*

type.display
type.heading
type.body
type.meta

space.1 … space.12
radius.none / small / medium / pill
shadow.soft / image-overlay
motion.fast / normal / slow / cinematic
layout.content / wide / fullbleed
```

No component may hardcode visual values that should be semantic tokens unless the value is intentionally local.

## 5.3 Grid

Baseline:

- 4-column mobile grid;
- 8-column tablet grid;
- 12-column desktop grid;
- full-bleed media may escape the content grid intentionally;
- readable body-copy measure remains constrained even on ultra-wide screens;
- use CSS `clamp()` for fluid type/spacing where it improves continuity.

---

# 6. Information architecture — V1

The V1 site uses **19 route templates**. Data-driven templates can generate many real URLs without duplicating layout logic.

## 6.1 Route matrix

| # | Route / template | Type | Primary job | Core entity | Primary CTA |
|---|---|---|---|---|---|
| 01 | `/` | fixed | positioning + proof + conversion | Organization | Consultar fecha |
| 02 | `/fotografia-de-boda/` | fixed | service intent | Service: Photo | Ver disponibilidad |
| 03 | `/video-de-boda/` | fixed | service intent | Service: Film | Ver disponibilidad |
| 04 | `/foto-y-video-de-boda/` | fixed | combined offer | Service bundle | Consultar colección |
| 05 | `/films/` | fixed | cinematic proof | Video collection | Ver films / consultar |
| 06 | `/portfolio/` | fixed | visual proof | Media collection | Explorar bodas |
| 07 | `/bodas/` | fixed index | proof/discovery hub | Wedding collection | Ver boda |
| 08 | `/bodas/[wedding_slug]/` | dynamic | real-wedding case study | Wedding | Consultar fecha |
| 09 | `/lugares-de-boda/` | fixed index | venue discovery | Venue collection | Explorar lugar |
| 10 | `/lugares-de-boda/[venue_slug]/` | dynamic | venue-specific evidence | Venue | Consultar cobertura |
| 11 | `/murcia/` | fixed/evidence-gated | local authority | Location | Consultar fecha |
| 12 | `/destination-weddings/` | fixed/evidence-gated | expansion intent | Service + Location | Consultar destino |
| 13 | `/colecciones/` | fixed | commercial fit | Offer/Collection | Pedir propuesta |
| 14 | `/sobre-oasis/` | fixed | trust + creative philosophy | Organization/Person | Conocernos / consultar |
| 15 | `/opiniones/` | fixed/evidence-only | social proof | Review collection | Consultar fecha |
| 16 | `/guias/` | fixed index | authority/discovery | Article collection | Leer guía |
| 17 | `/guias/[guide_slug]/` | dynamic | answer search/planning intent | Article | Ver trabajo / consultar |
| 18 | `/disponibilidad/` | fixed | qualified lead conversion | Lead form | Enviar consulta |
| 19 | `/gracias/` | utility/noindex | confirmation + next step | Conversion event | Add calendar / continue |

Legal/privacy routes (`/privacidad/`, `/cookies/`, `/aviso-legal/`) are mandatory production utilities but are not counted as acquisition templates.

Do **not** create city/venue/service combinatorial pages by default. New indexable routes require unique evidence, useful intent and an internal-link role.

---

# 7. Page anatomy

## 7.1 Homepage `/`

Required sequence:

1. cinematic hero: one exceptional real image or optimized film poster/loop + concise H1;
2. positioning statement in crawlable HTML;
3. primary CTA to availability;
4. selected real-wedding proof;
5. photography + film service split;
6. short manifesto / creative point of view;
7. film highlight with poster and controlled playback;
8. selected venues/locations only if evidence-backed;
9. process in 3–5 human steps;
10. contextual reviews if verified;
11. collections/pricing signal if approved;
12. final availability CTA.

No splash screen before content. No autoplay audio. No hero interaction may block navigation or H1 rendering.

## 7.2 Service template

Required sequence:

1. intent-matched H1 + proof hero;
2. what the service creates/solves;
3. representative portfolio;
4. creative approach;
5. deliverables only when verified;
6. process;
7. related weddings;
8. relevant reviews;
9. FAQ;
10. CTA.

## 7.3 Real wedding `/bodas/[slug]/`

This is the core AssetsGraph page.

Required sequence:

1. wedding title + location/venue facts approved for publication;
2. hero asset;
3. concise editorial context;
4. photo narrative in intentional chapters;
5. film/video if available;
6. venue/service relationships;
7. optional credits only when verified and publishable;
8. related wedding/venue/location links;
9. CTA.

A wedding page may be `draft`, `private`, `noindex`, `public-noindex` or `public-indexable`. File availability alone never makes it publishable.

## 7.4 Venue `/lugares-de-boda/[slug]/`

Publish only with genuine value: real work there, first-hand notes, useful planning/media insight, or other verified evidence.

Sections:

1. venue overview;
2. OASIS visual experience/evidence at the venue;
3. real weddings photographed/filmed there;
4. light/timing/logistics insights that are actually known;
5. galleries/films tied to the venue;
6. nearby or related editorial content;
7. CTA.

No fake venue expertise.

## 7.5 Availability `/disponibilidad/`

Qualify without excessive friction:

- wedding date;
- venue or location, with “not decided yet” allowed;
- service interest: photo / film / both / undecided;
- name(s);
- email / preferred contact channel;
- short message;
- optional budget/collection-fit signal only if commercially approved;
- source/campaign fields captured invisibly from attribution context, never user-forged as authority.

After submit: preserve attribution, create durable lead state, show clear confirmation, and avoid duplicate side effects on retry.

---

# 8. SEO + GEO page contract

Every indexable page must define:

```text
page_id
page_type
primary_entity_id
search_intent
canonical_url
title
meta_description
h1
index_policy
structured_data_types[]
internal_links[]
hero_asset_id
last_verified_at
facts_provenance[]
```

Rules:

- meaningful copy must exist in rendered HTML;
- unique title/H1/canonical;
- breadcrumb relationships reflect the information architecture;
- structured data exactly matches visible facts;
- location pages need unique local evidence;
- articles and venue pages link to relevant real weddings;
- wedding pages link back to venue/location/service entities;
- use `VideoObject` when a public video page provides the required visible facts and metadata;
- generate image/video sitemaps only from publishable assets;
- descriptive alt text is editorial metadata, not a keyword field;
- AI-discovery work optimizes source quality, entity clarity and citation-worthiness, not “GEO hacks”.

Target CWV gates at the 75th percentile where measurable:

- LCP ≤ 2.5 s;
- INP ≤ 200 ms;
- CLS ≤ 0.1.

---

# 9. Motion system

Motion has four allowed jobs:

1. orient the visitor;
2. establish hierarchy;
3. reveal narrative sequence;
4. provide interaction feedback.

## 9.1 Motion classes

- **micro** — hover/tap/focus feedback;
- **reveal** — image/text entrance;
- **editorial** — section transition/contact-sheet choreography;
- **cinematic** — rare hero/film/3D sequences.

Default durations are tokenized. No page should contain independent bespoke timing constants everywhere.

## 9.2 GSAP gate

GSAP is justified when sequencing or scroll state is materially clearer than CSS/native effects.

Requirements:

- `useGSAP()` + scoped root in React;
- client-only execution;
- context cleanup/revert;
- transforms/opacity preferred;
- ScrollTrigger count kept bounded;
- no permanent `will-change` everywhere;
- reduced-motion path removes scroll-scrub/pinning and preserves content order;
- motion QA on touch, keyboard, low-end/mobile and resize.

## 9.3 Reduced motion

`prefers-reduced-motion: reduce` is a first-class design mode:

- no essential information may depend on animation;
- parallax becomes static;
- scrubbed sequences become normal document flow;
- 3D auto-rotation stops;
- decorative transitions shorten or disappear;
- video autoplay is disabled when appropriate.

---

# 10. 3D / R3F / Three / WebGPU budget

## 10.1 Default

**No 3D dependency ships in the base layout bundle.**

A 3D scene must be dynamically loaded after critical content and only when its section approaches the viewport or the visitor explicitly activates it.

## 10.2 Required fallback

Every 3D/GPU surface defines:

```text
semantic HTML fallback
static visual fallback
reduced-motion mode
WebGL/WebGPU capability fallback
loading state
error state
cleanup path
```

## 10.3 R3F rules

- one Canvas only when a single shared scene is actually useful;
- prefer `frameloop="demand"` for resting scenes;
- `dpr={[1, 2]}` or equivalent bounded DPR unless measured otherwise;
- no React state updates every frame;
- shared assets have explicit ownership;
- no uncontrolled post-processing stack;
- verify unmount/remount without leaks.

## 10.4 WebGPU rules

WebGPU requires a written reason that includes:

- why CSS/Canvas/WebGL/Three is insufficient;
- capability/fallback behavior;
- resource/pass graph;
- mobile/unsupported behavior;
- performance budget;
- lifecycle/cleanup plan.

If that note cannot be written convincingly, do not use WebGPU.

---

# 11. AssetsGraph — canonical media model

The site must never depend on folder names as identity. Every wedding and media object receives a stable ID; human-readable slugs are mutable presentation fields.

## 11.1 Node types

```text
Wedding
Venue
Location
Service
Collection
Asset
Photo
Video
Page
Guide
Review
RightsConsent
Credit
Vendor
```

`Photo` and `Video` are specialized media nodes linked to a generic `Asset` record when shared fields are useful.

## 11.2 Stable IDs

Use opaque stable IDs, preferably ULID/UUID-style values generated once:

```text
wedding_id = wed_<ULID>
asset_id   = ast_<ULID>
photo_id   = pho_<ULID>
video_id   = vid_<ULID>
venue_id   = ven_<ULID>
page_id    = pag_<ULID>
rights_id  = rgt_<ULID>
```

Do **not** encode client names, exact dates, phone numbers or other personal data in IDs.

Children reference the wedding explicitly:

```text
Photo.wedding_id -> Wedding.wedding_id
Video.wedding_id -> Wedding.wedding_id
Asset.wedding_id -> Wedding.wedding_id
```

This satisfies “photo/video IDs per wedding” without coupling immutable identity to a mutable slug.

## 11.3 Wedding record

Minimum contract:

```yaml
wedding_id: wed_...
slug: string|null
status: draft|private|public_noindex|public_indexable|archived
publication_rights_id: rgt_...
venue_ids: []
location_id: loc_...
service_ids: []
asset_ids: []
photo_ids: []
video_ids: []
hero_asset_id: ast_...|null
story:
  title: string|null
  dek: string|null
  body: string|null
seo:
  title: string|null
  description: string|null
  canonical: string|null
  index: boolean
relations:
  related_wedding_ids: []
provenance:
  source_refs: []
  last_verified_at: datetime|null
```

Exact event date and couple identities should be private-by-default fields and only projected publicly when publication rights and editorial need justify it.

## 11.4 Generic Asset record

```yaml
asset_id: ast_...
wedding_id: wed_...|null
kind: photo|video|audio|poster|graphic|document
source:
  provider: drive|local|s3|supabase|other
  private_locator: secret-or-private-reference
  checksum: string|null
rights_id: rgt_...
publication_status: private|approved_internal|approved_public|revoked
mime_type: string
bytes: integer|null
created_at: datetime|null
public_derivatives: []
tags: []
relations: []
```

Never expose `private_locator` to the public bundle, metadata, DOM, source maps or structured data.

## 11.5 Photo record

```yaml
photo_id: pho_...
asset_id: ast_...
wedding_id: wed_...
width: integer
height: integer
orientation: portrait|landscape|square
focal_point: {x: 0.5, y: 0.5}
alt_es: string|null
caption_es: string|null
chapter: preparations|ceremony|portraits|dinner|party|details|other
hero_rank: integer|null
people_sensitivity: normal|children_present|restricted
public_derivatives:
  - {format: avif, width: 640, url: ...}
  - {format: webp, width: 1280, url: ...}
```

Alt/caption must describe the actual image when publishable. Do not infer names, relationships, disabilities, ethnicity, religion or other sensitive traits from pixels.

## 11.6 Video record

```yaml
video_id: vid_...
asset_id: ast_...
wedding_id: wed_...
type: teaser|highlight|film|reel|ceremony|speech|other
duration_seconds: number|null
poster_photo_id: pho_...|null
stream_url: string|null
captions: []
transcript_ref: string|null
chapters: []
video_object:
  name: string|null
  description: string|null
  thumbnail_asset_id: ast_...|null
  upload_date: date|null
publication_status: private|approved_public|revoked
```

No public `VideoObject` is emitted until the public URL, poster/thumbnail and visible metadata are valid.

## 11.7 Rights / consent node

```yaml
rights_id: rgt_...
scope: internal_only|portfolio_web|social|paid_ads|editorial|full_marketing|custom
status: unknown|requested|granted|restricted|revoked
source_ref: private-reference|null
valid_from: date|null
valid_until: date|null
restrictions: []
last_verified_at: datetime|null
```

`unknown` behaves as **not publishable**.

## 11.8 Graph edges

Canonical relationships:

```text
Wedding --HELD_AT--> Venue
Wedding --LOCATED_IN--> Location
Wedding --USES_SERVICE--> Service
Wedding --HAS_ASSET--> Asset
Wedding --HAS_PHOTO--> Photo
Wedding --HAS_VIDEO--> Video
Wedding --GOVERNED_BY--> RightsConsent
Page --PRIMARY_ENTITY--> Wedding|Venue|Service|Location|Guide
Page --FEATURES--> Asset|Photo|Video
Venue --HAS_WEDDING--> Wedding
Guide --REFERENCES--> Venue|Location|Wedding|Service
Video --HAS_POSTER--> Photo|Asset
Asset --CREDITED_TO--> Credit|Vendor
```

## 11.9 Filesystem/data projection

Repository stores **manifests and code**, not irreplaceable raw masters by default.

Recommended projection:

```text
content/
  weddings/
    <wedding_id>/
      wedding.yaml
      gallery.yaml
      films.yaml
  venues/
    <venue_id>.yaml
  guides/
    <guide_id>.mdx

data/
  assets/
    assets.ndjson
    rights.ndjson
```

Raw masters remain in the authoritative storage system. Public derivatives are generated/published through a media pipeline and referenced by IDs/checksums.

---

# 12. Component architecture

Start with the smallest useful system.

## 12.1 Foundations

```text
AppShell
Header
Footer
Container
Grid
Stack
Text
Heading
Link
Button
Image
Video
FormField
```

## 12.2 Editorial / portfolio primitives

```text
HeroMedia
EditorialIntro
MediaFigure
PhotoSequence
ContactSheet
FilmFeature
WeddingCard
VenueCard
QuoteBlock
Credits
RelatedEntities
AvailabilityCTA
```

## 12.3 Optional enhanced components

```text
MotionReveal
ScrollSequence
FilmStrip
InteractiveGallery
ThreeScene
WebGPUScene
```

Optional components may not leak their dependency into pages that do not use them.

---

# 13. Implementation substrate

Preferred initial substrate, subject to exact dependency/version verification at scaffold time:

- React + TypeScript;
- server-rendered/static-generation capable framework suitable for Vercel deployment;
- route-level static generation for services, weddings, venues and guides where data allows;
- client components only for genuine interaction/motion;
- responsive image pipeline with AVIF/WebP derivatives;
- native video/poster/captions before custom player complexity;
- GSAP dynamically scoped to animated components;
- Three/R3F/WebGPU in lazy client-only islands.

Do not choose a dependency because it appears in the approved skill list. Approved skill ≠ mandatory package.

---

# 14. Performance budgets

Initial engineering budgets; tighten with real RUM data:

- no blocking 3D/WebGPU in initial route shell;
- hero uses a poster/image first; video enhancement may activate after initial content is stable;
- below-fold media lazy-loaded;
- base route JS kept materially smaller than media/3D route chunks;
- fonts self-hosted or otherwise delivered with deliberate preload/subset strategy when licensing permits;
- responsive `sizes`/`srcset`; never ship 4K source to a 390 px viewport;
- reserve media aspect-ratio boxes to prevent CLS;
- pause video/animation when off-screen where appropriate;
- third-party scripts require business justification and consent classification.

Aesthetic regression is not a valid excuse for failing CWV, accessibility or conversion basics.

---

# 15. Accessibility gate

Minimum release rules:

- semantic landmark structure;
- one clear H1 per page;
- keyboard-operable navigation, dialogs, galleries and media controls;
- visible focus states;
- meaningful link/button names;
- text contrast at least WCAG 2.2 AA for normal production UI;
- motion alternatives via reduced-motion;
- touch targets usable on mobile;
- no hover-only information;
- captions/transcripts where required/available for meaningful spoken video;
- no custom cursor that hides the native pointer without an equivalent usable mode.

Automated audit is necessary but not sufficient; keyboard/manual checks remain required.

---

# 16. Analytics and conversion instrumentation

Every conversion surface should expose stable event names without embedding PII in analytics payloads.

Minimum funnel events:

```text
page_view
portfolio_open
wedding_view
film_play
film_25
film_50
film_complete
cta_availability_click
availability_form_start
availability_form_submit
availability_form_success
contact_channel_click
```

Preserve UTM/referrer/landing context through lead creation and later booking/revenue attribution where the CRM permits it.

Do not optimize motion engagement as a proxy for revenue unless it correlates with qualified enquiry behavior.

---

# 17. QA gauntlet

Every public template passes the following gates before promotion.

## GATE D1 — Content truth

- every claim has a source or is omitted;
- no invented awards/reviews/venue experience;
- rights status allows every published asset.

## GATE D2 — IA / SEO

- unique title/H1/canonical;
- correct index policy;
- rendered critical copy;
- structured data validates and matches visible content;
- internal links connect real entities.

## GATE D3 — Responsive visual QA

Minimum representative viewports:

- narrow mobile;
- modern phone portrait;
- tablet portrait/landscape;
- laptop;
- large desktop.

Compare screenshots for layout overflow, crop/focal errors, widows/orphans in hero copy, broken sticky/pinned states and unreadable overlays.

## GATE D4 — Accessibility

- keyboard end-to-end;
- focus visible;
- reduced-motion mode;
- axe or equivalent automated pass;
- media controls accessible.

## GATE D5 — Performance

- CWV/Lighthouse synthetic baseline;
- no unnecessary eager media;
- no detached animation loops;
- no catastrophic low-end/mobile jank;
- 3D/GPU fallback tested.

## GATE D6 — Conversion

- CTA routes correctly;
- lead form validates;
- retry/idempotency behavior does not create duplicate side effects;
- thank-you state works;
- attribution survives from landing to lead.

## GATE D7 — Exact-head / collision safety

- refresh `main` immediately before promotion;
- branch ancestry is current or intentionally rebased/reconciled;
- inspect concurrent web/design work;
- diff only contains claimed scope;
- no other live writer owns the same files/surface.

---

# 18. Implementation waves

## W0 — CLAIM + EVIDENCE — current

Deliverables:

- durable Mission Control claim request;
- benchmark recovery;
- upstream skill review;
- this `AGENTS-DESIGN.md`.

Exit gate: design scope is explicit, collision boundary is clear, and no claims are fabricated.

## W1 — WEB FOUNDATION

Build:

- project scaffold;
- route shell;
- semantic design tokens;
- typography/media primitives;
- global navigation/footer;
- metadata/canonical primitives;
- analytics contract skeleton.

Tests:

- typecheck/lint/build;
- smoke render every fixed route;
- base accessibility smoke;
- no client dependency required for readable core pages.

## W2 — CORE CONVERSION PAGES

Implement templates 01–04, 13–14, 18–19.

Gate: homepage/service/about/collections/availability path works end-to-end with real or explicitly labeled placeholder content, never fabricated evidence.

## W3 — ASSETSGRAPH + PORTFOLIO

Implement:

- wedding/media manifests;
- ID validation;
- rights gate;
- photo/video derivative contract;
- templates 05–08;
- real-wedding relationship graph.

Tests:

- duplicate ID rejection;
- orphan asset detection;
- `unknown/revoked` rights cannot publish;
- broken public derivative fails build/publish gate;
- photo/video belongs to a valid wedding when `wedding_id` is set.

## W4 — VENUES + LOCAL ENTITY GRAPH

Implement templates 09–12 only with evidence-backed entities.

Tests:

- no venue/location page without unique evidence fields;
- bidirectional links wedding↔venue;
- canonical/index policy correct;
- no mass generated doorway routes.

## W5 — GUIDES + GEO/SEO AUTHORITY

Implement templates 16–17 and editorial linking.

Gate: guide exists because it answers a real planning/search need, not because a keyword exists.

## W6 — MOTION SYSTEM

Add only approved motion opportunities after static routes are stable.

Sequence:

1. CSS micro interactions;
2. GSAP editorial transitions;
3. optional ScrollTrigger moments;
4. measure;
5. remove anything that harms comprehension/performance.

## W7 — OPTIONAL 3D / GPU HERO EXPERIMENT

Run as an isolated experiment, not a baseline dependency.

Promote only if:

- it clearly improves creative differentiation;
- fallback is first-class;
- reduced-motion is correct;
- mobile performance is acceptable;
- it does not delay critical content;
- implementation/maintenance cost remains justified.

## W8 — RELEASE GAUNTLET

Run D1–D7, production preview, real-device pass, SEO render inspection, forms, analytics and exact-head reconciliation.

---

# 19. Stop conditions

Stop and escalate to Mission Control / owner when:

- another live worker claims the same web/design files or scope;
- brand identity assets or licenses are contradictory;
- publication rights are unclear for a hero/wedding asset;
- pricing/offer facts are needed but not approved;
- an SEO route requires claims the evidence cannot support;
- a 3D/WebGPU concept cannot meet fallback/performance requirements;
- the proposed change expands into CRM, sales, pricing or brand strategy beyond the claimed scope;
- repeated implementation failures indicate the chosen architecture is wrong rather than the code merely incomplete.

---

# 20. Definition of done for the website program

The web program is not done because 19 templates exist. It is done when the production system demonstrates:

- premium responsive visual quality using real OASIS media;
- all critical content crawlable and indexable by design;
- strong CWV and accessibility on representative devices;
- real weddings, venues, photos and films connected through stable IDs;
- privacy/rights gates prevent accidental publication;
- SEO/GEO entity relationships are explicit and useful;
- motion/3D enhance rather than obstruct;
- forms produce reliable qualified leads with attribution;
- every public claim is evidence-backed;
- the site can add a new wedding by creating valid graph records, not by hand-copying bespoke pages;
- the path from visitor → availability enquiry is obvious, measurable and operational.

That is the design standard OASIS WEDDINGS agents must preserve.
