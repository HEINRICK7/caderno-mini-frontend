// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCustomerPortal, getMerchantCustomers, getMerchantCatalogItems, getMerchantCustomerLedger, getMerchantChargeMessages, createMerchantSale, recordMerchantInstallmentPayment, replace } = vi.hoisted(() => ({
  getCustomerPortal: vi.fn(), getMerchantCustomers: vi.fn(), getMerchantCatalogItems: vi.fn(),
  getMerchantCustomerLedger: vi.fn(), getMerchantChargeMessages: vi.fn(), createMerchantSale: vi.fn(), recordMerchantInstallmentPayment: vi.fn(), replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/customer-area-shell", () => ({
  CustomerAreaShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CustomerWorkspaceLoading: () => <div role="status">Carregando</div>,
}));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error { constructor(message: string, readonly status = 400) { super(message); } readonly code = "TEST_ERROR"; },
  api: { getCustomerPortal, getMerchantCustomers, getMerchantCatalogItems, getMerchantCustomerLedger, getMerchantChargeMessages, createMerchantSale, recordMerchantInstallmentPayment },
}));

import MerchantLedgersPage from "./page";

const portal = { user: { email: "lojista@example.com", profileComplete: true }, platformAccess: { active: true, accessPlan: "annual", expiresAt: null } } as never;
const customer = { id: "00000000-0000-4000-8000-000000000001", name: "Maria Silva", whatsapp: "(85) 99999-1234", email: null, address: null, notes: null, status: "active", createdAt: "2026-11-13T12:00:00.000Z", updatedAt: "2026-11-13T12:00:00.000Z" };
const item = { id: "00000000-0000-4000-8000-000000000002", kind: "product", name: "Caderno A5", description: null, priceMinor: 10002, status: "active", createdAt: "2026-11-13T12:00:00.000Z", updatedAt: "2026-11-13T12:00:00.000Z" };

afterEach(cleanup);
beforeEach(() => {
  getCustomerPortal.mockReset().mockResolvedValue(portal);
  getMerchantCustomers.mockReset().mockResolvedValue([customer]);
  getMerchantCatalogItems.mockReset().mockResolvedValue([item]);
  getMerchantCustomerLedger.mockReset().mockResolvedValue({ customer, sales: [] });
  getMerchantChargeMessages.mockReset().mockResolvedValue([]);
  createMerchantSale.mockReset().mockResolvedValue({ id: "00000000-0000-4000-8000-000000000003", totalMinor: 10002, items: [], installments: [], payments: [] });
  recordMerchantInstallmentPayment.mockReset().mockResolvedValue({});
  replace.mockReset();
});

describe("cadernetas comerciais", () => {
  it("registra uma venda parcelada usando o preço atual do catálogo e centavos inteiros", async () => {
    render(<MerchantLedgersPage />);
    fireEvent.change(await screen.findByLabelText("Cliente *"), { target: { value: customer.id } });
    fireEvent.change(screen.getByLabelText("Item do catálogo"), { target: { value: item.id } });
    fireEvent.change(screen.getByLabelText("Condição de pagamento"), { target: { value: "installments" } });
    fireEvent.change(screen.getByLabelText("Quantidade de parcelas"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Primeiro vencimento"), { target: { value: "2027-01-31" } });
    fireEvent.click(screen.getByLabelText("Confirmo a condição e o vencimento desta venda."));
    fireEvent.click(screen.getByRole("button", { name: "Registrar venda" }));

    await waitFor(() => expect(createMerchantSale).toHaveBeenCalledWith(expect.objectContaining({
      customerId: customer.id,
      items: [{ catalogItemId: item.id, quantity: 1, unitPriceMinor: 10002 }],
      condition: "installments", installmentCount: 2, firstDueDate: "2027-01-31",
    })));
    expect((screen.getByLabelText("Condição de pagamento") as HTMLSelectElement).value).toBe("");
  });

  it("requires an explicit payment condition and confirmation for a sale on credit", async () => {
    render(<MerchantLedgersPage />);
    const condition = await screen.findByLabelText("Condição de pagamento") as HTMLSelectElement;
    expect(condition.value).toBe("");
    fireEvent.change(screen.getByLabelText("Cliente *"), { target: { value: customer.id } });
    fireEvent.change(screen.getByLabelText("Item do catálogo"), { target: { value: item.id } });
    fireEvent.change(condition, { target: { value: "single_due" } });
    fireEvent.change(screen.getByLabelText("Primeiro vencimento"), { target: { value: "2026-11-20" } });

    const submit = screen.getByRole("button", { name: "Registrar venda" });
    expect(submit).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByLabelText("Confirmo a condição e o vencimento desta venda."));
    expect(submit).toHaveProperty("disabled", false);
    fireEvent.change(screen.getByLabelText("Primeiro vencimento"), { target: { value: "2026-11-21" } });
    expect(submit).toHaveProperty("disabled", true);
    expect(createMerchantSale).not.toHaveBeenCalled();
  });
});
