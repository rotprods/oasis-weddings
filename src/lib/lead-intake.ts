export const MAX_LEAD_BODY_BYTES = 12_000;

export const SERVICE_INTERESTS = [
  "photo",
  "video",
  "photo_video",
  "post_wedding",
  "pre_wedding",
  "other",
] as const;

export const BUDGET_BANDS = [
  "unknown",
  "under_1500",
  "1500_2499",
  "2500_3499",
  "3500_4999",
  "5000_plus",
] as const;

export type ServiceInterest = (typeof SERVICE_INTERESTS)[number];
export type BudgetBand = (typeof BUDGET_BANDS)[number];

export type LeadAttribution = {
  landing_page?: string;
  referrer?: string;
  first_source?: string;
  first_medium?: string;
  first_campaign?: string;
  first_term?: string;
  first_content?: string;
  last_source?: string;
  last_medium?: string;
  last_campaign?: string;
  last_term?: string;
  last_content?: string;
};

export type NormalizedLeadInput = {
  submission_key: string;
  contact_first_name: string;
  partner_first_name?: string;
  contact_email: string;
  contact_phone?: string;
  wedding_date: string;
  venue_name?: string;
  venue_city?: string;
  venue_province?: string;
  service_interests: ServiceInterest[];
  budget_band?: BudgetBand;
  privacy_consent: true;
  attribution: LeadAttribution;
};

export type LeadValidationError = {
  field: string;
  code:
    | "required"
    | "invalid"
    | "too_long"
    | "unsupported"
    | "privacy_required"
    | "unknown_field";
};

export type LeadValidationResult =
  | { ok: true; value: NormalizedLeadInput }
  | { ok: false; errors: LeadValidationError[] };

const CLIENT_FIELDS = new Set([
  "submission_key",
  "contact_first_name",
  "partner_first_name",
  "contact_email",
  "contact_phone",
  "wedding_date",
  "venue_name",
  "venue_city",
  "venue_province",
  "service_interests",
  "budget_band",
  "privacy_consent",
  "attribution",
  "company",
]);

const ATTRIBUTION_FIELDS = new Set([
  "landing_page",
  "referrer",
  "first_source",
  "first_medium",
  "first_campaign",
  "first_term",
  "first_content",
  "last_source",
  "last_medium",
  "last_campaign",
  "last_term",
  "last_content",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(
  value: unknown,
  field: string,
  errors: LeadValidationError[],
  options: { required?: boolean; max: number },
): string | undefined {
  if (typeof value !== "string") {
    if (options.required) errors.push({ field, code: "required" });
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    if (options.required) errors.push({ field, code: "required" });
    return undefined;
  }

  if (normalized.length > options.max) {
    errors.push({ field, code: "too_long" });
    return undefined;
  }

  return normalized;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeAttribution(
  value: unknown,
  errors: LeadValidationError[],
): LeadAttribution {
  if (value === undefined || value === null) return {};

  if (!isRecord(value)) {
    errors.push({ field: "attribution", code: "invalid" });
    return {};
  }

  const result: LeadAttribution = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (!ATTRIBUTION_FIELDS.has(key)) {
      errors.push({ field: `attribution.${key}`, code: "unsupported" });
      continue;
    }

    if (rawValue === undefined || rawValue === null || rawValue === "") continue;

    if (typeof rawValue !== "string") {
      errors.push({ field: `attribution.${key}`, code: "invalid" });
      continue;
    }

    const normalized = rawValue.trim();

    if (!normalized) continue;

    const max = key === "landing_page" || key === "referrer" ? 512 : 160;
    if (normalized.length > max) {
      errors.push({ field: `attribution.${key}`, code: "too_long" });
      continue;
    }

    result[key as keyof LeadAttribution] = normalized;
  }

  return result;
}

export function isHoneypotFilled(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.company === "string" && value.company.trim().length > 0;
}

export function validateLeadInput(value: unknown): LeadValidationResult {
  const errors: LeadValidationError[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: [{ field: "body", code: "invalid" }] };
  }

  for (const key of Object.keys(value)) {
    if (!CLIENT_FIELDS.has(key)) {
      errors.push({ field: key, code: "unknown_field" });
    }
  }

  const submissionKey = trimmedString(value.submission_key, "submission_key", errors, {
    required: true,
    max: 128,
  });
  if (submissionKey && submissionKey.length < 8) {
    errors.push({ field: "submission_key", code: "invalid" });
  }

  const firstName = trimmedString(
    value.contact_first_name,
    "contact_first_name",
    errors,
    { required: true, max: 120 },
  );
  const partnerFirstName = trimmedString(
    value.partner_first_name,
    "partner_first_name",
    errors,
    { max: 120 },
  );
  const email = trimmedString(value.contact_email, "contact_email", errors, {
    required: true,
    max: 320,
  });
  const normalizedEmail = email?.toLowerCase();
  if (
    normalizedEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    errors.push({ field: "contact_email", code: "invalid" });
  }

  const phone = trimmedString(value.contact_phone, "contact_phone", errors, {
    max: 40,
  });
  if (phone && !/^[+()\d\s.\-]{6,40}$/.test(phone)) {
    errors.push({ field: "contact_phone", code: "invalid" });
  }

  const weddingDate = trimmedString(value.wedding_date, "wedding_date", errors, {
    required: true,
    max: 10,
  });
  if (weddingDate && !isValidIsoDate(weddingDate)) {
    errors.push({ field: "wedding_date", code: "invalid" });
  }

  const venueName = trimmedString(value.venue_name, "venue_name", errors, {
    max: 200,
  });
  const venueCity = trimmedString(value.venue_city, "venue_city", errors, {
    max: 120,
  });
  const venueProvince = trimmedString(
    value.venue_province,
    "venue_province",
    errors,
    { max: 120 },
  );

  const serviceInterests: ServiceInterest[] = [];
  if (!Array.isArray(value.service_interests) || value.service_interests.length === 0) {
    errors.push({ field: "service_interests", code: "required" });
  } else {
    const seen = new Set<string>();
    for (const item of value.service_interests) {
      if (
        typeof item !== "string" ||
        !SERVICE_INTERESTS.includes(item as ServiceInterest)
      ) {
        errors.push({ field: "service_interests", code: "unsupported" });
        continue;
      }
      if (!seen.has(item)) {
        seen.add(item);
        serviceInterests.push(item as ServiceInterest);
      }
    }
  }

  let budgetBand: BudgetBand | undefined;
  if (
    value.budget_band !== undefined &&
    value.budget_band !== null &&
    value.budget_band !== ""
  ) {
    if (
      typeof value.budget_band !== "string" ||
      !BUDGET_BANDS.includes(value.budget_band as BudgetBand)
    ) {
      errors.push({ field: "budget_band", code: "unsupported" });
    } else {
      budgetBand = value.budget_band as BudgetBand;
    }
  }

  if (value.privacy_consent !== true) {
    errors.push({ field: "privacy_consent", code: "privacy_required" });
  }

  const attribution = normalizeAttribution(value.attribution, errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      submission_key: submissionKey!,
      contact_first_name: firstName!,
      ...(partnerFirstName ? { partner_first_name: partnerFirstName } : {}),
      contact_email: normalizedEmail!,
      ...(phone ? { contact_phone: phone } : {}),
      wedding_date: weddingDate!,
      ...(venueName ? { venue_name: venueName } : {}),
      ...(venueCity ? { venue_city: venueCity } : {}),
      ...(venueProvince ? { venue_province: venueProvince } : {}),
      service_interests: serviceInterests,
      ...(budgetBand ? { budget_band: budgetBand } : {}),
      privacy_consent: true,
      attribution,
    },
  };
}
