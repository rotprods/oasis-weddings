import Link from "next/link";

const disciplines = [
  {
    index: "01",
    label: "Fotografía",
    title: "Momentos con contexto, no una colección de poses.",
    href: "/fotografia-de-boda/",
  },
  {
    index: "02",
    label: "Cine",
    title: "Imagen, sonido y montaje para volver al día.",
    href: "/video-de-boda/",
  },
  {
    index: "03",
    label: "Historias",
    title: "Cada boda conectada a sus imágenes, films y lugar.",
    href: "/bodas/",
  },
] as const;

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-meta">
          <p>Murcia · España</p>
          <p>Fotografía + cine de bodas</p>
        </div>
        <h1 id="home-title">
          Guardar el día.
          <br />
          <em>Sin convertirlo en otra cosa.</em>
        </h1>
        <div className="hero-bottom">
          <p>
            OASIS WEDDINGS construye una experiencia visual alrededor de historias reales: fotografía,
            cine y un archivo editorial pensado para seguir teniendo sentido dentro de muchos años.
          </p>
          <Link className="button-link" href="/disponibilidad/">
            Consultar disponibilidad
          </Link>
        </div>
        <div className="hero-frame" aria-hidden="true">
          <span>O</span>
          <span>W</span>
        </div>
      </section>

      <section className="home-statement" aria-labelledby="statement-title">
        <p className="eyebrow">Dirección creativa</p>
        <h2 id="statement-title">
          La web no compite con las imágenes. Les da espacio, contexto y una ruta hacia la siguiente
          decisión.
        </h2>
      </section>

      <section className="discipline-list" aria-label="Áreas principales">
        {disciplines.map((item) => (
          <Link className="discipline-row" href={item.href} key={item.index}>
            <span className="section-index">{item.index}</span>
            <span className="eyebrow">{item.label}</span>
            <strong>{item.title}</strong>
            <span className="row-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </section>

      <section className="home-proof" aria-labelledby="proof-title">
        <div>
          <p className="eyebrow">Portfolio conectado</p>
          <h2 id="proof-title">Una boda será una entidad, no una carpeta.</h2>
        </div>
        <div className="proof-copy">
          <p>
            El futuro portfolio parte de un AssetsGraph: cada boda tendrá wedding_id y cada fotografía o
            film su identidad, procedencia, derechos y relaciones. La web podrá enseñar menos, mejor y con
            contexto verificable.
          </p>
          <div className="proof-links">
            <Link href="/portfolio/">Explorar portfolio</Link>
            <Link href="/lugares-de-boda/">Explorar lugares</Link>
          </div>
        </div>
      </section>

      <section className="home-conversion" aria-labelledby="conversion-title">
        <p className="eyebrow">Disponibilidad</p>
        <h2 id="conversion-title">Si la fecha importa, empecemos por ahí.</h2>
        <p>
          La consulta final será breve y trazable: fecha, lugar, servicio, contacto y contexto suficiente
          para saber si existe encaje.
        </p>
        <Link className="button-link button-link--inverse" href="/disponibilidad/">
          Consultar fecha
        </Link>
      </section>
    </div>
  );
}
