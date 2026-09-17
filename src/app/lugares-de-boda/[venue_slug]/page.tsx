import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ venue_slug: string }> {
  return [];
}

export default function VenueDetailPage() {
  // W4 will resolve this route only from evidence-backed Venue nodes.
  notFound();
}
