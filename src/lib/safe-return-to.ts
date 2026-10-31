export function safeReturnTo(value: string | null | undefined, fallback = "/templates"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
