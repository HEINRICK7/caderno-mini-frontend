import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicDemoPublication } from "@/lib/public-demo-publication";
import { clientCompanyName } from "@/lib/share-preview";

type PublicDemoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicDemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  const companyName = demo ? clientCompanyName(demo.templateDefinition, demo.data) : "";
  const title = companyName ? "Uma mensagem especial" : (demo ? demo.templateName : "Demonstração indisponível");
  const description = companyName
    ? `Abra o cartão digital personalizado que ${companyName} preparou para você.`
    : "Veja um cartão digital personalizado.";
  const image = {
    url: `/d/${slug}/share-image`,
    type: "image/png",
    width: 1200,
    height: 630,
    alt: companyName ? `Cartão digital de ${companyName}` : "Cartão digital personalizado",
  };
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: companyName || "Cartão digital",
      title,
      description,
      ...(demo ? { url: demo.publicUrl } : {}),
      ...(demo ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(demo ? { images: [image.url] } : {}),
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
