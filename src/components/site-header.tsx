import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PwaInstallAction } from "@/components/pwa-install-action";

export function SiteHeader() {
  return (
    <header className="site-header subpage-header">
      <BrandMark />
      <nav aria-label="Navegação principal" className="site-nav site-nav--desktop">
        <Link href="/templates">Modelos</Link>
        <Link href="/#steps">Como funciona</Link>
        <Link href="/templates">Para o seu negócio</Link>
        <Link href="/#examples">Depoimentos</Link>
        <Link href="/#planos">Planos</Link>
        <Link href="/conta">Minha conta</Link>
        <PwaInstallAction variant="desktop" />
        <Link className="button button--primary button--header" href="/templates">
          Criar minha mensagem <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </nav>
      <div className="site-header__mobile-actions">
        <Link className="button button--primary button--header" href="/templates">
          <span className="button--header-wide">Criar mensagem</span>
          <span className="button--header-compact">Criar</span>
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
        <details className="site-menu">
          <summary aria-label="Abrir menu principal">
            <Menu aria-hidden="true" size={21} />
          </summary>
          <div className="site-menu__panel">
            <nav aria-label="Navegação principal" className="site-menu__links">
              <Link href="/templates">Modelos</Link>
              <Link href="/#steps">Como funciona</Link>
              <Link href="/templates">Para o seu negócio</Link>
              <Link href="/#examples">Depoimentos</Link>
              <Link href="/#planos">Planos</Link>
              <Link href="/conta">Minha conta</Link>
            </nav>
            <PwaInstallAction variant="menu" />
            <Link className="button button--primary site-menu__cta" href="/templates">
              Criar minha mensagem <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
