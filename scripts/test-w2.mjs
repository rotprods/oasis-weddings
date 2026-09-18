import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
let passed = 0;

function ok(condition, message) {
  assert.equal(Boolean(condition), true, message);
  passed += 1;
}

function loadTsModule(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;

  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require,
    process,
    URL,
    AbortSignal,
    fetch: globalThis.fetch,
    console,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(output, context, { filename });
  return module.exports;
}

const intake = loadTsModule("src/lib/lead-intake.ts");
const capture = loadTsModule("src/lib/lead-capture.server.ts");

const validPayload = {
  submission_key: "test-submission-123",
  contact_first_name: "  Roberto ",
  partner_first_name: "",
  contact_email: " TEST@EXAMPLE.COM ",
  contact_phone: "+34 600 000 000",
  wedding_date: "2027-06-12",
  venue_name: "Lugar de prueba",
  venue_city: "Murcia",
  venue_province: "Murcia",
  service_interests: ["photo_video"],
  budget_band: "2500_3499",
  privacy_consent: true,
  company: "",
  attribution: {
    landing_page: "/disponibilidad/",
    first_source: "test",
    last_source: "test",
  },
};

const valid = intake.validateLeadInput(validPayload);
ok(valid.ok, "valid payload should pass");
ok(valid.ok && valid.value.contact_email === "test@example.com", "email must normalize");
ok(valid.ok && valid.value.contact_first_name === "Roberto", "name must trim");
ok(valid.ok && valid.value.service_interests.length === 1, "service list should normalize");

const noPrivacy = intake.validateLeadInput({ ...validPayload, privacy_consent: false });
ok(!noPrivacy.ok, "privacy consent is mandatory");

const serverAuthority = intake.validateLeadInput({
  ...validPayload,
  business_id: "1b8d1857-a97b-419f-a140-61660704f782",
});
ok(
  !serverAuthority.ok &&
    serverAuthority.errors.some((error) => error.field === "business_id"),
  "browser must not control business_id",
);

const adClick = intake.validateLeadInput({
  ...validPayload,
  attribution: { gclid: "must-not-pass" },
});
ok(
  !adClick.ok &&
    adClick.errors.some((error) => error.field === "attribution.gclid"),
  "ad click IDs are blocked until CMP review",
);

ok(intake.isHoneypotFilled({ company: "bot" }), "honeypot should detect bot payload");
ok(!intake.isHoneypotFilled({ company: "" }), "empty honeypot should be accepted");

const disabledEnv = capture.readLeadCaptureEnvironment({});
ok(!disabledEnv.ok, "capture must fail closed when disabled");

const enabledEnv = capture.readLeadCaptureEnvironment({
  OASIS_WEDDINGS_LEAD_CAPTURE_ENABLED: "true",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "server-secret-placeholder",
  OASIS_WEDDINGS_BUSINESS_ID: "1b8d1857-a97b-419f-a140-61660704f782",
  OASIS_WEDDINGS_PRIVACY_POLICY_VERSION: "2026-09",
  OASIS_WEDDINGS_PRIVACY_NOTICE_URL: "/privacidad/",
});
ok(enabledEnv.ok, "complete server config should activate capture");

let capturedUrl;
let capturedOptions;
const fakeFetch = async (url, options) => {
  capturedUrl = String(url);
  capturedOptions = options;
  return {
    ok: true,
    status: 200,
    async json() {
      return [{ lead_id: "a6e7a0ae-1ea7-4c90-9904-9bbab16726fc", created: true }];
    },
  };
};

assert.equal(valid.ok, true);
assert.equal(enabledEnv.ok, true);
const captureResult = await capture.captureLead(
  enabledEnv.value,
  valid.value,
  fakeFetch,
);
ok(captureResult.created === true, "capture should return only created state");
ok(capturedUrl.endsWith("/rest/v1/rpc/ow_capture_lead"), "RPC endpoint must be canonical");

const upstreamBody = JSON.parse(capturedOptions.body);
ok(
  upstreamBody.p_business_id === "1b8d1857-a97b-419f-a140-61660704f782",
  "business_id must come from server config",
);
ok(
  upstreamBody.p_attribution.privacy_policy_version === "2026-09",
  "privacy policy version must be server injected",
);
ok(
  !("contact_email" in upstreamBody.p_attribution) &&
    !("contact_phone" in upstreamBody.p_attribution),
  "attribution must contain no direct contact PII",
);
ok(
  capturedOptions.headers.apikey === "server-secret-placeholder" &&
    capturedOptions.headers.authorization === "Bearer server-secret-placeholder",
  "service role stays in server-side authorization headers",
);

const routeSource = fs.readFileSync(
  path.join(root, "src/app/api/leads/route.ts"),
  "utf8",
);
ok(routeSource.includes("application/x-www-form-urlencoded"), "no-JS form path must be supported");
ok(routeSource.includes("origin_rejected"), "cross-origin submission guard must exist");
ok(!routeSource.includes('"lead_id"'), "public API must not serialize lead_id");

const formSource = fs.readFileSync(
  path.join(root, "src/components/enquiry-form.tsx"),
  "utf8",
);
ok(
  formSource.includes('detail: { event }') &&
    !formSource.includes("detail: { event,"),
  "client analytics event payload must remain non-PII",
);
ok(
  formSource.includes('action="/api/leads"') && formSource.includes('method="post"'),
  "form must preserve progressive POST fallback",
);

const registrySource = fs.readFileSync(
  path.join(root, "src/lib/page-registry.ts"),
  "utf8",
);
ok(
  registrySource.includes('new Set<TopLevelSlug>(["disponibilidad", "gracias"])'),
  "dedicated conversion routes must be excluded from dynamic slug authority",
);

console.log(`W2 contract tests: ${passed} passed`);
