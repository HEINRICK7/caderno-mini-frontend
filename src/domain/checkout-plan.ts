export type CheckoutPlan = "annual" | "lifetime";

export const checkoutPlanDetails: Record<CheckoutPlan, { name: string; price: string; amountMinor: number; access: string }> = {
  annual: { name: "Plano Anual", price: "R$ 47,00", amountMinor: 4700, access: "acesso por 12 meses" },
  lifetime: { name: "Plano Anual", price: "R$ 47,00", amountMinor: 4700, access: "acesso por 12 meses" },
};

export function parseCheckoutPlan(value: string | null): CheckoutPlan | undefined {
  return value === "annual" || value === "lifetime" ? "annual" : undefined;
}
