import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header subpage-header">
      <BrandMark />
      <nav aria-label="Navegação principal" className="site-nav">
        <Link href="/templates">Modelos</Link>
        <Link href="/#steps">Como funciona</Link>
        <Link href="/templates">Para o seu negócio</Link>
        <Link href="/#examples">Depoimentos</Link>
        <Link className="button button--primary button--header" href="/templates">
          Criar minha mensagem <ArrowRight aria-hidden="true" size={13} />
        </Link>
      </nav>
    </header>
  );
}
