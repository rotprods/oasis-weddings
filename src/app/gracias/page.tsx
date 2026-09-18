import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consulta",
  description: "Estado de una consulta de disponibilidad de OASIS WEDDINGS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const confirmed = submitted === "1";

  return (
    <article className="thanks-page">
      <p className="eyebrow">{confirmed ? "Consulta recibida" : "OASIS WEDDINGS"}</p>
      <h1>
        {confirmed
          ? "Gracias. Ya tenemos vuestra consulta."
          : "Esta página solo confirma envíos completados."}
      </h1>
      <p className="lede">
        {confirmed
          ? "El siguiente paso es revisar la fecha y el contexto que nos habéis enviado."
          : "Si todavía no has enviado una consulta, puedes empezar desde disponibilidad."}
      </p>
      <Link className="button-link" href={confirmed ? "/" : "/disponibilidad/"}>
        {confirmed ? "Volver al inicio" : "Consultar disponibilidad"}
      </Link>
    </article>
  );
}
