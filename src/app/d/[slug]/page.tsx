import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageTemplateCard } from "@/components/message-template-card";
import { getPublicDemoPublication } from "@/lib/public-demo-publication";

type PublicDemoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicDemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  return {
    title: demo ? `Demonstração: ${demo.templateName} · Cadernô Express` : "Demonstração indisponível · Cadernô Express",
    description: "Demonstração gratuita de uma mensagem criada no Cadernô Express.",
    robots: { index: false, follow: false },
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
