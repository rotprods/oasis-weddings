-- OASIS WEDDINGS CP4 atomic lead capture RPC v1
-- Depends on 001_ow_crm_domain.sql.
-- Server-only: PUBLIC/anon/authenticated execution is revoked.

create or replace function public.ow_capture_lead(
  p_business_id uuid,
  p_submission_key text,
  p_contact_first_name text,
  p_contact_email text,
  p_wedding_date date,
  p_service_interests text[],
  p_privacy_consent boolean,
  p_partner_first_name text default null,
  p_contact_phone text default null,
  p_venue_name text default null,
  p_venue_city text default null,
  p_venue_province text default null,
  p_country_code text default 'ES',
  p_budget_band text default null,
  p_attribution jsonb default '{}'::jsonb
)
returns table (lead_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_lead_id uuid;
  v_event_key text;
  v_consent_signal text;
begin
  if p_business_id is null then
    raise exception using errcode = '22023', message = 'business_id_required';
  end if;

  if coalesce(p_privacy_consent, false) is false then
    raise exception using errcode = '22023', message = 'privacy_consent_required';
  end if;

  if p_submission_key is null or length(p_submission_key) < 8 or length(p_submission_key) > 128 then
    raise exception using errcode = '22023', message = 'invalid_submission_key';
  end if;

  insert into public.ow_leads (
    business_id,
    submission_key,
    contact_first_name,
    partner_first_name,
    contact_email,
    contact_phone,
    wedding_date,
    venue_name,
    venue_city,
    venue_province,
    country_code,
    service_interests,
    budget_band
  )
  values (
    p_business_id,
    p_submission_key,
    p_contact_first_name,
    p_partner_first_name,
    p_contact_email,
    p_contact_phone,
    p_wedding_date,
    p_venue_name,
    p_venue_city,
    p_venue_province,
    coalesce(p_country_code, 'ES'),
    p_service_interests,
    p_budget_band
  )
  on conflict (business_id, submission_key) do nothing
  returning id into v_lead_id;

  if v_lead_id is null then
    select l.id
      into v_lead_id
      from public.ow_leads l
     where l.business_id = p_business_id
       and l.submission_key = p_submission_key;

    if v_lead_id is null then
      raise exception using errcode = 'P0001', message = 'idempotency_lookup_failed';
    end if;

    return query select v_lead_id, false;
    return;
  end if;

  v_consent_signal := case
    when p_attribution ->> 'consent_signal' in ('granted', 'denied', 'unknown', 'not_required')
      then p_attribution ->> 'consent_signal'
    else 'unknown'
  end;

  insert into public.ow_lead_attribution (
    lead_id,
    business_id,
    landing_page,
    referrer,
    first_source,
    first_medium,
    first_campaign,
    first_term,
    first_content,
    last_source,
    last_medium,
    last_campaign,
    last_term,
    last_content,
    google_click_id,
    meta_click_id,
    consent_signal
  )
  values (
    v_lead_id,
    p_business_id,
    nullif(p_attribution ->> 'landing_page', ''),
    nullif(p_attribution ->> 'referrer', ''),
    nullif(p_attribution ->> 'first_source', ''),
    nullif(p_attribution ->> 'first_medium', ''),
    nullif(p_attribution ->> 'first_campaign', ''),
    nullif(p_attribution ->> 'first_term', ''),
    nullif(p_attribution ->> 'first_content', ''),
    nullif(p_attribution ->> 'last_source', ''),
    nullif(p_attribution ->> 'last_medium', ''),
    nullif(p_attribution ->> 'last_campaign', ''),
    nullif(p_attribution ->> 'last_term', ''),
    nullif(p_attribution ->> 'last_content', ''),
    nullif(p_attribution ->> 'google_click_id', ''),
    nullif(p_attribution ->> 'meta_click_id', ''),
    v_consent_signal
  );

  insert into public.ow_lead_consents (
    lead_id,
    business_id,
    purpose,
    status,
    source,
    policy_version,
    evidence
  )
  values (
    v_lead_id,
    p_business_id,
    'privacy_processing',
    'granted',
    'form',
    nullif(p_attribution ->> 'privacy_policy_version', ''),
    jsonb_build_object(
      'submission_key', p_submission_key,
      'capture_contract', 'ow_capture_lead_v1'
    )
  );

  v_event_key := left('capture:' || p_submission_key, 160);

  insert into public.ow_lead_events (
    lead_id,
    business_id,
    event_name,
    actor_type,
    idempotency_key,
    metadata
  )
  values (
    v_lead_id,
    p_business_id,
    'lead_created',
    'system',
    v_event_key,
    jsonb_build_object('capture_contract', 'ow_capture_lead_v1')
  );

  return query select v_lead_id, true;
end;
$function$;

revoke all on function public.ow_capture_lead(
  uuid, text, text, text, date, text[], boolean,
  text, text, text, text, text, text, text, jsonb
) from public;

revoke all on function public.ow_capture_lead(
  uuid, text, text, text, date, text[], boolean,
  text, text, text, text, text, text, text, jsonb
) from anon;

revoke all on function public.ow_capture_lead(
  uuid, text, text, text, date, text[], boolean,
  text, text, text, text, text, text, text, jsonb
) from authenticated;

grant execute on function public.ow_capture_lead(
  uuid, text, text, text, date, text[], boolean,
  text, text, text, text, text, text, text, jsonb
) to service_role;

comment on function public.ow_capture_lead(
  uuid, text, text, text, date, text[], boolean,
  text, text, text, text, text, text, text, jsonb
) is 'Atomic, idempotent, server-only OASIS WEDDINGS lead capture. Must be called by trusted server code with service_role; never expose the key to browsers.';
