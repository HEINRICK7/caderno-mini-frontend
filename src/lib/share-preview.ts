const assetIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ShareDefinition = {
  card?: {
    brand?: {
      logoFieldId?: string;
    };
  };
};

export function clientLogoAssetId(definition: ShareDefinition, data: Record<string, unknown>): string | null {
  const fieldId = definition.card?.brand?.logoFieldId;
  if (!fieldId) return null;
  const value = data[fieldId];
  return typeof value === "string" && assetIdPattern.test(value) ? value : null;
}

export async function loadClientLogo(assetId: string): Promise<string | null> {
  const apiBaseUrl = new URL(process.env.API_BASE_URL ?? "http://localhost:3000").origin;
  const response = await fetch(new URL(`/api/v1/assets/${assetId}/content`, `${apiBaseUrl}/`), {
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) return null;
  const type = response.headers.get("content-type") ?? "";
  const subtype = type.includes("jpeg") ? "jpeg" : type.includes("webp") ? "webp" : type.includes("png") ? "png" : null;
  if (!subtype) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 131_072) return null;
  return `data:image/${subtype};base64,${bytes.toString("base64")}`;
}
