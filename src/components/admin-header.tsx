import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function AdminHeader() {
  return (
    <header className="admin-header">
      <BrandMark ariaLabel="Cadernô Express — painel administrativo" href="/admin" />
      <span className="admin-header__context">
        <ShieldCheck aria-hidden="true" size={16} />
        Painel administrativo
      </span>
    </header>
  );
}
