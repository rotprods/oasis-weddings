import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OASIS WEDDINGS — Fotografía + cine de bodas",
    template: "%s — OASIS WEDDINGS",
  },
  description:
    "OASIS WEDDINGS — fotografía y cine de bodas con base en Murcia. Sitio en fase de construcción controlada.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
