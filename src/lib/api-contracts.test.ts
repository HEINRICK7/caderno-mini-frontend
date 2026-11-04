import { describe, expect, it } from "vitest";
import {
  authMessageResponseSchema,
  draftResponseSchema,
  imageUploadResponseSchema,
  publicPublicationResponseSchema,
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
    catalog: { segment: "both", category: "Boas-vindas" },
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
    card: {
      illustration: "wave",
      heading: "Olá, {{recipientName}}!",
      message: "Que bom ter você por aqui!",
      footer: "heart",
    },
  },
  createdAt: "2026-10-31T10:00:00.000Z",
};

describe("contrato de Template publicado pelo backend", () => {
  it("aceita a definição visual e os campos suportados", () => {
    expect(templateSchema.parse(template)).toEqual(template);
  });

  it("usa segmento e categoria definidos pelo backend para organizar o catálogo", () => {
    expect(templateSchema.parse(template).definition.catalog).toEqual({ segment: "both", category: "Boas-vindas" });
    expect(() => templateSchema.parse({
      ...template,
      definition: { ...template.definition, catalog: { segment: "unknown", category: "Outros" } },
    })).toThrow();
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

  it("aceita composição semântica de cartão e rejeita marcação HTML", () => {
    expect(templateSchema.parse(template).definition.card).toEqual(template.definition.card);
    expect(() => templateSchema.parse({
      ...template,
      definition: { ...template.definition, card: { ...template.definition.card, html: "<script>" } },
    })).toThrow();
  });

  it("aceita campos organizados pelo backend e detalhes estruturados do cartão", () => {
    const structured = {
      ...template,
      definition: {
        ...template.definition,
        fields: [
          { id: "recipientName", type: "text", label: "Nome do cliente", width: "half" },
          { id: "businessLogo", type: "image", label: "Logo da empresa", maxBytes: 5242880 },
          { id: "productImage", type: "image", label: "Imagem do produto", maxBytes: 5242880 },
          { id: "purchaseAmount", type: "number", label: "Valor", format: "currency", section: "Detalhes do pedido", width: "half" },
        ],
        card: {
          illustration: "shopping-bag-heart",
          heading: "Obrigado, {{recipientName}}!",
          details: [
            { label: "Produto", value: "Conjunto", icon: "package", imageFieldId: "productImage" },
            { label: "Valor", value: "{{purchaseAmount}}", icon: "credit-card", format: "currency" },
          ],
          action: { label: "Ver detalhes da compra" },
          brand: { businessNameFieldId: "recipientName", logoFieldId: "businessLogo" },
          footer: "none",
        },
      },
    };

    expect(templateSchema.parse(structured)).toEqual(structured);
    expect(() => templateSchema.parse({
      ...structured,
      definition: { ...structured.definition, fields: [{ id: "value", type: "text", format: "currency" }] },
    })).toThrow();
  });

  it("aceita datas estruturadas e as duas ações configuradas para um modelo de serviço", () => {
    const approvalTemplate = {
      ...template,
      definition: {
        ...template.definition,
        fields: [
          { id: "scheduledAt", type: "date", label: "Data da realização" },
          { id: "approveLink", type: "url", label: "Link para aprovar" },
          { id: "rejectLink", type: "url", label: "Link para recusar" },
        ],
        card: {
          illustration: "approval-hourglass",
          heading: "Olá, cliente!",
          details: [{ label: "Data da realização", value: "{{scheduledAt}}", format: "date" }],
          actions: [
            { label: "Sim, quero", hrefFieldId: "approveLink" },
            { label: "Agora não", hrefFieldId: "rejectLink" },
          ],
          footer: "none",
        },
      },
    };

    expect(templateSchema.parse(approvalTemplate).definition.card?.actions).toHaveLength(2);
  });
});

describe("contratos de criação e compartilhamento", () => {
  const timestamp = "2026-10-31T10:00:00.000Z";

  it("aceita somente a referência criada pelo backend para uma imagem enviada", () => {
    const response = { data: { id: "7b7d828b-f189-496a-b59b-9fae6a9b8531", contentUrl: "/api/v1/assets/7b7d828b-f189-496a-b59b-9fae6a9b8531/content" } };
    expect(imageUploadResponseSchema.parse(response)).toEqual(response);
    expect(() => imageUploadResponseSchema.parse({ data: { ...response.data, id: "inline-image-data" } })).toThrow();
  });

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

  it("usa a definição do modelo fixada na versão da publicação", () => {
    const publication = {
      data: {
        templateId: "welcome",
        templateVersion: 3,
        templateName: "Boas-vindas",
        templateDescription: null,
        templateDefinition: template.definition,
        publicUrl: `https://caderno.example/p/${"a".repeat(43)}`,
        data: { recipientName: "Maria", message: "Que bom ter você por aqui!" },
        publishedAt: timestamp,
      },
    };

    expect(publicPublicationResponseSchema.parse(publication)).toEqual(publication);
    expect(() => publicPublicationResponseSchema.parse({
      data: { ...publication.data, templateDefinition: { ...template.definition, html: "<script>" } },
    })).toThrow();
  });

  it("aceita apenas estados de compra publicados pelo backend", () => {
    const purchase = {
      data: {
        purchaseId: "purchase-1",
        draftId: "draft-1",
        status: "pending",
        accessStatus: "none",
        amountMinor: null,
        currency: null,
        expiresAt: null,
        updatedAt: timestamp,
      },
    };
    expect(purchaseStatusResponseSchema.parse(purchase)).toEqual(purchase);
    expect(() => purchaseStatusResponseSchema.parse({
      data: { ...purchase.data, status: "success" },
    })).toThrow();
  });
});
