"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, LayoutDashboard, LogOut, Plus, QrCode, ShieldCheck, UserRound } from "lucide-react";
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
  { href: "/mensagens", label: "Minhas mensagens", icon: FileText, isCurrent: (path: string) => path === "/mensagens" },
  { href: "/templates", label: "Criar mensagem", icon: Plus, isCurrent: (path: string) => path.startsWith("/templates") || path.startsWith("/mensagens/") },
  { href: "/qrcode", label: "Criar QR Code", icon: QrCode, isCurrent: (path: string) => path === "/qrcode" },
  { href: "/conta", label: "Minha conta", icon: UserRound, isCurrent: (path: string) => path === "/conta" || path === "/primeiro-acesso" },
];

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/templates")) return "Criar mensagem";
  if (pathname === "/mensagens") return "Minhas mensagens";
  if (pathname.startsWith("/mensagens/")) return "Editar mensagem";
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
  const hasPremiumAccess = access?.active ?? false;
  const currentTitle = pageTitle(pathname);

  async function signOut() {
    setSigningOut(true);
    await api.signOutCustomer().catch(() => undefined);
    router.replace("/entrar");
  }

  return (
    <div className="customer-workspace">
      <aside aria-label="Navegação da área do cliente" className="customer-workspace__sidebar">
        <BrandMark ariaLabel="Cadernô Express — área do cliente" href="/painel" />
        <div className="customer-workspace__section-label">Seu espaço</div>
        <nav aria-label="Navegação da área do cliente" className="customer-workspace__nav">
          {navigation.map(({ href, label, icon: Icon, isCurrent }) => (
            <Link aria-current={isCurrent(pathname) ? "page" : undefined} href={href} key={href}>
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </Link>
          ))}
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
