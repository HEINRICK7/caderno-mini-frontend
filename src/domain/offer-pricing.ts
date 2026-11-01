export function calculateDiscountPercentage(originalPrice: number, finalPrice: number): number | null {
  if (!Number.isFinite(originalPrice) || !Number.isFinite(finalPrice) || originalPrice <= 0 || finalPrice < 0 || finalPrice >= originalPrice) {
    return null;
  }
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
