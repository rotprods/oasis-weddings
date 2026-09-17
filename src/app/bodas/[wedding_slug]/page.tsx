import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ wedding_slug: string }> {
  return [];
}

export default function WeddingDetailPage() {
  // W3 will resolve this route from rights-approved Wedding nodes in AssetsGraph.
  // Returning 404 now prevents fabricated case studies and accidental indexable placeholders.
  notFound();
}
