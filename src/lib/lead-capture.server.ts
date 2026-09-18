import type { NormalizedLeadInput } from "@/lib/lead-intake";

export type LeadCaptureEnvironment = {
  supabaseUrl: string;
  serviceRoleKey: string;
  businessId: string;
  privacyPolicyVersion: string;
  privacyNoticeUrl: string;
};

export type LeadCaptureEnvironmentResult =
  | { ok: true; value: LeadCaptureEnvironment }
  | { ok: false };

export class LeadCaptureUpstreamError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("lead_capture_upstream_error");
    this.name = "LeadCaptureUpstreamError";
    this.status = status;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeSupabaseUrl(value: string): string | undefined {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}

function normalizePrivacyNoticeUrl(value: string): string | undefined {
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function readLeadCaptureEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): LeadCaptureEnvironmentResult {
  if (env.OASIS_WEDDINGS_LEAD_CAPTURE_ENABLED !== "true") return { ok: false };

  const supabaseUrl = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const businessId = env.OASIS_WEDDINGS_BUSINESS_ID?.trim();
  const privacyPolicyVersion = env.OASIS_WEDDINGS_PRIVACY_POLICY_VERSION?.trim();
  const privacyNoticeUrl = env.OASIS_WEDDINGS_PRIVACY_NOTICE_URL?.trim();

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !businessId ||
    !privacyPolicyVersion ||
    !privacyNoticeUrl
  ) {
    return { ok: false };
  }

  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);
  const normalizedPrivacyNoticeUrl = normalizePrivacyNoticeUrl(privacyNoticeUrl);

  if (
    !normalizedSupabaseUrl ||
    !normalizedPrivacyNoticeUrl ||
    !isUuid(businessId) ||
    privacyPolicyVersion.length > 80
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      supabaseUrl: normalizedSupabaseUrl,
      serviceRoleKey,
      businessId,
      privacyPolicyVersion,
      privacyNoticeUrl: normalizedPrivacyNoticeUrl,
    },
  };
}

export async function captureLead(
  config: LeadCaptureEnvironment,
  lead: NormalizedLeadInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ created: boolean }> {
  const response = await fetchImpl(
    `${config.supabaseUrl}/rest/v1/rpc/ow_capture_lead`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        p_business_id: config.businessId,
        p_submission_key: lead.submission_key,
        p_contact_first_name: lead.contact_first_name,
        p_contact_email: lead.contact_email,
        p_wedding_date: lead.wedding_date,
        p_service_interests: lead.service_interests,
        p_privacy_consent: true,
        p_partner_first_name: lead.partner_first_name ?? null,
        p_contact_phone: lead.contact_phone ?? null,
        p_venue_name: lead.venue_name ?? null,
        p_venue_city: lead.venue_city ?? null,
        p_venue_province: lead.venue_province ?? null,
        p_country_code: "ES",
        p_budget_band: lead.budget_band ?? null,
        p_attribution: {
          ...lead.attribution,
          consent_signal: "not_required",
          privacy_policy_version: config.privacyPolicyVersion,
        },
      }),
      signal: AbortSignal.timeout(8_000),
    },
  );

  if (!response.ok) {
    throw new LeadCaptureUpstreamError(response.status);
  }

  const payload: unknown = await response.json();

  if (
    !Array.isArray(payload) ||
    payload.length !== 1 ||
    typeof payload[0] !== "object" ||
    payload[0] === null ||
    typeof (payload[0] as { created?: unknown }).created !== "boolean" ||
    typeof (payload[0] as { lead_id?: unknown }).lead_id !== "string"
  ) {
    throw new LeadCaptureUpstreamError(502);
  }

  return { created: (payload[0] as { created: boolean }).created };
}
