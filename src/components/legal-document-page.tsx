import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export function LegalDocumentPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="subpage-shell marketing-shell">
      <SiteHeader />
      <main className="marketing-page legal-page">
        <nav aria-label="Você está em" className="legal-page__breadcrumb">
          <Link href="/">Início</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>

        <header className="legal-page__hero">
          <p className="marketing-eyebrow">Cadernô Express · Informações legais</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <p className="legal-page__updated">
            Atualizado em <time dateTime="2026-11-14">14 de novembro de 2026</time>
          </p>
        </header>

        <article className="legal-document">{children}</article>

        <footer className="legal-page__footer">
          <nav aria-label="Documentos legais">
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/">Voltar ao Cadernô Express</Link>
          </nav>
          <p>
            Dúvidas? <a href="mailto:contato@otimizanegocio.com">contato@otimizanegocio.com</a>
            {" · "}
            <a href="https://wa.me/5586995389481" rel="noreferrer" target="_blank">WhatsApp (86) 99538-9481</a>
          </p>
          <p>Cadernô Express · CNPJ 46.770.466/0001-77</p>
        </footer>
      </main>
    </div>
  );
}
