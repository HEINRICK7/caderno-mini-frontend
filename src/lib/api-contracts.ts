import { z } from "zod";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const MAX_TEMPLATE_IMAGE_BYTES = 5 * 1024 * 1024;

export const templateFieldSchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/),
  type: z.enum(["text", "textarea", "number", "boolean", "select", "url", "color", "date", "image"]),
  label: z.string().min(1).max(120).optional(),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  section: z.string().min(1).max(80).optional(),
  width: z.enum(["half", "full"]).optional(),
  format: z.enum(["currency"]).optional(),
  required: z.boolean().optional(),
  editable: z.boolean().optional(),
  maxLength: z.number().int().min(1).max(20_000).optional(),
  maxBytes: z.number().int().min(1).max(MAX_TEMPLATE_IMAGE_BYTES).optional(),
  options: z.array(z.string().min(1).max(120)).optional(),
}).strict().superRefine((field, context) => {
  if (field.format !== undefined && field.type !== "number") {
    context.addIssue({ code: "custom", message: "O formato de moeda só pode ser usado em campos numéricos.", path: ["format"] });
  }
  if (field.maxBytes !== undefined && field.type !== "image") {
    context.addIssue({ code: "custom", message: "O limite em bytes só pode ser usado em campos de imagem.", path: ["maxBytes"] });
  }
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
  layout: z.enum(["standard", "welcome", "product", "offer", "collection", "pix", "approval", "celebration", "settled"]).optional(),
  variables: z.record(z.string().regex(/^[a-z_]{1,32}$/), z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/)).optional(),
  heading: z.string().min(1).max(300),
  highlightedText: z.string().max(300).optional(),
  subtitle: z.string().max(500).optional(),
  subtitlePlacement: z.enum(["before-highlight", "after-highlight"]).optional(),
  subtitleStyle: z.enum(["supporting", "subheading"]).optional(),
  pixNoteFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
  message: z.string().max(500).optional(),
  details: z.array(z.object({
    label: z.string().min(1).max(80).optional(),
    labelFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    value: z.string().max(300),
    valueStyle: z.enum(["emphasis", "supporting"]).optional(),
    statusBadge: z.string().min(1).max(24).optional(),
    imageFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    icon: z.enum([
      "package", "credit-card", "calendar", "check", "link", "qrcode", "chat", "badge", "wallet", "receipt",
      "heart", "shield", "gift", "cake", "sparkles", "shopping-bag", "clock", "clipboard-check",
    ]).optional(),
    format: z.enum(["currency", "date"]).optional(),
  }).strict()).min(1).max(6).optional(),
  product: z.object({
    nameFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    descriptionFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    imageFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    galleryFieldIds: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/)).max(6).optional(),
    priceFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    originalPriceFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    icon: z.enum(["cake", "calendar"]).optional(),
  }).strict().optional(),
  financial: z.object({
    stateFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/),
    expectedState: z.enum(["confirmed", "settled"]),
    balanceFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
  }).strict().optional(),
  action: z.object({
    label: z.string().min(1).max(120).optional(),
    labelFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    hrefFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    copyFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
  }).strict().superRefine((action, context) => {
    if (!action.label && !action.labelFieldId) {
      context.addIssue({ code: "custom", message: "Cada ação precisa de um texto ou campo de texto." });
    }
  }).optional(),
  actions: z.array(z.object({
    label: z.string().min(1).max(120).optional(),
    labelFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    hrefFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
    copyFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
  }).strict().superRefine((action, context) => {
    if (!action.label && !action.labelFieldId) {
      context.addIssue({ code: "custom", message: "Cada ação precisa de um texto ou campo de texto." });
    }
  })).min(1).max(3).optional(),
  brand: z.object({
    businessNameFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/),
    logoFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/).optional(),
  }).strict().optional(),
  footer: z.enum(["heart", "none"]),
}).strict();

export const templateCatalogSchema = z.object({
  segment: z.enum(["product", "service", "both"]),
  category: z.enum(["Agradecimento", "Boas-vindas", "Datas especiais", "Cobrança", "Entrega", "Promoções"]),
  homeCategory: z.enum(["relacionamento", "cobrancas", "ofertas", "servicos"]).optional(),
}).strict();

export const templateDefinitionSchema = z.object({
  fields: z.array(templateFieldSchema).max(100),
  exampleData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
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

export const imageUploadResponseSchema = z.object({
  data: z.object({ id: z.string().uuid(), contentUrl: z.string() }).strict(),
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

export const accountAccessResponseSchema = z.object({
  data: z.array(z.object({
    purchaseId: z.string(),
    draftId: z.string(),
    purchaseStatus: z.enum(["pending", "paid", "refunded", "chargedback", "canceled", "refused"]),
    accessStatus: z.enum(["active", "revoked"]),
    grantedAt: z.string().datetime({ offset: true }),
  }).strict()),
}).strict();

export const adminUserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  accountStatus: z.enum(["active", "suspended"]),
  createdAt: z.string().datetime({ offset: true }),
  activeSessions: z.number().int().nonnegative(),
  purchaseCount: z.number().int().nonnegative(),
  activeLicenses: z.number().int().nonnegative(),
  draftCount: z.number().int().nonnegative(),
}).strict();

export const adminUsersResponseSchema = z.object({
  data: z.object({ total: z.number().int().nonnegative(), users: z.array(adminUserSummarySchema) }).strict(),
}).strict();

export const adminUserResponseSchema = z.object({
  data: z.object({
    user: adminUserSummarySchema,
    purchases: z.array(z.object({
      purchaseId: z.string().uuid(),
      draftId: z.string().uuid(),
      templateId: z.string(),
      purchaseStatus: z.enum(["pending", "paid", "refunded", "chargedback", "canceled", "refused"]),
      accessStatus: z.enum(["active", "revoked"]).nullable(),
      createdAt: z.string().datetime({ offset: true }),
      updatedAt: z.string().datetime({ offset: true }),
    }).strict()),
    recentActions: z.array(z.object({
      action: z.enum(["account_suspended", "account_reactivated"]),
      actorEmail: z.string().email(),
      createdAt: z.string().datetime({ offset: true }),
    }).strict()),
  }).strict(),
}).strict();

export const adminAccessResponseSchema = z.object({
  data: z.object({ allowed: z.boolean() }).strict(),
}).strict();

export const adminSetUserStatusResponseSchema = z.object({
  data: z.object({
    status: z.enum(["active", "suspended"]),
    changed: z.boolean(),
    revokedSessions: z.number().int().nonnegative(),
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

export const demoPublicationResponseSchema = z.object({
  data: z.object({
    slug: z.string(),
    publicPath: z.string(),
    publicUrl: z.string().url(),
    category: z.enum(["relacionamento", "cobrancas", "ofertas", "servicos"]),
    created: z.boolean(),
    expiresAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict();

export const publicDemoPublicationResponseSchema = z.object({
  data: z.object({
    slug: z.string(),
    category: z.enum(["relacionamento", "cobrancas", "ofertas", "servicos"]),
    templateId: z.string(),
    templateVersion: z.number().int().positive(),
    templateName: z.string(),
    templateDescription: z.string().nullable(),
    templateDefinition: templateDefinitionSchema,
    data: jsonObjectSchema,
    publicUrl: z.string().url(),
    createdAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
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
export type TemplateCardAction = NonNullable<TemplateCard["action"]>;
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type PurchaseStatus = z.infer<typeof purchaseStatusResponseSchema>["data"];
export type AccountAccessItem = z.infer<typeof accountAccessResponseSchema>["data"][number];
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;
export type AdminUserDetail = z.infer<typeof adminUserResponseSchema>["data"];
export type DemoPublication = z.infer<typeof publicDemoPublicationResponseSchema>["data"];
export type PublicPublication = z.infer<typeof publicPublicationResponseSchema>["data"];
