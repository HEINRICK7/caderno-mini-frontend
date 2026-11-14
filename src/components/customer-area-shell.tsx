"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpenCheck, FileText, LayoutDashboard, LogOut, Menu, PackageOpen, Plus, QrCode, Repeat2, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { api } from "@/lib/api-client";
import type { PlatformAccessSummary } from "@/lib/api-contracts";

type CustomerAreaShellProps = {
  children: ReactNode;
  email?: string | null;
  access?: PlatformAccessSummary | null;
};

const navigation = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard, isCurrent: (path: string) => path === "/painel" },
  { href: "/clientes", label: "Clientes", icon: UsersRound, isCurrent: (path: string) => path.startsWith("/clientes") },
  { href: "/cadernetas", label: "Vendas e cobranças", icon: BookOpenCheck, isCurrent: (path: string) => path.startsWith("/cadernetas") },
  { href: "/mensagens", label: "Mensagens", icon: FileText, isCurrent: (path: string) => path === "/mensagens" },
];

const moreNavigation = [
  { href: "/catalogo", label: "Produtos e serviços", icon: PackageOpen, isCurrent: (path: string) => path.startsWith("/catalogo") },
  { href: "/recorrencias", label: "Cobranças recorrentes", icon: Repeat2, isCurrent: (path: string) => path.startsWith("/recorrencias") },
  { href: "/qrcode", label: "Criar QR Code", icon: QrCode, isCurrent: (path: string) => path === "/qrcode" },
  { href: "/conta", label: "Minha conta", icon: UserRound, isCurrent: (path: string) => path === "/conta" || path === "/primeiro-acesso" },
  { href: "/templates", label: "Criar mensagem", icon: Plus, isCurrent: (path: string) => path.startsWith("/templates") || path.startsWith("/mensagens/") },
];

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/templates")) return "Criar mensagem";
  if (pathname === "/mensagens") return "Minhas mensagens";
  if (pathname.startsWith("/mensagens/")) return "Editar mensagem";
  if (pathname.startsWith("/clientes")) return "Clientes";
  if (pathname.startsWith("/catalogo")) return "Produtos e serviços";
  if (pathname.startsWith("/cadernetas")) return "Cadernetas";
  if (pathname.startsWith("/recorrencias")) return "Cobranças recorrentes";
  if (pathname === "/qrcode") return "Criar QR Code";
  if (pathname === "/conta") return "Minha conta";
  if (pathname === "/primeiro-acesso") return "Completar cadastro";
  if (pathname.startsWith("/compras")) return "Compra";
  return "Visão geral";
}

export function CustomerAreaShell({ children, email, access }: CustomerAreaShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const hasPremiumAccess = access?.active ?? false;
  const currentTitle = pageTitle(pathname);
  const menuOpen = openMenuPathname === pathname;
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenMenuPathname(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    await api.signOutCustomer().catch(() => undefined);
    router.replace("/entrar");
  }

  return (
    <div className="customer-workspace">
      <aside aria-label="Navegação da área do cliente" className={`customer-workspace__sidebar${menuOpen ? " is-open" : ""}`}>
        <BrandMark ariaLabel="Cadernô Express — área do cliente" href="/painel" />
        <div className="customer-workspace__section-label">Seu espaço</div>
        <nav aria-label="Navegação da área do cliente" className="customer-workspace__nav" id="customer-workspace-nav">
          {navigation.map(({ href, label, icon: Icon, isCurrent }) => (
            <Link aria-current={isCurrent(pathname) ? "page" : undefined} href={href} key={href} onClick={() => setOpenMenuPathname(null)}>
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </Link>
          ))}
          <details className="customer-workspace__more">
            <summary>Mais recursos</summary>
            <div>{moreNavigation.map(({ href, label, icon: Icon, isCurrent }) => (
              <Link aria-current={isCurrent(pathname) ? "page" : undefined} href={href} key={href} onClick={() => setOpenMenuPathname(null)}>
                <Icon aria-hidden="true" size={18} /><span>{label}</span>
              </Link>
            ))}</div>
          </details>
        </nav>
        <div className="customer-workspace__account">
          <span className={`customer-workspace__license${hasPremiumAccess ? " is-active" : ""}`}>
            <ShieldCheck aria-hidden="true" size={14} />
            {hasPremiumAccess ? "Premium ativo" : access ? "Acesso de prévia" : "Conta conectada"}
          </span>
          <span className="customer-workspace__email" title={email ?? undefined}>{email ?? "Conta do cliente"}</span>
          <button className="customer-workspace__signout" disabled={signingOut} onClick={() => void signOut()} type="button">
            <LogOut aria-hidden="true" size={16} />
            <span>{signingOut ? "Saindo…" : "Sair da conta"}</span>
          </button>
        </div>
      </aside>

      <div className="customer-workspace__main">
        <header className="customer-workspace__topbar">
          <button aria-controls="customer-workspace-nav" aria-expanded={menuOpen} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} className="customer-workspace__menu-toggle" onClick={() => setOpenMenuPathname(menuOpen ? null : pathname)} type="button">
            {menuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            <span>{menuOpen ? "Fechar" : "Menu"}</span>
          </button>
          <div className="customer-workspace__breadcrumb"><span>Minha área</span><span aria-hidden="true">/</span><strong>{currentTitle}</strong></div>
          <div className={`customer-workspace__topbar-status${hasPremiumAccess ? " is-active" : ""}`}>
            <ShieldCheck aria-hidden="true" size={16} />
            <span>{hasPremiumAccess ? "Todos os recursos liberados" : "Sua conta Cadernô"}</span>
          </div>
        </header>
        <main className="customer-workspace__content">{children}</main>
      </div>
    </div>
  );
}

export function CustomerWorkspaceLoading({ label = "Abrindo sua área privada…" }: { label?: string }) {
  return (
    <main className="customer-workspace customer-workspace--loading">
      <div className="customer-workspace__loading-card" role="status">
        <BrandMark ariaLabel="Cadernô Express" />
        <span>{label}</span>
      </div>
    </main>
  );
}
