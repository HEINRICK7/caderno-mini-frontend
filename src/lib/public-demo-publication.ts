import { publicDemoPublicationResponseSchema, type DemoPublication } from "./api-contracts";

const apiBaseUrl = new URL(process.env.API_BASE_URL ?? "http://localhost:3000").origin;

export async function getPublicDemoPublication(slug: string): Promise<DemoPublication | null> {
  const response = await fetch(new URL(`/api/v1/demo-publications/${encodeURIComponent(slug)}`, `${apiBaseUrl}/`), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    redirect: "error",
  });

  if (response.status === 400 || response.status === 404 || response.status === 422) return null;
  if (!response.ok) throw new Error("Não foi possível abrir esta demonstração.");
  const body: unknown = await response.json();
  return publicDemoPublicationResponseSchema.parse(body).data;
}
