export type CheckoutPlan = "annual" | "lifetime";

export const checkoutPlanDetails: Record<CheckoutPlan, { name: string; price: string; amountMinor: number; access: string }> = {
  annual: { name: "Plano Anual", price: "R$ 33,50", amountMinor: 3350, access: "acesso por 12 meses" },
  lifetime: { name: "Plano Vitalício", price: "R$ 67,00", amountMinor: 6700, access: "acesso sem vencimento" },
};

export function parseCheckoutPlan(value: string | null): CheckoutPlan | undefined {
  return value === "annual" || value === "lifetime" ? value : undefined;
}
