import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { readLeadCaptureEnvironment } from "@/lib/lead-capture.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Disponibilidad",
  description:
    "Consulta de disponibilidad para fotografía y cine de boda con OASIS WEDDINGS.",
};

const statusMessages: Record<string, string> = {
  revisar: "La consulta no se ha enviado. Revisa los campos y vuelve a intentarlo.",
  limite: "Hemos recibido demasiados intentos seguidos. Prueba de nuevo en un minuto.",
  "no-disponible":
    "La consulta online no está disponible ahora mismo. No se ha confirmado ningún envío.",
};

export default async function DisponibilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const environment = readLeadCaptureEnvironment();
  const params = await searchParams;
  const statusMessage = params.estado ? statusMessages[params.estado] : undefined;

  return (
    <article className="availability-page">
      <header className="availability-hero">
        <p className="eyebrow">Disponibilidad</p>
        <h1>Empecemos por la fecha.</h1>
        <p className="lede">
          Una consulta breve para saber dónde será la boda, qué cobertura necesitáis y
          cómo podemos responderos con contexto.
        </p>
      </header>

      <section className="availability-form-section" aria-labelledby="availability-form-title">
        <div className="availability-form-intro">
          <p className="section-index">01</p>
          <div>
            <p className="eyebrow">Consulta</p>
            <h2 id="availability-form-title">Los datos mínimos para empezar bien.</h2>
            <p>
              No hace falta tener todo decidido. Fecha, servicio y un contacto válido son
              suficientes para abrir la conversación.
            </p>
          </div>
        </div>

        {statusMessage ? (
          <p className="form-banner" role="status">
            {statusMessage}
          </p>
        ) : null}

        <EnquiryForm
          enabled={environment.ok}
          initialSubmissionKey={randomUUID()}
          privacyNoticeUrl={
            environment.ok ? environment.value.privacyNoticeUrl : undefined
          }
        />
      </section>
    </article>
  );
}
