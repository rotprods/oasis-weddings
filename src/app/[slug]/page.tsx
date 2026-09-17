import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialPage } from "@/components/editorial-page";
import { getPageDefinition, topLevelSlugs } from "@/lib/page-registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return topLevelSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageDefinition(slug);

  if (!page) return {};

  return {
    title: page.eyebrow,
    description: page.description,
  };
}

export default async function TopLevelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPageDefinition(slug);

  if (!page) notFound();

  return <EditorialPage page={page} />;
}
