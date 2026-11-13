import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicPublication } from "@/lib/public-publication";
import { clientCompanyName } from "@/lib/share-preview";
import { PIX_CHARGE_SHARE_PREVIEW_VERSION, shareLinkMetadata } from "@/lib/share-link-metadata";

type PublicMessagePageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: PublicMessagePageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const publication = await getPublicPublication(slug);
  if (!publication) {
    return {
      title: "Mensagem indisponível | Cadernô Express",
      robots: { index: false, follow: false },
    };
  }

  const companyName = clientCompanyName(publication.templateDefinition, publication.data);
  const { title, description } = shareLinkMetadata({
    businessName: companyName,
    templateName: publication.templateName,
    templateDescription: publication.templateDescription,
    purpose: publication.templateId === "cobranca-pix" ? "pix-charge" : "message",
  });
  const isPixCharge = publication.templateId === "cobranca-pix";
  const previewVersion = Array.isArray(query?.preview) ? query.preview[0] : query?.preview;
  const shareUrl = new URL(publication.publicUrl);
  const imageUrl = new URL(`/p/${slug}/share-image`, shareUrl);
  imageUrl.searchParams.set("v", String(Date.parse(publication.publishedAt)));
  if (isPixCharge && previewVersion === PIX_CHARGE_SHARE_PREVIEW_VERSION) {
    shareUrl.searchParams.set("preview", PIX_CHARGE_SHARE_PREVIEW_VERSION);
    imageUrl.searchParams.set("preview", PIX_CHARGE_SHARE_PREVIEW_VERSION);
  }
  const image = {
    url: imageUrl.toString(),
    type: "image/png",
    width: 1200,
    height: 630,
    alt: isPixCharge
      ? companyName ? `Cobrança Pix de ${companyName}` : "Cobrança Pix"
      : companyName ? `Cartão digital de ${companyName}` : `Cartão digital: ${publication.templateName}`,
  };

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Cadernô Express",
      title,
      description,
      url: shareUrl.toString(),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
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
