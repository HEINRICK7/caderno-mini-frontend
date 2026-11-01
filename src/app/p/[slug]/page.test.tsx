// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicPublication, getPublicPublicationImageUrl } = vi.hoisted(() => ({
  getPublicPublication: vi.fn(),
  getPublicPublicationImageUrl: vi.fn(() => "https://api.example/api/v1/publications/slug.png"),
}));

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/lib/public-publication", () => ({ getPublicPublication, getPublicPublicationImageUrl }));

import PublicMessagePage from "./page";

afterEach(cleanup);

const publication = {
  templateId: "agradecimento-compra",
  templateVersion: 1,
  templateName: "Agradecimento pela compra",
  templateDescription: "Valoriza o cliente após a venda.",
  templateDefinition: {
    fields: [
      { id: "recipientName", type: "text" as const, label: "Nome do cliente" },
      { id: "businessName", type: "text" as const, label: "Nome da empresa" },
      { id: "message", type: "textarea" as const, label: "Mensagem principal" },
      { id: "productName", type: "text" as const, label: "Produto" },
      { id: "purchaseAmount", type: "number" as const, label: "Valor", format: "currency" as const },
      { id: "purchaseLink", type: "url" as const, label: "Link de compra" },
    ],
    catalog: { segment: "product" as const, category: "Agradecimento" as const },
    visual: { background: "#e5f0ff", surface: "#ffffff", accent: "#2563eb" },
    card: {
      illustration: "shopping-bag-heart" as const,
      brand: { businessNameFieldId: "businessName" },
      heading: "Obrigado, {{recipientName}}! 💙",
      message: "{{message}}",
      details: [
        { label: "Produto", value: "{{productName}}", icon: "package" as const },
        { label: "Valor", value: "{{purchaseAmount}}", icon: "credit-card" as const, format: "currency" as const },
      ],
      action: { label: "Ver detalhes da compra", hrefFieldId: "purchaseLink" },
      footer: "none" as const,
    },
  },
  publicUrl: "https://app.example/p/slug-publico",
  data: {
    recipientName: "Maria",
    businessName: "Cadernô Express",
    message: "Sua compra foi registrada com sucesso.",
    productName: "Conjunto de mesa",
    purchaseAmount: 350,
    purchaseLink: "https://loja.example/pedido/123",
  },
  publishedAt: "2026-10-31T12:01:00.000Z",
};

beforeEach(() => {
  getPublicPublication.mockReset().mockResolvedValue(publication);
  getPublicPublicationImageUrl.mockClear();
});

describe("página pública do cartão", () => {
  it("renderiza o modelo como HTML usando a versão e os dados publicados pelo backend", async () => {
    const page = await PublicMessagePage({ params: Promise.resolve({ slug: "slug-publico" }) });
    const { container } = render(page);

    expect(await screen.findByRole("heading", { name: "Obrigado, Maria! 💙" })).toBeTruthy();
    expect(container.textContent).toContain("Sua compra foi registrada com sucesso.");
    expect(container.textContent).toContain("Conjunto de mesa");
    expect(container.textContent).toContain("R$ 350,00");
    expect(screen.getByRole("link", { name: "Ver detalhes da compra" }).getAttribute("href"))
      .toBe("https://loja.example/pedido/123");
    expect(container.querySelector("article.message-template")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(getPublicPublication).toHaveBeenCalledWith("slug-publico");
  });
});
