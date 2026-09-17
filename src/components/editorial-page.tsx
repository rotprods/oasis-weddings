import Link from "next/link";
import type { PageDefinition } from "@/lib/page-registry";

export function EditorialPage({ page }: { page: PageDefinition }) {
  return (
    <article className="editorial-page">
      <header className="editorial-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className="lede">{page.intro}</p>
        <Link className="text-cta" href={page.ctaHref}>
          {page.ctaLabel} <span aria-hidden="true">↗</span>
        </Link>
      </header>

      {page.sections.length > 0 ? (
        <div className="editorial-sections">
          {page.sections.map((section, index) => (
            <section className="editorial-section" key={`${page.slug}-${index}`}>
              <div>
                <p className="section-index">{String(index + 1).padStart(2, "0")}</p>
                {section.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
              </div>
              <div>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <section className="closing-cta" aria-labelledby={`${page.slug}-closing-title`}>
        <p className="eyebrow">OASIS WEDDINGS</p>
        <h2 id={`${page.slug}-closing-title`}>Cuando la historia esté lista, la interfaz debe desaparecer.</h2>
        <Link className="button-link" href={page.ctaHref}>
          {page.ctaLabel}
        </Link>
      </section>
    </article>
  );
}
