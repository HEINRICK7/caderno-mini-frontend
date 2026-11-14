// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getPlatformCheckoutAvailability } = vi.hoisted(() => ({
  getPlatformCheckoutAvailability: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getPlatformCheckoutAvailability,
    createPlatformCheckout: vi.fn(),
  },
}));

import { PlanCheckoutAction } from "./plan-checkout-action";

afterEach(() => {
  cleanup();
  getPlatformCheckoutAvailability.mockReset();
});

describe("ação de checkout do plano", () => {
  it("desativa a compra quando a API informa que o plano está suspenso", async () => {
    getPlatformCheckoutAvailability.mockResolvedValue({ enabled: false });
    render(<PlanCheckoutAction />);

    const button = await screen.findByRole("button", { name: /Compra temporariamente indisponível/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("aprovação dos documentos");
  });

  it("mantém a compra ativa quando a API libera o checkout", async () => {
    getPlatformCheckoutAvailability.mockResolvedValue({ enabled: true });
    render(<PlanCheckoutAction />);

    const button = await screen.findByRole("button", { name: /Comprar por R\$ 47,00/ });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
