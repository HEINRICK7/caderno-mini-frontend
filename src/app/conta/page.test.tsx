// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccountAccess, publishDraft, replace } = vi.hoisted(() => ({
  getAccountAccess: vi.fn(),
  publishDraft: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, readonly status = 400) { super(message); }
    readonly code = "TEST_ERROR";
  },
  api: { getAccountAccess, publishDraft },
}));

import AccountPage from "./page";
import { ApiError } from "@/lib/api-client";

afterEach(() => cleanup());

beforeEach(() => {
  getAccountAccess.mockReset();
  publishDraft.mockReset();
  replace.mockReset();
});

describe("Minha conta", () => {
  it("explica como encontrar a compra quando ainda não há acesso vinculado", async () => {
    getAccountAccess.mockResolvedValue([]);

    render(<AccountPage />);

    expect(await screen.findByRole("heading", { name: "Ainda não há mensagens na sua conta" })).toBeTruthy();
    expect(screen.getByText(/mesmo e-mail informado no checkout/i)).toBeTruthy();
  });

  it("cria um link compartilhável para uma compra ativa", async () => {
    getAccountAccess.mockResolvedValue([{
      purchaseId: "purchase-1",
      draftId: "draft-1",
      purchaseStatus: "paid",
      accessStatus: "active",
      grantedAt: "2026-10-31T12:00:00.000Z",
    }]);
    const publicUrl = "https://app.example/p/slug-publico";
    publishDraft.mockResolvedValue({ publicUrl });

    render(<AccountPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Criar link da mensagem" }));

    expect(await screen.findByRole("link", { name: publicUrl })).toBeTruthy();
    expect(publishDraft).toHaveBeenCalledWith("draft-1");
  });

  it("não oferece link para acesso revogado", async () => {
    getAccountAccess.mockResolvedValue([{
      purchaseId: "purchase-1",
      draftId: "draft-1",
      purchaseStatus: "refunded",
      accessStatus: "revoked",
      grantedAt: "2026-10-31T12:00:00.000Z",
    }]);

    render(<AccountPage />);

    expect(await screen.findByText("Acesso indisponível · compra em 31/10/2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Criar link da mensagem" })).toBeNull();
    expect(publishDraft).not.toHaveBeenCalled();
  });

  it("encaminha usuários sem sessão para o login mantendo Minha conta como destino", async () => {
    getAccountAccess.mockRejectedValue(new ApiError("Entre para continuar.", 401, "AUTH_REQUIRED"));

    render(<AccountPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/entrar?returnTo=%2Fconta"));
  });
});
