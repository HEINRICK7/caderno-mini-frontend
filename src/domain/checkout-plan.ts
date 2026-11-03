export type CheckoutPlan = "annual" | "lifetime";

export function parseCheckoutPlan(value: string | null): CheckoutPlan | undefined {
  return value === "annual" || value === "lifetime" ? value : undefined;
}
