import { describe, expect, it } from "vitest";
import {
  authMessageResponseSchema,
  draftResponseSchema,
  publicationResponseSchema,
  purchaseStatusResponseSchema,
  templateSchema,
} from "./api-contracts";

const template = {
  id: "welcome",
  version: 1,
  name: "Boas-vindas",
  description: "Uma mensagem de boas-vindas.",
  definition: {
    fields: [
      { id: "recipientName", type: "text", label: "Nome do cliente", required: true, maxLength: 120 },
      { id: "message", type: "textarea", label: "Mensagem", maxLength: 500 },
      { id: "occasion", type: "select", label: "Ocasião", options: ["Primeira visita", "Retorno"] },
    ],
    visual: {
      layout: "card",
      background: "#E1F3EF",
      surface: "#FFFFFF",
      accent: "#168A80",
      heading: "#24324A",
      text: "#24324A",
      muted: "#5A687A",
      headingFont: "sans",
      bodyFont: "sans",
      frame: "none",
    },
  },
  createdAt: "2026-10-31T10:00:00.000Z",
};

describe("contrato de Template publicado pelo backend", () => {
  it("aceita a definição visual e os campos suportados", () => {
    expect(templateSchema.parse(template)).toEqual(template);
  });

  it("rejeita metadados de catálogo que o backend ainda não fornece", () => {
    expect(() => templateSchema.parse({ ...template, category: "products" })).toThrow();
  });

  it("rejeita tipos de campo que não existem no contrato", () => {
    const invalid = {
      ...template,
      definition: {
        ...template.definition,
        fields: [{ id: "segment", type: "tag-picker", label: "Segmento" }],
      },
    };

    expect(() => templateSchema.parse(invalid)).toThrow();
  });
});

describe("contratos de criação e compartilhamento", () => {
  const timestamp = "2026-10-31T10:00:00.000Z";

  it("aceita somente o formato de rascunho do backend", () => {
    const draft = {
      data: {
        id: "draft-1",
        templateId: "welcome",
        templateVersion: 1,
        data: { recipientName: "Maria" },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    expect(draftResponseSchema.parse(draft)).toEqual(draft);
    expect(() => draftResponseSchema.parse({ ...draft, data: { ...draft.data, editToken: "inventado" } })).toThrow();
  });

  it("aceita a resposta neutra do envio de magic link", () => {
    expect(authMessageResponseSchema.parse({
      data: { message: "Se o endereço puder receber um link, enviaremos as instruções." },
    })).toBeTruthy();
  });

  it("só confirma a publicação com o contrato e URL retornados pelo backend", () => {
    const publication = {
      data: {
        slug: "a".repeat(43),
        status: "published",
        publicPath: `/p/${"a".repeat(43)}`,
        publicUrl: `https://caderno.example/p/${"a".repeat(43)}`,
        publishedAt: timestamp,
      },
    };
    expect(publicationResponseSchema.parse(publication)).toEqual(publication);
    expect(() => publicationResponseSchema.parse({ data: { ...publication.data, status: "paid" } })).toThrow();
  });

  it("aceita apenas estados de compra publicados pelo backend", () => {
    const purchase = {
      data: {
        purchaseId: "purchase-1",
        draftId: "draft-1",
        status: "pending",
        accessStatus: "none",
        updatedAt: timestamp,
      },
    };
    expect(purchaseStatusResponseSchema.parse(purchase)).toEqual(purchase);
    expect(() => purchaseStatusResponseSchema.parse({
      data: { ...purchase.data, status: "success" },
    })).toThrow();
  });
});
