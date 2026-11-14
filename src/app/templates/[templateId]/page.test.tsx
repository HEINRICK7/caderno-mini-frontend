// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "@/lib/api-contracts";
import { backendCatalog } from "../../../../tests/helpers/backend-catalog";

const { getTemplate, validateTemplate, createDraft, push } = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  validateTemplate: vi.fn(),
  createDraft: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ templateId: "agradecimento-compra" }),
  useRouter: () => ({ push }),
  usePathname: () => "/templates/agradecimento-compra",
}));
vi.mock("../../../components/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("../../../lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string) { super(message); this.status = 400; }
    status: number;
  },
  api: { getTemplate, validateTemplate, createDraft, getCustomerPortal: vi.fn().mockRejectedValue(new Error("No customer session")) },
}));

import TemplatePage from "./page";

const purchaseTemplate: Template = {
  id: "agradecimento-compra",
  version: 3,
  name: "Agradecimento pela compra",
  description: "Valoriza o cliente após a venda.",
  createdAt: "2026-10-31T00:00:00.000Z",
  definition: {
    fields: [
      { id: "recipientName", type: "text", label: "Nome do cliente (variável)", placeholder: "Nome do cliente" },
      { id: "businessName", type: "text", label: "Nome do negócio (variável)", placeholder: "Nome do negócio" },
      { id: "title", type: "text", label: "Título", placeholder: "Escreva o título", required: true },
      { id: "highlightedText", type: "text", label: "Palavra ou frase em destaque", placeholder: "Trecho destacado" },
      { id: "subtitle", type: "text", label: "Subtítulo", placeholder: "Subtítulo" },
      { id: "message", type: "textarea", label: "Descrição da mensagem", placeholder: "Escreva uma mensagem de apoio" },
      { id: "detailLabel1", type: "text", label: "Rótulo do detalhe 1", placeholder: "Rótulo" },
      { id: "detailLabel2", type: "text", label: "Rótulo do detalhe 2", placeholder: "Rótulo" },
      { id: "productName", type: "text", label: "Nome do produto", placeholder: "Nome do produto" },
      { id: "purchaseAmount", type: "number", label: "Valor da compra", format: "currency" },
      { id: "productImage", type: "image", label: "Imagem do produto", maxBytes: 5242880 },
      { id: "purchaseLink", type: "url", label: "Destino do botão", placeholder: "https://" },
      { id: "primaryActionLabel", type: "text", label: "Texto do botão principal", placeholder: "Texto do botão" },
    ],
    catalog: { segment: "product", category: "Agradecimento" },
    visual: { background: "#e5f0ff", surface: "#ffffff", accent: "#2563eb" },
    card: {
      illustration: "shopping-bag-heart",
      layout: "standard",
      heading: "{{title}}",
      highlightedText: "{{highlightedText}}",
      subtitle: "{{subtitle}}",
      message: "{{message}}",
      variables: { nome_cliente: "recipientName", nome_empresa: "businessName", produto: "productName", valor: "purchaseAmount" },
      details: [
        { labelFieldId: "detailLabel1", value: "{{productName}}", icon: "package" },
        { labelFieldId: "detailLabel2", value: "{{purchaseAmount}}", icon: "credit-card", format: "currency" },
      ],
      product: { nameFieldId: "productName", imageFieldId: "productImage" },
      action: { labelFieldId: "primaryActionLabel", hrefFieldId: "purchaseLink" },
      footer: "none",
    },
  },
};

const serviceTemplate: Template = {
  ...purchaseTemplate,
  id: "servico-contratado",
  name: "Serviço contratado",
  definition: {
    ...purchaseTemplate.definition,
    catalog: { segment: "service", category: "Entrega" },
    fields: [
      ...purchaseTemplate.definition.fields.filter((field) => ["title", "highlightedText", "subtitle", "message"].includes(field.id)),
      { id: "serviceName", type: "text", label: "Nome do serviço", placeholder: "Nome do serviço" },
      { id: "scheduledAt", type: "date", label: "Data prevista" },
      { id: "servicePrice", type: "number", label: "Valor do serviço", format: "currency" },
    ],
    card: {
      illustration: "service-clipboard",
      heading: "{{title}}",
      highlightedText: "{{highlightedText}}",
      subtitle: "{{subtitle}}",
      message: "{{message}}",
      details: [
        { label: "Serviço", value: "{{serviceName}}" },
        { label: "Data", value: "{{scheduledAt}}", format: "date" },
        { label: "Valor", value: "{{servicePrice}}", format: "currency" },
      ],
      footer: "none",
    },
  },
};

const paymentConfirmedTemplate = backendCatalog.find((template) => template.id === "pagamento-confirmado") as unknown as Template;

afterEach(cleanup);
beforeEach(() => {
  getTemplate.mockReset().mockResolvedValue(purchaseTemplate);
  validateTemplate.mockReset().mockResolvedValue(undefined);
  createDraft.mockReset().mockResolvedValue({ id: "draft-1" });
  push.mockReset();
});

describe("editor de modelo", () => {
  it("atualiza título, destaque, descrição, produto e CTA no preview em tempo real", async () => {
    render(<TemplatePage />);
    await screen.findByRole("heading", { name: "Personalize sua mensagem" });

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Uma compra feita com carinho" } });
    fireEvent.change(screen.getByLabelText("Palavra ou frase em destaque"), { target: { value: "obrigado por escolher" } });
    fireEvent.change(screen.getByLabelText("Descrição da mensagem"), { target: { value: "Sua mensagem personalizada aparece aqui." } });
    fireEvent.change(screen.getByLabelText("Nome do produto"), { target: { value: "Kit de artesanato" } });
    fireEvent.change(screen.getByLabelText("Valor da compra"), { target: { value: "128,50" } });
    fireEvent.change(screen.getByLabelText("Texto do botão principal"), { target: { value: "Abrir detalhes" } });

    expect(screen.getByRole("heading", { name: "Uma compra feita com carinho" })).toBeTruthy();
    expect(screen.getByText("obrigado por escolher")).toBeTruthy();
    expect(screen.getAllByText("Sua mensagem personalizada aparece aqui.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kit de artesanato").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/128,50/).length).toBeGreaterThan(0);
    expect(screen.getByText("Abrir detalhes")).toBeTruthy();
    expect(screen.queryByLabelText(/Logo da empresa/)).toBeNull();
  });

  it("valida e salva o conteúdo editado para a criação do rascunho", async () => {
    render(<TemplatePage />);
    await screen.findByRole("heading", { name: "Personalize sua mensagem" });

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Novidade exclusiva" } });
    fireEvent.change(screen.getByLabelText("Subtítulo"), { target: { value: "Uma mensagem da loja" } });
    fireEvent.change(screen.getByLabelText("Descrição da mensagem"), { target: { value: "Texto escolhido pelo estabelecimento." } });
    fireEvent.click(screen.getByRole("button", { name: /Continuar com esta mensagem/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/mensagens/draft-1"));
    expect(validateTemplate).toHaveBeenCalledWith("agradecimento-compra", {
      title: "Novidade exclusiva",
      subtitle: "Uma mensagem da loja",
      message: "Texto escolhido pelo estabelecimento.",
    });
    expect(createDraft).toHaveBeenCalledWith("agradecimento-compra", {
      title: "Novidade exclusiva",
      subtitle: "Uma mensagem da loja",
      message: "Texto escolhido pelo estabelecimento.",
    });
  });

  it("monta estruturas de serviço com seus próprios campos de detalhe", async () => {
    getTemplate.mockResolvedValue(serviceTemplate);
    render(<TemplatePage />);

    fireEvent.change(await screen.findByLabelText("Título *"), { target: { value: "Serviço confirmado" } });
    fireEvent.change(screen.getByLabelText("Nome do serviço"), { target: { value: "Revisão completa" } });
    fireEvent.change(screen.getByLabelText("Data prevista"), { target: { value: "2026-11-10" } });
    fireEvent.change(screen.getByLabelText("Valor do serviço"), { target: { value: "1200,00" } });

    expect(screen.getByRole("heading", { name: "Serviço confirmado" })).toBeTruthy();
    expect(screen.getByText("Revisão completa")).toBeTruthy();
    expect(screen.getByText("10 de nov de 2026")).toBeTruthy();
    expect(screen.getByText(/1\.200,00/)).toBeTruthy();
    expect(validateTemplate).not.toHaveBeenCalled();
  });

  it("permite editar valor, data e botão e exige confirmação manual após conferir o banco", async () => {
    getTemplate.mockResolvedValue(paymentConfirmedTemplate);
    const { container } = render(<TemplatePage />);

    await screen.findByRole("heading", { name: "Personalize sua mensagem" });
    const amount = screen.getByLabelText("Valor pago *") as HTMLInputElement;
    const paidAt = screen.getByLabelText("Data do pagamento *") as HTMLInputElement;
    const destination = screen.getByLabelText("Link dos detalhes do pagamento *") as HTMLInputElement;
    const actionLabel = screen.getByLabelText("Texto do botão principal *") as HTMLInputElement;
    const confirmation = screen.getByLabelText("Confirmar após conferir no banco *") as HTMLSelectElement;

    expect(amount.value).toBe("");
    expect(paidAt.value).toBe("");
    expect(destination.value).toBe("");
    expect(confirmation.value).toBe("");

    fireEvent.change(amount, { target: { value: "100,00" } });
    fireEvent.change(paidAt, { target: { value: "2026-11-13" } });
    fireEvent.change(destination, { target: { value: "https://loja.example/comprovante" } });
    fireEvent.change(actionLabel, { target: { value: "Ver comprovante" } });
    fireEvent.change(confirmation, { target: { value: "confirmed" } });

    expect(container.querySelectorAll(".message-template__detail")).toHaveLength(2);
    expect(screen.getByText("13 de nov de 2026")).toBeTruthy();
    expect(screen.getByText(/100,00/)).toBeTruthy();
    expect(screen.getByText("Ver comprovante")).toBeTruthy();
    expect(screen.getByText(/O Caderno não consulta sua conta bancária/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Continuar com esta mensagem/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/mensagens/draft-1"));
    expect(validateTemplate).toHaveBeenCalledWith("pagamento-confirmado", expect.objectContaining({
      amount: 100,
      paidAt: "2026-11-13",
      detailsLink: "https://loja.example/comprovante",
      primaryActionLabel: "Ver comprovante",
      paymentStatus: "confirmed",
    }));
    expect(createDraft).toHaveBeenCalledWith("pagamento-confirmado", expect.objectContaining({
      amount: 100,
      paidAt: "2026-11-13",
      detailsLink: "https://loja.example/comprovante",
      primaryActionLabel: "Ver comprovante",
      paymentStatus: "confirmed",
    }));
  });
});
