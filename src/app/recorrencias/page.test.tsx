// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCustomerPortal, getMerchantCustomers, getMerchantCatalogItems, getMerchantRecurringPlans, createMerchantRecurringPlan, replace } = vi.hoisted(() => ({
  getCustomerPortal: vi.fn(), getMerchantCustomers: vi.fn(), getMerchantCatalogItems: vi.fn(),
  getMerchantRecurringPlans: vi.fn(), createMerchantRecurringPlan: vi.fn(), replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/customer-area-shell", () => ({
  CustomerAreaShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CustomerWorkspaceLoading: () => <div role="status">Carregando</div>,
}));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error { constructor(message: string, readonly status = 400) { super(message); } readonly code = "TEST_ERROR"; },
  api: { getCustomerPortal, getMerchantCustomers, getMerchantCatalogItems, getMerchantRecurringPlans, createMerchantRecurringPlan },
}));

import MerchantRecurrencesPage from "./page";

const portal = { user: { email: "lojista@example.com", profileComplete: true }, platformAccess: { active: true, accessPlan: "annual", expiresAt: null } } as never;
const customer = { id: "00000000-0000-4000-8000-000000000001", name: "Maria Silva", whatsapp: null, email: null, address: null, notes: null, status: "active", createdAt: "2026-11-13T12:00:00.000Z", updatedAt: "2026-11-13T12:00:00.000Z" };

afterEach(cleanup);
beforeEach(() => {
  getCustomerPortal.mockReset().mockResolvedValue(portal);
  getMerchantCustomers.mockReset().mockResolvedValue([customer]);
  getMerchantCatalogItems.mockReset().mockResolvedValue([]);
  getMerchantRecurringPlans.mockReset().mockResolvedValue([]);
  createMerchantRecurringPlan.mockReset().mockResolvedValue({ id: "00000000-0000-4000-8000-000000000002", customerId: customer.id, description: "Mensalidade escolar", currentAmountMinor: 8000, charges: [], frequency: "monthly", status: "active" });
  replace.mockReset();
});

describe("cobranças recorrentes", () => {
  it("cadastra uma mensalidade vinculada a um cliente e usa preço em centavos", async () => {
    render(<MerchantRecurrencesPage />);
    fireEvent.change(await screen.findByLabelText("Cliente *"), { target: { value: customer.id } });
    fireEvent.change(screen.getByLabelText("Descrição da cobrança *"), { target: { value: "Mensalidade escolar" } });
    fireEvent.change(screen.getByLabelText("Valor em reais *"), { target: { value: "80,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar cobrança recorrente" }));

    await waitFor(() => expect(createMerchantRecurringPlan).toHaveBeenCalledWith(expect.objectContaining({
      customerId: customer.id, description: "Mensalidade escolar", amountMinor: 8000, frequency: "monthly",
    })));
  });
});
