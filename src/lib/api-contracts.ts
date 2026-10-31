import { z } from "zod";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const templateFieldSchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/),
  type: z.enum(["text", "textarea", "number", "boolean", "select", "url", "color", "date"]),
  label: z.string().min(1).max(120).optional(),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  required: z.boolean().optional(),
  maxLength: z.number().int().min(1).max(20_000).optional(),
  options: z.array(z.string().min(1).max(120)).optional(),
}).strict().superRefine((field, context) => {
  if (field.type === "select" && (!field.options || field.options.length === 0)) {
    context.addIssue({ code: "custom", message: "Campos de seleção precisam de opções.", path: ["options"] });
  }
  if (field.type !== "select" && field.options !== undefined) {
    context.addIssue({ code: "custom", message: "Somente campos de seleção aceitam opções.", path: ["options"] });
  }
});

export const templateVisualSchema = z.object({
  layout: z.enum(["card", "centered", "editorial", "minimal"]).optional(),
  background: hexColorSchema.optional(),
  surface: hexColorSchema.optional(),
  accent: hexColorSchema.optional(),
  heading: hexColorSchema.optional(),
  text: hexColorSchema.optional(),
  muted: hexColorSchema.optional(),
  headingFont: z.enum(["serif", "sans", "rounded"]).optional(),
  bodyFont: z.enum(["serif", "sans", "rounded"]).optional(),
  frame: z.enum(["none", "single", "double"]).optional(),
}).strict();

export const templateCardSchema = z.object({
  illustration: z.enum([
    "wave",
    "shopping-bag-heart",
    "installment-calendar",
    "due-calendar",
    "overdue-warning",
    "pix-qr",
    "payment-check",
    "trophy",
    "service-clipboard",
    "service-seal",
    "gift",
    "product-tag",
    "offer-tag",
    "collection-bag",
    "reactivation-heart",
    "approval-hourglass",
  ]),
  heading: z.string().min(1).max(300),
  message: z.string().max(500).optional(),
  footer: z.literal("heart"),
}).strict();

export const templateCatalogSchema = z.object({
  segment: z.enum(["product", "service", "both"]),
  category: z.enum(["Agradecimento", "Boas-vindas", "Datas especiais", "Cobrança", "Entrega", "Promoções"]),
}).strict();

export const templateDefinitionSchema = z.object({
  fields: z.array(templateFieldSchema).max(100),
  catalog: templateCatalogSchema.optional(),
  visual: templateVisualSchema.optional(),
  card: templateCardSchema.optional(),
}).strict();

export const templateSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  definition: templateDefinitionSchema,
  createdAt: z.string().datetime({ offset: true }),
}).strict();

export const templateListResponseSchema = z.object({
  data: z.array(templateSchema),
}).strict();

export const templateResponseSchema = z.object({
  data: templateSchema,
}).strict();

export const templateValidationResponseSchema = z.object({
  data: z.object({ valid: z.literal(true) }).strict(),
}).strict();

export const jsonObjectSchema = z.record(z.string(), z.unknown());

export const draftSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  templateVersion: z.number().int().positive(),
  data: jsonObjectSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).strict();

export const draftResponseSchema = z.object({ data: draftSchema }).strict();

export const createDraftResponseSchema = z.object({ data: draftSchema }).strict();

export const authMessageResponseSchema = z.object({
  data: z.object({ message: z.string() }).strict(),
}).strict();

export const sessionResponseSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      createdAt: z.string().datetime({ offset: true }),
    }).strict(),
  }).strict(),
}).strict();

export const checkoutResponseSchema = z.object({
  data: z.object({
    purchaseId: z.string(),
    checkoutUrl: z.string().url(),
    status: z.literal("pending"),
  }).strict(),
}).strict();

export const purchaseStatusResponseSchema = z.object({
  data: z.object({
    purchaseId: z.string(),
    draftId: z.string(),
    status: z.enum(["pending", "paid", "refunded", "chargedback", "canceled", "refused"]),
    accessStatus: z.enum(["active", "revoked", "none"]),
    updatedAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict();

export const publicationResponseSchema = z.object({
  data: z.object({
    slug: z.string(),
    status: z.literal("published"),
    publicPath: z.string(),
    publicUrl: z.string().url(),
    publishedAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict();

export const publicPublicationResponseSchema = z.object({
  data: z.object({
    templateId: z.string(),
    templateVersion: z.number().int().positive(),
    templateName: z.string(),
    templateDescription: z.string().nullable(),
    templateDefinition: templateDefinitionSchema,
    publicUrl: z.string().url(),
    data: jsonObjectSchema,
    publishedAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict();


export type Template = z.infer<typeof templateSchema>;
export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateVisual = z.infer<typeof templateVisualSchema>;
export type TemplateCard = z.infer<typeof templateCardSchema>;
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type PurchaseStatus = z.infer<typeof purchaseStatusResponseSchema>["data"];
export type PublicPublication = z.infer<typeof publicPublicationResponseSchema>["data"];
