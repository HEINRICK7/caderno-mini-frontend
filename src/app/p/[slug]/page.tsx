import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicPublication } from "@/lib/public-publication";
import { clientCompanyName } from "@/lib/share-preview";

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
  const displayCompanyName = companyName.length > 42 ? `${companyName.slice(0, 41).trimEnd()}…` : companyName;
  const title = companyName
    ? `Cartão de ${displayCompanyName} | Cadernô Express`
    : `${publication.templateName} | Cadernô Express`;
  const description = companyName
    ? `Cartão digital de ${companyName}, criado com o Cadernô Express. Confira o conteúdo e valide os dados antes de pagar.`
    : `Você recebeu uma mensagem criada com o Cadernô Express. Abra o link para conferir o cartão${publication.templateDescription ? `: ${publication.templateDescription}` : ""}.`;
  const image = {
    url: `/p/${slug}/share-image?v=${Date.parse(publication.publishedAt)}`,
    type: "image/png",
    width: 1200,
    height: 630,
    alt: companyName ? `Cartão digital de ${companyName}` : `Cartão digital: ${publication.templateName}`,
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
      url: publication.publicUrl,
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
