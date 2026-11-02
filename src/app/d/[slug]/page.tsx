import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicDemoPublication } from "@/lib/public-demo-publication";
import { clientLogoAssetId } from "@/lib/share-preview";

type PublicDemoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicDemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  const title = demo ? `Demonstração: ${demo.templateName} · Cadernô Express` : "Demonstração indisponível · Cadernô Express";
  const description = "Demonstração gratuita de uma mensagem criada no Cadernô Express.";
  const logoId = demo ? clientLogoAssetId(demo.templateDefinition, demo.data) : null;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "Cadernô Express",
      title,
      description,
      ...(demo ? { url: demo.publicUrl } : {}),
      ...(logoId ? { images: [{ url: `/d/${slug}/share-image`, width: 1200, height: 630, alt: "Logo do cliente" }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(logoId ? { images: [`/d/${slug}/share-image`] } : {}),
    },
  };
}

export default async function PublicDemoPage({ params }: PublicDemoPageProps) {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  if (!demo) notFound();

  return (
    <main className="public-message-shell demo-public-message-shell">
      <section aria-label="Demonstração gratuita" className="demo-public-banner">
        <p>Demonstração gratuita · válida por 7 dias</p>
        <Link href="/templates">Conheça os 16 modelos premium</Link>
      </section>
      <MessageTemplateCard
        data={demo.data}
        definition={demo.templateDefinition}
        description={demo.templateDescription}
        mode="published"
        title={demo.templateName}
        showBusinessNamePlaceholder={false}
      />
    </main>
  );
}
