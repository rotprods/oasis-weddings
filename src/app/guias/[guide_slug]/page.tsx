import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ guide_slug: string }> {
  return [];
}

export default function GuideDetailPage() {
  // W5 will resolve this route from reviewed Guide nodes with real editorial value.
  notFound();
}
