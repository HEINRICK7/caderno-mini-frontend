import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicPublication, getPublicPublicationImageUrl } from "./public-publication";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("publicação pública usada pela página Next.js", () => {
  it("carrega a definição versionada direto do backend sem cache", async () => {
    const responseBody = {
      data: {
        templateId: "welcome",
        templateVersion: 2,
        templateName: "Boas-vindas",
        templateDescription: null,
        templateDefinition: { fields: [{ id: "recipientName", type: "text" }] },
        publicUrl: "https://app.example.com/p/public-slug",
        data: { recipientName: "Maria" },
        publishedAt: "2026-10-31T10:00:00.000Z",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responseBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    const publication = await getPublicPublication("public-slug");

    expect(publication).toEqual(responseBody.data);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/publications/public-slug",
      expect.objectContaining({ cache: "no-store", redirect: "error" }),
    );
  });

  it("usa a imagem PNG do backend como prévia Open Graph", () => {
    expect(getPublicPublicationImageUrl("public-slug")).toBe(
      "http://localhost:3000/api/v1/publications/public-slug.png",
    );
  });

  it("trata publicação ausente como não encontrada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getPublicPublication("missing-slug")).resolves.toBeNull();
  });
});
