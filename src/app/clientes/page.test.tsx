// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCustomerPortal, getMerchantCustomers, createMerchantCustomer, updateMerchantCustomer, replace } = vi.hoisted(() => ({
  getCustomerPortal: vi.fn(),
  getMerchantCustomers: vi.fn(),
  createMerchantCustomer: vi.fn(),
  updateMerchantCustomer: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/customer-area-shell", () => ({
  CustomerAreaShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CustomerWorkspaceLoading: () => <div role="status">Carregando</div>,
}));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error { constructor(message: string, readonly status = 400) { super(message); } readonly code = "TEST_ERROR"; },
  api: { getCustomerPortal, getMerchantCustomers, createMerchantCustomer, updateMerchantCustomer },
}));

import MerchantCustomersPage from "./page";

const portal = { user: { email: "lojista@example.com", profileComplete: true }, platformAccess: { active: true, accessPlan: "annual", expiresAt: null } } as never;
const customer = {
  id: "00000000-0000-4000-8000-000000000001", name: "Maria Silva", whatsapp: "(85) 99999-1234",
  email: "maria@example.com", address: null, notes: null, status: "active",
  createdAt: "2026-11-13T12:00:00.000Z", updatedAt: "2026-11-13T12:00:00.000Z",
};

afterEach(cleanup);
beforeEach(() => {
  getCustomerPortal.mockReset().mockResolvedValue(portal);
  getMerchantCustomers.mockReset().mockResolvedValue([]);
  createMerchantCustomer.mockReset().mockResolvedValue(customer);
  updateMerchantCustomer.mockReset().mockResolvedValue({ ...customer, status: "archived" });
  replace.mockReset();
});

describe("clientes comerciais", () => {
  it("cadastra um contato pela conta privada do comerciante", async () => {
    render(<MerchantCustomersPage />);

    fireEvent.change(await screen.findByLabelText("Nome completo *"), { target: { value: "Maria Silva" } });
    fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: "(85) 99999-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

    await waitFor(() => expect(createMerchantCustomer).toHaveBeenCalledWith(expect.objectContaining({
      name: "Maria Silva", whatsapp: "(85) 99999-1234", status: "active",
    })));
    expect(await screen.findByText("Cliente cadastrado.")).toBeTruthy();
  });

  it("allows the merchant to archive an existing customer", async () => {
    getMerchantCustomers.mockResolvedValue([customer]);
    render(<MerchantCustomersPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Maria Silva/ }));
    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(updateMerchantCustomer).toHaveBeenCalledWith(customer.id, expect.objectContaining({ status: "archived" })));
  });
});
