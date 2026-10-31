import { publicPublicationResponseSchema, type PublicPublication } from "./api-contracts";

const apiBaseUrl = new URL(process.env.API_BASE_URL ?? "http://localhost:3000").origin;

export async function getPublicPublication(slug: string): Promise<PublicPublication | null> {
  const response = await fetch(publicPublicationApiUrl(slug), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    redirect: "error",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Não foi possível abrir esta mensagem.");

  const body: unknown = await response.json();
  return publicPublicationResponseSchema.parse(body).data;
}

export function getPublicPublicationImageUrl(slug: string): string {
  return new URL(
    `/api/v1/publications/${encodeURIComponent(slug)}.png`,
    `${apiBaseUrl}/`,
  ).toString();
}

function publicPublicationApiUrl(slug: string): string {
  return new URL(
    `/api/v1/publications/${encodeURIComponent(slug)}`,
    `${apiBaseUrl}/`,
  ).toString();
}
