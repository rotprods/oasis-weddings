-- OASIS WEDDINGS CP4 CRM domain proposal v1
-- REVIEW-ONLY MIGRATION. Do not apply to production before Mission Control acceptance.
-- Preconditions:
--   1) Create/identify the canonical public.businesses row for OASIS WEDDINGS.
--   2) Configure the server endpoint with OASIS_WEDDINGS_BUSINESS_ID.
--   3) Verify RLS helper functions is_business_member(), business_role(), is_oasis_team().

create table if not exists public.ow_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  submission_key text not null check (length(submission_key) between 8 and 128),
  contact_first_name text not null check (length(btrim(contact_first_name)) between 1 and 120),
  partner_first_name text null check (partner_first_name is null or length(btrim(partner_first_name)) <= 120),
  contact_email citext not null,
  contact_phone text null check (contact_phone is null or length(contact_phone) <= 40),
  wedding_date date not null,
  venue_name text null check (venue_name is null or length(venue_name) <= 200),
  venue_city text null check (venue_city is null or length(venue_city) <= 120),
  venue_province text null check (venue_province is null or length(venue_province) <= 120),
  country_code text not null default 'ES' check (country_code ~ '^[A-Z]{2}$'),
  service_interests text[] not null default '{}' check (service_interests <@ ARRAY['photo','video','photo_video','post_wedding','pre_wedding','other']::text[]),
  budget_band text null check (budget_band is null or budget_band in ('unknown','under_1500','1500_2499','2500_3499','3500_4999','5000_plus')),
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','QUALIFIED','DISCOVERY_BOOKED','DISCOVERY_DONE','PROPOSAL','VERBAL_YES','CONTRACT_SENT','DEPOSIT_PENDING','WON','LOST')),
  owner_id uuid null references auth.users(id),
  lead_score integer null check (lead_score between 0 and 100),
  qualification jsonb null,
  loss_reason text null check (loss_reason is null or loss_reason in ('not_a_fit','budget','date_unavailable','location','service_mismatch','ghosted','competitor','duplicate','spam','cancelled_event','other')),
  loss_notes text null check (loss_notes is null or length(loss_notes) <= 1000),
  duplicate_of_lead_id uuid null references public.ow_leads(id),
  first_human_response_at timestamptz null,
  contract_signed_at timestamptz null,
  deposit_received_at timestamptz null,
  deposit_amount_eur numeric(12,2) null check (deposit_amount_eur is null or deposit_amount_eur >= 0),
  booking_value_eur numeric(12,2) null check (booking_value_eur is null or booking_value_eur >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, submission_key),
  unique (business_id, id),
  check (cardinality(service_interests) > 0),
  check ((status <> 'LOST') or loss_reason is not null),
  check ((status <> 'WON') or (contract_signed_at is not null and deposit_received_at is not null and deposit_amount_eur > 0))
);

create table if not exists public.ow_lead_attribution (
  lead_id uuid primary key,
  business_id uuid not null,
  landing_page text null,
  referrer text null,
  first_source text null,
  first_medium text null,
  first_campaign text null,
  first_term text null,
  first_content text null,
  last_source text null,
  last_medium text null,
  last_campaign text null,
  last_term text null,
  last_content text null,
  google_click_id text null,
  meta_click_id text null,
  consent_signal text null check (consent_signal is null or consent_signal in ('granted','denied','unknown','not_required')),
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, lead_id) references public.ow_leads(business_id, id) on delete cascade
);

create table if not exists public.ow_lead_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  business_id uuid not null,
  purpose text not null check (purpose in ('privacy_processing','email_marketing','whatsapp_marketing','ad_measurement')),
  status text not null check (status in ('granted','revoked','unknown')),
  source text not null check (source in ('form','manual','double_optin','api')),
  policy_version text null,
  evidence jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  revoked_at timestamptz null,
  foreign key (business_id, lead_id) references public.ow_leads(business_id, id) on delete cascade
);

create table if not exists public.ow_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  business_id uuid not null,
  event_name text not null,
  actor_type text not null check (actor_type in ('system','sales','admin','founder')),
  actor_id uuid null references auth.users(id),
  from_status text null,
  to_status text null,
  idempotency_key text not null check (length(idempotency_key) between 8 and 160),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (business_id, idempotency_key),
  foreign key (business_id, lead_id) references public.ow_leads(business_id, id) on delete cascade
);

create index if not exists ow_leads_business_status_idx on public.ow_leads (business_id, status, created_at desc);
create index if not exists ow_leads_wedding_date_idx on public.ow_leads (business_id, wedding_date);
create index if not exists ow_lead_events_lead_time_idx on public.ow_lead_events (business_id, lead_id, occurred_at desc);

alter table public.ow_leads enable row level security;
alter table public.ow_lead_attribution enable row level security;
alter table public.ow_lead_consents enable row level security;
alter table public.ow_lead_events enable row level security;

revoke all on public.ow_leads from anon;
revoke all on public.ow_lead_attribution from anon;
revoke all on public.ow_lead_consents from anon;
revoke all on public.ow_lead_events from anon;

grant select, insert, update on public.ow_leads to authenticated;
grant select, insert, update on public.ow_lead_attribution to authenticated;
grant select, insert on public.ow_lead_consents to authenticated;
grant select, insert on public.ow_lead_events to authenticated;

revoke delete on public.ow_leads from authenticated;
revoke delete on public.ow_lead_attribution from authenticated;
revoke update, delete on public.ow_lead_consents from authenticated;
revoke update, delete on public.ow_lead_events from authenticated;

create policy ow_leads_select on public.ow_leads
for select to authenticated
using (is_business_member(business_id) or is_oasis_team());

create policy ow_leads_write on public.ow_leads
for all to authenticated
using ((business_role(business_id) in ('owner','admin')) or is_oasis_team())
with check ((business_role(business_id) in ('owner','admin')) or is_oasis_team());

create policy ow_attr_select on public.ow_lead_attribution
for select to authenticated
using (is_business_member(business_id) or is_oasis_team());

create policy ow_attr_write on public.ow_lead_attribution
for all to authenticated
using ((business_role(business_id) in ('owner','admin')) or is_oasis_team())
with check ((business_role(business_id) in ('owner','admin')) or is_oasis_team());

create policy ow_consent_select on public.ow_lead_consents
for select to authenticated
using (is_business_member(business_id) or is_oasis_team());

create policy ow_consent_insert on public.ow_lead_consents
for insert to authenticated
with check ((business_role(business_id) in ('owner','admin')) or is_oasis_team());

create policy ow_events_select on public.ow_lead_events
for select to authenticated
using (is_business_member(business_id) or is_oasis_team());

create policy ow_events_insert on public.ow_lead_events
for insert to authenticated
with check ((business_role(business_id) in ('owner','admin')) or is_oasis_team());

comment on table public.ow_leads is 'OASIS WEDDINGS enquiry CRM. Browser clients must never write directly; use a validated server-side endpoint.';
comment on table public.ow_lead_attribution is 'Attribution only. Keep direct contact PII out of this table. Click IDs are optional and must be gated by the project privacy/CMP policy.';
comment on table public.ow_lead_consents is 'Append-only consent history for OASIS WEDDINGS leads.';
comment on table public.ow_lead_events is 'Append-only CRM audit/event stream with idempotency keys.';
