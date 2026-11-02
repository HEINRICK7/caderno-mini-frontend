import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicDemoPublication } from "@/lib/public-demo-publication";
import { clientCompanyName, clientLogoAssetId } from "@/lib/share-preview";

type PublicDemoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicDemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  const companyName = demo ? clientCompanyName(demo.templateDefinition, demo.data) : "";
  const title = companyName || (demo ? demo.templateName : "Demonstração indisponível");
  const description = companyName ? `Mensagem de ${companyName}` : "Demonstração gratuita de uma mensagem criada no Cadernô Express.";
  const hasPreview = Boolean(demo && (companyName || clientLogoAssetId(demo.templateDefinition, demo.data)));
  const image = { url: `/d/${slug}/share-image`, width: 1200, height: 630, alt: companyName || "Empresa" };
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: companyName || "Cadernô Express",
      title,
      description,
      ...(demo ? { url: demo.publicUrl } : {}),
      ...(hasPreview ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(hasPreview ? { images: [image.url] } : {}),
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
