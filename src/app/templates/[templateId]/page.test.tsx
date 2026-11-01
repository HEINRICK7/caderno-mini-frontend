// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "@/lib/api-contracts";

const { getTemplate, validateTemplate, createDraft, push } = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  validateTemplate: vi.fn(),
  createDraft: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ templateId: "agradecimento-compra" }),
  useRouter: () => ({ push }),
}));
vi.mock("../../../components/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("../../../lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string) { super(message); this.status = 400; }
    status: number;
  },
  api: { getTemplate, validateTemplate, createDraft },
}));

import TemplatePage from "./page";

const purchaseTemplate: Template = {
  id: "agradecimento-compra",
  version: 1,
  name: "Agradecimento pela compra",
  description: "Valoriza o cliente após a venda.",
  createdAt: "2026-10-31T00:00:00.000Z",
  definition: {
    fields: [
      { id: "recipientName", type: "text", label: "Nome do cliente", placeholder: "Maria", required: true, width: "half" },
      { id: "businessName", type: "text", label: "Nome da empresa", placeholder: "Cadernô Express", required: true, width: "half" },
      { id: "businessLogo", type: "image", label: "Logo da empresa", helpText: "PNG, JPEG ou WebP · até 5 MB", maxBytes: 5242880, width: "full" },
      { id: "message", type: "textarea", label: "Mensagem principal", placeholder: "Sua compra foi registrada com sucesso.\nEsperamos que aproveite seu produto.", required: true, maxLength: 300, width: "full" },
      { id: "productName", type: "text", label: "Produto", placeholder: "Conjunto de mesa", required: true, section: "Detalhes do pedido", width: "half" },
      { id: "productImage", type: "image", label: "Imagem do produto", helpText: "PNG, JPEG ou WebP · até 5 MB", maxBytes: 5242880, section: "Detalhes do pedido", width: "full" },
      { id: "purchaseAmount", type: "number", label: "Valor", placeholder: "0,00", format: "currency", section: "Detalhes do pedido", width: "half" },
      { id: "purchaseLink", type: "url", label: "Link dos detalhes da compra", section: "Detalhes do pedido", width: "full" },
    ],
    catalog: { segment: "product", category: "Agradecimento" },
    visual: { background: "#e5f0ff", surface: "#ffffff", accent: "#2563eb" },
    card: {
      illustration: "shopping-bag-heart",
      brand: { businessNameFieldId: "businessName", logoFieldId: "businessLogo" },
      heading: "Obrigado, {{recipientName}}! 💙",
      message: "{{message}}",
      details: [
        { label: "Produto", value: "{{productName}}", imageFieldId: "productImage", icon: "package" },
        { label: "Valor", value: "{{purchaseAmount}}", icon: "credit-card", format: "currency" },
      ],
      action: { label: "Ver detalhes da compra", hrefFieldId: "purchaseLink" },
      footer: "none",
    },
  },
};

const serviceTemplate: Template = {
  id: "servico-contratado",
  version: 1,
  name: "Serviço contratado",
  description: "Confirma a contratação e informa os dados do serviço.",
  createdAt: "2026-10-31T00:00:00.000Z",
  definition: {
    fields: [
      { id: "recipientName", type: "text", label: "Nome do cliente", placeholder: "Maria", required: true, width: "half" },
      { id: "businessName", type: "text", label: "Nome da empresa", placeholder: "Cadernô Express", required: true, width: "half" },
      { id: "businessLogo", type: "image", label: "Logo da empresa", maxBytes: 5242880 },
      { id: "message", type: "textarea", label: "Mensagem principal", placeholder: "Confirmamos a contratação do seu serviço.", required: true },
      { id: "serviceName", type: "text", label: "Serviço", placeholder: "Manutenção de equipamento", required: true, section: "Detalhes do serviço" },
      { id: "scheduledAt", type: "date", label: "Data prevista para realização", section: "Detalhes do serviço", width: "half" },
      { id: "servicePrice", type: "number", label: "Valor do serviço", format: "currency", section: "Detalhes do serviço", width: "half" },
      { id: "serviceDetailsLink", type: "url", label: "Link com os detalhes do serviço", section: "Detalhes do serviço", width: "full" },
    ],
    catalog: { segment: "service", category: "Entrega" },
    visual: { background: "#e5f0ff", surface: "#ffffff", accent: "#2563eb" },
    card: {
      illustration: "service-clipboard",
      brand: { businessNameFieldId: "businessName", logoFieldId: "businessLogo" },
      heading: "Olá, {{recipientName}}!",
      message: "{{message}}",
      details: [
        { label: "Serviço", value: "{{serviceName}}", icon: "check" },
        { label: "Data da realização", value: "{{scheduledAt}}", icon: "calendar", format: "date" },
        { label: "Valor", value: "{{servicePrice}}", icon: "credit-card", format: "currency" },
      ],
      action: { label: "Ver detalhes do serviço", hrefFieldId: "serviceDetailsLink" },
      footer: "none",
    },
  },
};

afterEach(cleanup);
beforeEach(() => {
  getTemplate.mockReset().mockResolvedValue(purchaseTemplate);
  validateTemplate.mockReset().mockResolvedValue(undefined);
  createDraft.mockReset().mockResolvedValue({ id: "draft-1" });
  push.mockReset();
});

describe("editor de modelo", () => {
  it("segue a referência do editor e renderiza os campos e detalhes definidos pelo backend", async () => {
    render(<TemplatePage />);

    expect(await screen.findByRole("heading", { name: "Personalize sua mensagem" })).toBeTruthy();
    expect(screen.getByLabelText(/Nome do cliente/)).toBeTruthy();
    expect(screen.getByLabelText(/Nome da empresa/)).toBeTruthy();
    expect(screen.getByLabelText(/Logo da empresa/)).toBeTruthy();
    expect(screen.getByLabelText(/Mensagem principal/)).toBeTruthy();
    expect(screen.getByText("Detalhes do pedido")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Produto/), { target: { value: "Conjunto de mesa" } });
    fireEvent.change(screen.getByLabelText(/^Valor/), { target: { value: "350,00" } });
    expect(screen.getByText("Conjunto de mesa")).toBeTruthy();
    expect(screen.getByText(/350,00/)).toBeTruthy();
    expect(screen.getByText("Ver detalhes da compra")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Compartilhar/ }).hasAttribute("disabled")).toBe(true);
  });

  it("cria a prévia gratuita a partir dos valores preenchidos com o contrato do backend", async () => {
    render(<TemplatePage />);
    await screen.findByRole("heading", { name: "Personalize sua mensagem" });

    fireEvent.change(screen.getByLabelText(/Nome do cliente/), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText(/Nome da empresa/), { target: { value: "Cadernô Express" } });
    fireEvent.change(screen.getByLabelText(/Mensagem principal/), { target: { value: "Sua compra foi registrada com sucesso." } });
    fireEvent.change(screen.getByLabelText(/^Produto/), { target: { value: "Conjunto de mesa" } });
    fireEvent.change(screen.getByLabelText(/^Valor/), { target: { value: "350,00" } });
    fireEvent.click(screen.getByRole("button", { name: /Ver prévia gratuita/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/mensagens/draft-1"));
    expect(validateTemplate).toHaveBeenCalledWith("agradecimento-compra", {
      recipientName: "Maria",
      businessName: "Cadernô Express",
      message: "Sua compra foi registrada com sucesso.",
      productName: "Conjunto de mesa",
      purchaseAmount: 350,
    });
  });

  it("monta o formulário de serviço com os campos que o backend define para o modelo", async () => {
    getTemplate.mockResolvedValue(serviceTemplate);
    render(<TemplatePage />);

    expect(await screen.findByLabelText(/Nome do cliente/)).toBeTruthy();
    expect(screen.getByLabelText(/Nome da empresa/)).toBeTruthy();
    expect(screen.getByLabelText(/Logo da empresa/)).toBeTruthy();
    expect(screen.getByLabelText(/^Serviço/)).toBeTruthy();
    expect(screen.getByLabelText("Data prevista para realização")).toBeTruthy();
    expect(screen.getByLabelText("Valor do serviço")).toBeTruthy();
    expect(screen.getByText("Detalhes do serviço")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^Serviço/), { target: { value: "Manutenção de equipamento" } });
    fireEvent.change(screen.getByLabelText("Data prevista para realização"), { target: { value: "2026-11-10" } });
    fireEvent.change(screen.getByLabelText("Valor do serviço"), { target: { value: "1200,00" } });

    expect(screen.getByText("Manutenção de equipamento")).toBeTruthy();
    expect(screen.getByText("10 de novembro de 2026")).toBeTruthy();
    expect(screen.getByText(/1\.200,00/)).toBeTruthy();
    expect(validateTemplate).not.toHaveBeenCalled();
  });
});
