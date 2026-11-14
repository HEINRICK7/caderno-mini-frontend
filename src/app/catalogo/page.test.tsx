// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCustomerPortal, getMerchantCatalogItems, createMerchantCatalogItem, updateMerchantCatalogItem, replace } = vi.hoisted(() => ({
  getCustomerPortal: vi.fn(),
  getMerchantCatalogItems: vi.fn(),
  createMerchantCatalogItem: vi.fn(),
  updateMerchantCatalogItem: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/customer-area-shell", () => ({
  CustomerAreaShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CustomerWorkspaceLoading: () => <div role="status">Carregando</div>,
}));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error { constructor(message: string, readonly status = 400) { super(message); } readonly code = "TEST_ERROR"; },
  api: { getCustomerPortal, getMerchantCatalogItems, createMerchantCatalogItem, updateMerchantCatalogItem },
}));

import MerchantCatalogPage from "./page";

const portal = { user: { email: "lojista@example.com", profileComplete: true }, platformAccess: { active: true, accessPlan: "annual", expiresAt: null } } as never;
const item = {
  id: "00000000-0000-4000-8000-000000000002", kind: "service", name: "Manutenção", description: null, priceMinor: 12550,
  status: "active", createdAt: "2026-11-13T12:00:00.000Z", updatedAt: "2026-11-13T12:00:00.000Z",
};

afterEach(cleanup);
beforeEach(() => {
  getCustomerPortal.mockReset().mockResolvedValue(portal);
  getMerchantCatalogItems.mockReset().mockResolvedValue([]);
  createMerchantCatalogItem.mockReset().mockResolvedValue(item);
  updateMerchantCatalogItem.mockReset().mockResolvedValue({ ...item, priceMinor: 15000 });
  replace.mockReset();
});

describe("catálogo comercial", () => {
  it("salva um produto ou serviço usando centavos inteiros para o preço", async () => {
    render(<MerchantCatalogPage />);

    fireEvent.change(await screen.findByLabelText("Tipo *"), { target: { value: "service" } });
    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Manutenção" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Limpeza mensal" } });
    fireEvent.change(screen.getByLabelText("Preço padrão em reais"), { target: { value: "125,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar item" }));

    await waitFor(() => expect(createMerchantCatalogItem).toHaveBeenCalledWith(expect.objectContaining({
      kind: "service", name: "Manutenção", description: "Limpeza mensal", priceMinor: 12550, status: "active",
    })));
  });

  it("lets the merchant edit a catalog item and update its value", async () => {
    getMerchantCatalogItems.mockResolvedValue([item]);
    render(<MerchantCatalogPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Manutenção/ }));
    fireEvent.change(screen.getByLabelText("Preço padrão em reais"), { target: { value: "150,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(updateMerchantCatalogItem).toHaveBeenCalledWith(item.id, expect.objectContaining({ priceMinor: 15000 })));
  });
});
