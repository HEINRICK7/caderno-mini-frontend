import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicPublication } from "@/lib/public-publication";
import { clientLogoAssetId } from "@/lib/share-preview";

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

  const description = publication.templateDescription ?? "Uma mensagem criada no Cadernô Express.";
  const logoId = clientLogoAssetId(publication.templateDefinition, publication.data);
  const image = logoId ? [{ url: `/p/${slug}/share-image`, width: 1200, height: 630, alt: "Logo do cliente" }] : undefined;

  return {
    title: publication.templateName,
    description,
    openGraph: {
      type: "website",
      siteName: "Cadernô Express",
      title: publication.templateName,
      description,
      url: publication.publicUrl,
      ...(image ? { images: image } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: publication.templateName,
      description,
      ...(image ? { images: [image[0].url] } : {}),
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
