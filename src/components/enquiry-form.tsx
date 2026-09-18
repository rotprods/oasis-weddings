"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

type EnquiryFormProps = {
  enabled: boolean;
  initialSubmissionKey: string;
  privacyNoticeUrl?: string;
};

type ServerFailure = {
  ok?: false;
  code?: string;
  fields?: Record<string, string>;
};

const serviceOptions = [
  ["photo", "Fotografía"],
  ["video", "Cine"],
  ["photo_video", "Fotografía + cine"],
  ["post_wedding", "Postboda"],
  ["pre_wedding", "Preboda"],
  ["other", "Otro / aún no lo sabemos"],
] as const;

const budgetOptions = [
  ["unknown", "Prefiero hablarlo"],
  ["under_1500", "Menos de 1.500 €"],
  ["1500_2499", "1.500–2.499 €"],
  ["2500_3499", "2.500–3.499 €"],
  ["3500_4999", "3.500–4.999 €"],
  ["5000_plus", "5.000 € o más"],
] as const;

function emitAnalytics(event: string) {
  window.dispatchEvent(
    new CustomEvent("ow:analytics", {
      detail: { event },
    }),
  );
}

function safeReferrer(): string | undefined {
  if (!document.referrer) return undefined;

  try {
    const parsed = new URL(document.referrer);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return undefined;
  }
}

function attributionFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source")?.slice(0, 160) || undefined;
  const medium = params.get("utm_medium")?.slice(0, 160) || undefined;
  const campaign = params.get("utm_campaign")?.slice(0, 160) || undefined;
  const term = params.get("utm_term")?.slice(0, 160) || undefined;
  const content = params.get("utm_content")?.slice(0, 160) || undefined;

  return {
    landing_page: window.location.pathname.slice(0, 512),
    referrer: safeReferrer(),
    first_source: source,
    first_medium: medium,
    first_campaign: campaign,
    first_term: term,
    first_content: content,
    last_source: source,
    last_medium: medium,
    last_campaign: campaign,
    last_term: term,
    last_content: content,
  };
}

function genericFieldMessage() {
  return "Revisa este campo.";
}

export function EnquiryForm({
  enabled,
  initialSubmissionKey,
  privacyNoticeUrl,
}: EnquiryFormProps) {
  const router = useRouter();
  const submissionKey = useRef(initialSubmissionKey);
  const started = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function markStarted() {
    if (started.current) return;
    started.current = true;
    emitAnalytics("ow_lead_form_start");
  }

  function errorFor(field: string) {
    return fieldErrors[field] ? genericFieldMessage() : undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!enabled) {
      event.preventDefault();
      setFormMessage(
        "La consulta online no está disponible ahora mismo. No se ha enviado ningún dato.",
      );
      return;
    }

    event.preventDefault();
    setSubmitting(true);
    setFormMessage(undefined);
    setFieldErrors({});
    emitAnalytics("ow_lead_form_submit");

    const formData = new FormData(event.currentTarget);

    const payload = {
      submission_key: submissionKey.current,
      contact_first_name: String(formData.get("contact_first_name") ?? ""),
      partner_first_name: String(formData.get("partner_first_name") ?? ""),
      contact_email: String(formData.get("contact_email") ?? ""),
      contact_phone: String(formData.get("contact_phone") ?? ""),
      wedding_date: String(formData.get("wedding_date") ?? ""),
      venue_name: String(formData.get("venue_name") ?? ""),
      venue_city: String(formData.get("venue_city") ?? ""),
      venue_province: String(formData.get("venue_province") ?? ""),
      service_interests: formData.getAll("service_interests").map(String),
      budget_band: String(formData.get("budget_band") ?? ""),
      privacy_consent: formData.get("privacy_consent") === "true",
      company: String(formData.get("company") ?? ""),
      attribution: attributionFromLocation(),
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body: ServerFailure = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (body.fields) setFieldErrors(body.fields);

        setFormMessage(
          response.status === 429
            ? "Hemos recibido demasiados intentos seguidos. Prueba de nuevo en un minuto."
            : response.status === 503
              ? "La consulta online no está disponible ahora mismo. No hace falta volver a rellenar el formulario: puedes reintentarlo en unos minutos."
              : "Hay campos que necesitan revisión antes de enviar.",
        );
        emitAnalytics("ow_lead_submit_error");
        return;
      }

      emitAnalytics("ow_lead_submit_success");
      router.push("/gracias/?submitted=1");
    } catch {
      setFormMessage(
        "No hemos podido completar el envío. Tus datos siguen en el formulario para que puedas reintentarlo.",
      );
      emitAnalytics("ow_lead_submit_error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      action="/api/leads"
      method="post"
      className="enquiry-form"
      onFocusCapture={markStarted}
      onSubmit={handleSubmit}
      noValidate={false}
    >
      <input
        type="hidden"
        name="submission_key"
        value={submissionKey.current}
        readOnly
      />

      <div className="hp-field" aria-hidden="true">
        <label htmlFor="company">Empresa</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="contact_first_name">Tu nombre</label>
          <input
            id="contact_first_name"
            name="contact_first_name"
            type="text"
            autoComplete="given-name"
            maxLength={120}
            required
            aria-invalid={Boolean(errorFor("contact_first_name"))}
            aria-describedby={
              errorFor("contact_first_name") ? "contact_first_name-error" : undefined
            }
          />
          {errorFor("contact_first_name") ? (
            <p className="field-error" id="contact_first_name-error">
              {errorFor("contact_first_name")}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="partner_first_name">Nombre de tu pareja</label>
          <input
            id="partner_first_name"
            name="partner_first_name"
            type="text"
            autoComplete="off"
            maxLength={120}
          />
        </div>

        <div className="form-field">
          <label htmlFor="contact_email">Email</label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            autoComplete="email"
            maxLength={320}
            required
            aria-invalid={Boolean(errorFor("contact_email"))}
            aria-describedby={errorFor("contact_email") ? "contact_email-error" : undefined}
          />
          {errorFor("contact_email") ? (
            <p className="field-error" id="contact_email-error">
              {errorFor("contact_email")}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="contact_phone">Teléfono · opcional</label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            aria-invalid={Boolean(errorFor("contact_phone"))}
            aria-describedby={errorFor("contact_phone") ? "contact_phone-error" : undefined}
          />
          {errorFor("contact_phone") ? (
            <p className="field-error" id="contact_phone-error">
              {errorFor("contact_phone")}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="wedding_date">Fecha de la boda</label>
          <input
            id="wedding_date"
            name="wedding_date"
            type="date"
            required
            aria-invalid={Boolean(errorFor("wedding_date"))}
            aria-describedby={errorFor("wedding_date") ? "wedding_date-error" : undefined}
          />
          {errorFor("wedding_date") ? (
            <p className="field-error" id="wedding_date-error">
              {errorFor("wedding_date")}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="service_interests">Qué necesitáis</label>
          <select
            id="service_interests"
            name="service_interests"
            required
            defaultValue=""
            aria-invalid={Boolean(errorFor("service_interests"))}
            aria-describedby={
              errorFor("service_interests") ? "service_interests-error" : undefined
            }
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {serviceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errorFor("service_interests") ? (
            <p className="field-error" id="service_interests-error">
              {errorFor("service_interests")}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="venue_name">Lugar · opcional</label>
          <input id="venue_name" name="venue_name" type="text" maxLength={200} />
        </div>

        <div className="form-field">
          <label htmlFor="venue_city">Ciudad · opcional</label>
          <input
            id="venue_city"
            name="venue_city"
            type="text"
            autoComplete="address-level2"
            maxLength={120}
          />
        </div>

        <div className="form-field">
          <label htmlFor="venue_province">Provincia · opcional</label>
          <input
            id="venue_province"
            name="venue_province"
            type="text"
            autoComplete="address-level1"
            maxLength={120}
          />
        </div>

        <div className="form-field">
          <label htmlFor="budget_band">Presupuesto orientativo · opcional</label>
          <select id="budget_band" name="budget_band" defaultValue="">
            <option value="">Sin indicar</option>
            {budgetOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="privacy-consent">
        <input
          id="privacy_consent"
          name="privacy_consent"
          type="checkbox"
          value="true"
          required
          aria-invalid={Boolean(errorFor("privacy_consent"))}
          aria-describedby={
            errorFor("privacy_consent") ? "privacy_consent-error" : "privacy-consent-copy"
          }
        />
        <div>
          <label htmlFor="privacy_consent">
            Acepto que OASIS WEDDINGS use estos datos para gestionar y responder esta
            consulta.
          </label>
          <p id="privacy-consent-copy">
            {privacyNoticeUrl ? (
              <a href={privacyNoticeUrl} target="_blank" rel="noreferrer">
                Consultar aviso de privacidad
              </a>
            ) : (
              "El aviso de privacidad debe estar configurado antes de activar el envío."
            )}
          </p>
          {errorFor("privacy_consent") ? (
            <p className="field-error" id="privacy_consent-error">
              Debes aceptar el tratamiento necesario para poder responder a la consulta.
            </p>
          ) : null}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button-link" disabled={!enabled || submitting}>
          {submitting ? "Enviando…" : "Consultar disponibilidad"}
        </button>
        <p className="form-status" aria-live="polite">
          {!enabled
            ? "El envío online está desactivado hasta completar la configuración de privacidad y servidor."
            : formMessage}
        </p>
      </div>
    </form>
  );
}
