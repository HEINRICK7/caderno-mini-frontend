// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Template } from "../../lib/api-contracts";

const { getTemplates } = vi.hoisted(() => ({ getTemplates: vi.fn() }));

vi.mock("../../lib/api-client", () => ({
  ApiError: class ApiError extends Error {},
  api: { getTemplates },
}));
vi.mock("../../components/site-header", () => ({ SiteHeader: () => <header /> }));

import TemplatesPage from "./page";

afterEach(() => {
  cleanup();
  getTemplates.mockReset();
});

const models: Template[] = [
  makeTemplate("boas-vindas", "Boas-vindas", "Recebe novos clientes de forma acolhedora.", "both", "Boas-vindas", "wave"),
  makeTemplate("obrigado-compra", "Agradecimento pela compra", "Valoriza o cliente após a venda.", "product", "Agradecimento", "shopping-bag-heart"),
  makeTemplate("parcela-proxima", "Parcela próxima do vencimento", "Lembra a data com antecedência.", "both", "Cobrança", "installment-calendar"),
];

describe("catálogo de modelos", () => {
  it("renderiza os modelos do backend com os textos e filtros da referência", async () => {
    getTemplates.mockResolvedValue(models);
    render(<TemplatesPage />);

    expect(await screen.findByRole("heading", { name: "Escolha o próximo recado." })).toBeTruthy();
    expect(screen.getByText("Comece com uma ideia pronta, personalize do seu jeito e compartilhe no momento certo.")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Boas-vindas" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Agradecimento pela compra" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Parcela próxima do vencimento" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Produtos" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Boas-vindas" })).toBeTruthy();
    expect(document.querySelectorAll(".template-card")).toHaveLength(3);
    expect(document.querySelectorAll(".template-card img")).toHaveLength(2);
  });

  it("filtra pelo segmento e pela categoria declarados pelo backend", async () => {
    getTemplates.mockResolvedValue(models);
    render(<TemplatesPage />);

    await screen.findByRole("heading", { name: "Boas-vindas" });
    fireEvent.click(screen.getByRole("button", { name: "Serviços" }));
    await waitFor(() => expect(document.querySelectorAll(".template-card")).toHaveLength(2));
    expect(screen.queryByRole("heading", { name: "Agradecimento pela compra" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cobrança" }));
    expect(await screen.findByRole("heading", { name: "Parcela próxima do vencimento" })).toBeTruthy();
    expect(document.querySelectorAll(".template-card")).toHaveLength(1);
  });
});

function makeTemplate(
  id: string,
  name: string,
  description: string,
  segment: "product" | "service" | "both",
  category: "Agradecimento" | "Boas-vindas" | "Datas especiais" | "Cobrança" | "Entrega" | "Promoções",
  illustration: NonNullable<Template["definition"]["card"]>["illustration"],
): Template {
  return {
    id,
    version: 1,
    name,
    description,
    createdAt: "2026-10-31T00:00:00.000Z",
    definition: {
      fields: [],
      catalog: { segment, category },
      visual: { background: "#E1F3EF" },
      card: { illustration, heading: "Olá, cliente!", footer: "heart" },
    },
  };
}
