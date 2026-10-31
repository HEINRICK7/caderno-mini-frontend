import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicPublication, getPublicPublicationImageUrl } from "@/lib/public-publication";

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
  const image = getPublicPublicationImageUrl(slug);

  return {
    title: publication.templateName,
    description,
    openGraph: {
      type: "website",
      siteName: "Cadernô Express",
      title: publication.templateName,
      description,
      url: publication.publicUrl,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: publication.templateName,
      description,
      images: [image],
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
        title={publication.templateName}
      />
    </main>
  );
}
