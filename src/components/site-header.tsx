"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Plus } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PwaInstallAction } from "@/components/pwa-install-action";
import { api } from "@/lib/api-client";

const navigation = [
  { href: "/templates", label: "Modelos", match: (path: string) => path.startsWith("/templates") },
  { href: "/como-funciona", label: "Como funciona", match: (path: string) => path === "/como-funciona" },
  { href: "/para-seu-negocio", label: "Para seu negócio", match: (path: string) => path === "/para-seu-negocio" },
  { href: "/depoimentos", label: "Depoimentos", match: (path: string) => path === "/depoimentos" },
  { href: "/#planos", label: "Planos", match: () => false },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api.getCurrentUser().then((user) => {
      if (active) setCustomerEmail(user.email);
    }).catch(() => {
      if (active) setCustomerEmail(null);
    });
    return () => { active = false; };
  }, []);

  const accountLink = {
    href: customerEmail ? "/painel" : "/entrar",
    label: customerEmail ? "Minha área" : "Minha conta",
    match: (path: string) => customerEmail
      ? path === "/painel" || path === "/primeiro-acesso"
      : path === "/entrar" || path === "/conta",
  };
  const links = [...navigation.slice(0, 5), accountLink];

  return (
    <header className="site-header subpage-header">
      <BrandMark />
      <nav aria-label="Navegação principal" className="site-nav site-nav--desktop">
        {links.map(({ href, label, match }) => (
          <Link aria-current={match(pathname) ? "page" : undefined} href={href} key={href} title={href === "/painel" && customerEmail ? customerEmail : undefined}>
            {label}
          </Link>
        ))}
        <PwaInstallAction variant="desktop" />
        <Link className="button button--primary button--header" href="/templates">
          Criar um cartão <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </nav>
      <div className="site-header__mobile-actions">
        <Link className="button button--primary button--header" href="/templates">
          <Plus aria-hidden="true" size={15} />
          <span className="button--header-wide">Criar um cartão</span>
          <span className="button--header-mobile">Criar cartão</span>
          <span className="button--header-compact">Criar</span>
        </Link>
        <details className="site-menu">
          <summary aria-label="Abrir menu principal">
            <Menu aria-hidden="true" size={21} />
          </summary>
          <div className="site-menu__panel">
            <nav aria-label="Navegação principal" className="site-menu__links">
              {links.map(({ href, label, match }) => (
                <Link aria-current={match(pathname) ? "page" : undefined} href={href} key={href} title={href === "/painel" && customerEmail ? customerEmail : undefined}>
                  {label}
                </Link>
              ))}
            </nav>
            <PwaInstallAction variant="menu" />
            <Link className="button button--primary site-menu__cta" href="/templates">
              Criar um cartão <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
