// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Draft, Template } from "@/lib/api-contracts";

const { getDraft, getTemplate, validateTemplate, saveDraft, createDemoPublication, push } = vi.hoisted(() => ({
  getDraft: vi.fn(),
  getTemplate: vi.fn(),
  validateTemplate: vi.fn(),
  saveDraft: vi.fn(),
  createDemoPublication: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ draftId: "draft-1" }),
  useRouter: () => ({ push }),
  usePathname: () => "/mensagens/draft-1",
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string) { super(message); this.status = 400; }
    status: number;
  },
  api: { getDraft, getTemplate, validateTemplate, saveDraft, createDemoPublication, getCustomerPortal: vi.fn().mockRejectedValue(new Error("No customer session")) },
}));

import DraftPage from "./page";

const template: Template = {
  id: "boas-vindas",
  version: 4,
  name: "Boas-vindas",
  description: null,
  createdAt: "2026-10-31T00:00:00.000Z",
  definition: {
    catalog: { segment: "both", category: "Boas-vindas", homeCategory: "relacionamento" },
    fields: [
      { id: "title", type: "text", label: "Título", required: true },
      { id: "highlightedText", type: "text", label: "Destaque" },
      { id: "subtitle", type: "text", label: "Subtítulo" },
      { id: "message", type: "textarea", label: "Descrição da mensagem" },
      { id: "systemStatus", type: "select", label: "Estado fornecido pelo domínio", editable: false, options: ["confirmed"] },
    ],
    card: {
      illustration: "wave",
      layout: "welcome",
      heading: "{{title}}",
      highlightedText: "{{highlightedText}}",
      subtitle: "{{subtitle}}",
      message: "{{message}}",
      footer: "none",
    },
  },
};

const originalDraft: Draft = {
  id: "draft-1",
  templateId: "boas-vindas",
  templateVersion: 4,
  data: { title: "Título inicial", message: "Descrição inicial", systemStatus: "confirmed" },
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
};

afterEach(cleanup);
beforeEach(() => {
  getDraft.mockReset().mockResolvedValue(originalDraft);
  getTemplate.mockReset().mockResolvedValue(template);
  validateTemplate.mockReset().mockResolvedValue(undefined);
  saveDraft.mockReset().mockImplementation(async (_id: string, data: Record<string, unknown>) => ({
    ...originalDraft,
    data,
    updatedAt: "2026-11-01T00:00:00.000Z",
  }));
  createDemoPublication.mockReset().mockResolvedValue({
    slug: "demo-slug",
    publicPath: "/d/demo-slug",
    publicUrl: "https://app.example/d/demo-slug",
    category: "relacionamento",
    created: true,
    expiresAt: "2026-11-08T12:00:00.000Z",
  });
  push.mockReset();
});

describe("editor de mensagem salva", () => {
  it("mostra a prévia em tempo real, salva só conteúdo editável e recupera o rascunho", async () => {
    const first = render(<DraftPage />);
    const titleInput = await screen.findByLabelText("Título *");
    expect((titleInput as HTMLInputElement).value).toBe("Título inicial");
    expect(screen.getByRole("heading", { name: "Título inicial" })).toBeTruthy();

    fireEvent.change(titleInput, { target: { value: "Um título personalizado" } });
    fireEvent.change(screen.getByLabelText("Subtítulo"), { target: { value: "Uma segunda linha" } });
    fireEvent.change(screen.getByLabelText("Descrição da mensagem"), { target: { value: "Uma descrição mais longa, escrita pelo estabelecimento." } });
    expect(screen.getByRole("heading", { name: "Um título personalizado" })).toBeTruthy();
    expect(screen.getAllByText("Uma segunda linha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Uma descrição mais longa, escrita pelo estabelecimento.").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Estado fornecido pelo domínio")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith("draft-1", {
      title: "Um título personalizado",
      subtitle: "Uma segunda linha",
      message: "Uma descrição mais longa, escrita pelo estabelecimento.",
    }));
    expect(validateTemplate).toHaveBeenCalledWith("boas-vindas", {
      title: "Um título personalizado",
      subtitle: "Uma segunda linha",
      message: "Uma descrição mais longa, escrita pelo estabelecimento.",
    });

    const savedDraft: Draft = {
      ...originalDraft,
      data: {
        title: "Um título personalizado",
        subtitle: "Uma segunda linha",
        message: "Uma descrição mais longa, escrita pelo estabelecimento.",
        systemStatus: "confirmed",
      },
      updatedAt: "2026-11-01T00:00:00.000Z",
    };
    first.unmount();
    getDraft.mockResolvedValue(savedDraft);
    render(<DraftPage />);

    expect((await screen.findByLabelText("Título *") as HTMLInputElement).value).toBe("Um título personalizado");
    expect((screen.getByLabelText("Subtítulo") as HTMLInputElement).value).toBe("Uma segunda linha");
    expect(screen.getByRole("heading", { name: "Um título personalizado" })).toBeTruthy();
  });

  it("salva e gera um link público gratuito da categoria sem iniciar checkout", async () => {
    render(<DraftPage />);
    const titleInput = await screen.findByLabelText("Título *");
    fireEvent.change(titleInput, { target: { value: "Texto para testar a mensagem" } });
    fireEvent.click(screen.getByRole("button", { name: "Gerar link gratuito de demonstração" }));

    const demoLink = await screen.findByRole("link", { name: "https://app.example/d/demo-slug" });
    expect(demoLink.getAttribute("href")).toBe("https://app.example/d/demo-slug");
    expect(saveDraft).toHaveBeenCalledWith("draft-1", expect.objectContaining({ title: "Texto para testar a mensagem" }));
    expect(createDemoPublication).toHaveBeenCalledWith("draft-1");
    expect(push).not.toHaveBeenCalled();
  });
});
