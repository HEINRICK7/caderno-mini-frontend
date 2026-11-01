// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPurchase, publishDraft, replace } = vi.hoisted(() => ({
  getPurchase: vi.fn(),
  publishDraft: vi.fn(),
  replace: vi.fn(),
}));
let pollPurchase: (() => void) | undefined;

vi.mock("next/navigation", () => ({
  useParams: () => ({ purchaseId: "purchase-1" }),
  useRouter: () => ({ replace }),
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, readonly status = 400) { super(message); }
    readonly code = "TEST_ERROR";
  },
  api: { getPurchase, publishDraft },
}));

import PurchasePage from "./page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  getPurchase.mockReset();
  publishDraft.mockReset();
  replace.mockReset();
  pollPurchase = undefined;
  vi.spyOn(window, "setInterval").mockImplementation((handler) => {
    pollPurchase = handler as () => void;
    return 123 as unknown as ReturnType<typeof window.setInterval>;
  });
  vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);
});

describe("acompanhamento da compra", () => {
  it("publica após a confirmação do backend e prepara o link do WhatsApp", async () => {
    const publicUrl = "https://app.example/p/slug-publico";
    getPurchase.mockResolvedValue({
      purchaseId: "purchase-1",
      draftId: "draft-1",
      status: "paid",
      accessStatus: "active",
      updatedAt: "2026-10-31T12:00:00.000Z",
    });
    publishDraft.mockResolvedValue({
      slug: "slug-publico",
      status: "published",
      publicPath: "/p/slug-publico",
      publicUrl,
      publishedAt: "2026-10-31T12:01:00.000Z",
    });

    render(<PurchasePage />);

    expect(await screen.findByRole("heading", { name: "Link pronto" })).toBeTruthy();
    expect(screen.getByText("Pagamento confirmado")).toBeTruthy();
    expect(publishDraft).toHaveBeenCalledWith("draft-1");
    expect(screen.getByRole("link", { name: publicUrl }).getAttribute("href")).toBe(publicUrl);

    const whatsapp = screen.getByRole("link", { name: "Compartilhar no WhatsApp" });
    expect(whatsapp.getAttribute("href")).toBe(`https://wa.me/?text=${encodeURIComponent(publicUrl)}`);
  });

  it("não publica nem mostra o compartilhamento enquanto o pagamento está pendente", async () => {
    getPurchase.mockResolvedValue({
      purchaseId: "purchase-1",
      draftId: "draft-1",
      status: "pending",
      accessStatus: "none",
      updatedAt: "2026-10-31T12:00:00.000Z",
    });

    render(<PurchasePage />);

    expect(await screen.findByText("Aguardando confirmação")).toBeTruthy();
    expect(publishDraft).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Compartilhar no WhatsApp" })).toBeNull();
  });

  it("oculta o link público e o compartilhamento se o backend revogar o acesso", async () => {
    const publicUrl = "https://app.example/p/slug-publico";
    getPurchase.mockResolvedValue({
      purchaseId: "purchase-1",
      draftId: "draft-1",
      status: "paid",
      accessStatus: "active",
      updatedAt: "2026-10-31T12:00:00.000Z",
    });
    publishDraft.mockResolvedValue({
      slug: "slug-publico",
      status: "published",
      publicPath: "/p/slug-publico",
      publicUrl,
      publishedAt: "2026-10-31T12:01:00.000Z",
    });

    render(<PurchasePage />);
    expect(await screen.findByRole("link", { name: "Compartilhar no WhatsApp" })).toBeTruthy();

    getPurchase.mockResolvedValue({
      purchaseId: "purchase-1",
      draftId: "draft-1",
      status: "refunded",
      accessStatus: "revoked",
      updatedAt: "2026-10-31T12:02:00.000Z",
    });

    await act(async () => { pollPurchase?.(); });

    expect(await screen.findByText("Compra reembolsada")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: publicUrl })).toBeNull();
      expect(screen.queryByRole("link", { name: "Compartilhar no WhatsApp" })).toBeNull();
    });
  });
});
