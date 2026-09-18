import { Buffer } from "node:buffer";
import { createHash, randomBytes } from "node:crypto";
import {
  MAX_LEAD_BODY_BYTES,
  isHoneypotFilled,
  validateLeadInput,
} from "@/lib/lead-intake";
import {
  LeadCaptureUpstreamError,
  captureLead,
  readLeadCaptureEnvironment,
} from "@/lib/lead-capture.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateBucket = {
  count: number;
  resetAt: number;
};

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 6;
const rateBuckets = new Map<string, RateBucket>();
const rateSalt = randomBytes(16);

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function redirectForForm(request: Request, path: string): Response {
  return Response.redirect(new URL(path, request.url), 303);
}

function jsonError(
  status: number,
  code: string,
  fields?: Record<string, string>,
): Response {
  return Response.json(
    { ok: false, code, ...(fields ? { fields } : {}) },
    {
      status,
      headers: {
        "cache-control": "no-store",
        ...(status === 429 || status === 503 ? { "retry-after": "60" } : {}),
      },
    },
  );
}

function validRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return false;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }

  return true;
}

function clientRateKey(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || real;

  if (!ip) return undefined;

  return createHash("sha256").update(rateSalt).update(ip).digest("hex");
}

function rateLimited(request: Request): boolean {
  const key = clientRateKey(request);
  if (!key) return false;

  const now = Date.now();

  for (const [bucketKey, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
  }

  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function parseFormEncoded(raw: string): Record<string, unknown> {
  const params = new URLSearchParams(raw);

  return {
    submission_key: params.get("submission_key") ?? "",
    contact_first_name: params.get("contact_first_name") ?? "",
    partner_first_name: params.get("partner_first_name") ?? "",
    contact_email: params.get("contact_email") ?? "",
    contact_phone: params.get("contact_phone") ?? "",
    wedding_date: params.get("wedding_date") ?? "",
    venue_name: params.get("venue_name") ?? "",
    venue_city: params.get("venue_city") ?? "",
    venue_province: params.get("venue_province") ?? "",
    service_interests: params.getAll("service_interests"),
    budget_band: params.get("budget_band") ?? "",
    privacy_consent: params.get("privacy_consent") === "true",
    company: params.get("company") ?? "",
  };
}

async function parseRequestBody(
  request: Request,
): Promise<{ mode: "json" | "form"; value: unknown } | { error: Response }> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_LEAD_BODY_BYTES
  ) {
    return { error: jsonError(413, "payload_too_large") };
  }

  let raw: string;

  try {
    raw = await request.text();
  } catch {
    return { error: jsonError(400, "invalid_body") };
  }

  if (Buffer.byteLength(raw, "utf8") > MAX_LEAD_BODY_BYTES) {
    return { error: jsonError(413, "payload_too_large") };
  }

  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (contentType === "application/json") {
    try {
      return { mode: "json", value: JSON.parse(raw) };
    } catch {
      return { error: jsonError(400, "invalid_json") };
    }
  }

  if (contentType === "application/x-www-form-urlencoded") {
    return { mode: "form", value: parseFormEncoded(raw) };
  }

  return { error: jsonError(415, "unsupported_media_type") };
}

function validationFields(
  errors: { field: string; code: string }[],
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const error of errors) {
    if (!fields[error.field]) fields[error.field] = error.code;
  }
  return fields;
}

export async function POST(request: Request): Promise<Response> {
  const html = wantsHtml(request);

  if (!validRequestOrigin(request)) {
    return html
      ? redirectForForm(request, "/disponibilidad/?estado=revisar")
      : jsonError(403, "origin_rejected");
  }

  if (rateLimited(request)) {
    return html
      ? redirectForForm(request, "/disponibilidad/?estado=limite")
      : jsonError(429, "rate_limited");
  }

  const parsed = await parseRequestBody(request);
  if ("error" in parsed) {
    return html
      ? redirectForForm(request, "/disponibilidad/?estado=revisar")
      : parsed.error;
  }

  if (isHoneypotFilled(parsed.value)) {
    return html
      ? redirectForForm(request, "/gracias/?submitted=1")
      : Response.json(
          { ok: true, status: "received" },
          { status: 202, headers: { "cache-control": "no-store" } },
        );
  }

  const validated = validateLeadInput(parsed.value);
  if (!validated.ok) {
    return html
      ? redirectForForm(request, "/disponibilidad/?estado=revisar")
      : jsonError(400, "invalid_input", validationFields(validated.errors));
  }

  const environment = readLeadCaptureEnvironment();
  if (!environment.ok) {
    return html
      ? redirectForForm(request, "/disponibilidad/?estado=no-disponible")
      : jsonError(503, "capture_unavailable");
  }

  try {
    await captureLead(environment.value, validated.value);
  } catch (error) {
    const status =
      error instanceof LeadCaptureUpstreamError ? error.status : 500;

    console.error("ow_lead_capture_failed", {
      requestId: crypto.randomUUID(),
      upstreamStatus: status,
    });

    return html
      ? redirectForForm(request, "/disponibilidad/?estado=no-disponible")
      : jsonError(status >= 500 ? 503 : 400, "capture_failed");
  }

  return html
    ? redirectForForm(request, "/gracias/?submitted=1")
    : Response.json(
        { ok: true, status: "received" },
        { status: 202, headers: { "cache-control": "no-store" } },
      );
}
