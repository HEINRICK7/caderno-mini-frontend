import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicPublication } from "@/lib/public-publication";
import { clientCompanyName, clientLogoAssetId } from "@/lib/share-preview";

type PublicMessagePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicMessagePageProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublicPublication(slug);
  if (!publication) {
    return {
      title: "Mensagem indisponível | Cadernô Express",
      robots: { index: false, follow: false },
    };
  }

  const companyName = clientCompanyName(publication.templateDefinition, publication.data);
  const title = companyName || publication.templateName;
  const description = companyName
    ? `Mensagem de ${companyName}`
    : publication.templateDescription ?? "Uma mensagem criada no Cadernô Express.";
  const hasPreview = Boolean(companyName || clientLogoAssetId(publication.templateDefinition, publication.data));
  const image = { url: `/p/${slug}/share-image`, width: 1200, height: 630, alt: companyName || publication.templateName };

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: companyName || "Cadernô Express",
      title,
      description,
      url: publication.publicUrl,
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

export default async function PublicMessagePage({ params }: PublicMessagePageProps) {
  const { slug } = await params;
  const publication = await getPublicPublication(slug);
  if (!publication) notFound();

  return (
    <main className="public-message-shell">
      <MessageTemplateCard
        data={publication.data}
        definition={publication.templateDefinition}
        description={publication.templateDescription}
        mode="published"
        title={publication.templateName}
      />
    </main>
  );
}
