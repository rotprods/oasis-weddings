import Link from "next/link";
import type { ReactNode } from "react";

const primaryNav = [
  ["Portfolio", "/portfolio/"],
  ["Bodas", "/bodas/"],
  ["Fotografía", "/fotografia-de-boda/"],
  ["Cine", "/video-de-boda/"],
  ["OASIS", "/sobre-oasis/"],
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="OASIS WEDDINGS — inicio">
          OASIS <span>WEDDINGS</span>
        </Link>
        <nav className="primary-nav" aria-label="Navegación principal">
          {primaryNav.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="header-cta" href="/disponibilidad/">
          Disponibilidad
        </Link>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div>
          <p className="footer-mark">OASIS WEDDINGS</p>
          <p className="footer-copy">Fotografía + cine de bodas · Murcia · España</p>
        </div>
        <div className="footer-links" aria-label="Enlaces de pie de página">
          <Link href="/guias/">Guías</Link>
          <Link href="/lugares-de-boda/">Lugares</Link>
          <Link href="/colecciones/">Colecciones</Link>
          <Link href="/disponibilidad/">Disponibilidad</Link>
        </div>
      </footer>
    </div>
  );
}
