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
  socialLinks: z.array(z.object({
    platform: z.enum(["instagram", "whatsapp", "facebook", "tiktok", "youtube"]),
    hrefFieldId: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/),
  }).strict()).min(1).max(5).optional(),
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

export const adminTemplateSchema = templateSchema.extend({
  isActive: z.boolean(),
  publicationStatus: z.enum(["draft", "published", "archived"]),
}).strict();
export const adminTemplateListResponseSchema = z.object({ data: z.array(adminTemplateSchema) }).strict();
export const adminTemplateResponseSchema = z.object({ data: adminTemplateSchema }).strict();
export const adminTemplateArchiveResponseSchema = z.object({ data: z.object({ changed: z.boolean() }).strict() }).strict();
export const adminTemplateValidationResponseSchema = z.object({ data: z.object({ valid: z.literal(true) }).strict() }).strict();

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

export const customerProfileSchema = z.object({
  name: z.string().nullable(),
  whatsapp: z.string().nullable(),
  birthDate: z.string().date().nullable(),
  profileComplete: z.boolean(),
});

export const sessionResponseSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      createdAt: z.string().datetime({ offset: true }),
      ...customerProfileSchema.shape,
    }).strict(),
  }).strict(),
}).strict();

export const adminSessionResponseSchema = z.object({
  data: z.object({ email: z.string().email() }).strict(),
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
    amountMinor: z.number().int().positive().nullable().optional().default(null),
    currency: z.string().length(3).nullable().optional().default(null),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict();

export const accountAccessResponseSchema = z.object({
  data: z.array(z.object({
    purchaseId: z.string(),
    draftId: z.string(),
    purchaseStatus: z.enum(["pending", "paid", "refunded", "chargedback", "canceled", "refused"]),
    accessStatus: z.enum(["active", "revoked", "none"]),
    grantedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
  }).strict()),
}).strict();

export const platformAccessResponseSchema = z.object({
  data: z.object({
    active: z.boolean(),
    accessPlan: z.enum(["annual", "lifetime"]).nullable(),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
  }).strict(),
}).strict();
export const customerPortalResponseSchema = z.object({
  data: z.object({
    user: sessionResponseSchema.shape.data.shape.user,
    platformAccess: platformAccessResponseSchema.shape.data,
    accountAccess: accountAccessResponseSchema.shape.data,
    drafts: z.array(z.object({
      id: z.string().uuid(),
      templateId: z.string(),
      templateName: z.string(),
      businessName: z.string().max(80).optional(),
      shareVariables: z.object({
        nome_cliente: z.string().max(200).optional(),
        nome_empresa: z.string().max(80).optional(),
        valor: z.union([z.string().max(40), z.number().finite()]).optional(),
        vencimento: z.string().max(80).optional(),
        produto: z.string().max(200).optional(),
        servico: z.string().max(200).optional(),
      }).strict().optional(),
      updatedAt: z.string().datetime({ offset: true }),
    }).strict()),
  }).strict(),
}).strict();

export const merchantCustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).strict();

export const merchantCustomerListResponseSchema = z.object({
  data: z.array(merchantCustomerSchema),
}).strict();

export const merchantCustomerResponseSchema = z.object({
  data: merchantCustomerSchema,
}).strict();

export const merchantCatalogItemSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["product", "service"]),
  name: z.string(),
  description: z.string().nullable(),
  priceMinor: z.number().int().nonnegative(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).strict();

export const merchantCatalogItemListResponseSchema = z.object({
  data: z.array(merchantCatalogItemSchema),
}).strict();

export const merchantCatalogItemResponseSchema = z.object({
  data: merchantCatalogItemSchema,
}).strict();

export const merchantSaleConditionSchema = z.enum(["cash", "single_due", "installments"]);
export const merchantPaymentMethodSchema = z.enum(["pix", "cash", "bank_transfer", "other"]);
export const merchantSaleItemSchema = z.object({
  id: z.string(), catalogItemId: z.string().nullable(), kind: z.enum(["product", "service", "other"]),
  name: z.string(), quantity: z.number().int().positive(), unitPriceMinor: z.number().int().nonnegative(), lineTotalMinor: z.number().int().nonnegative(),
}).strict();
export const merchantLedgerPaymentSchema = z.object({
  id: z.string(), saleId: z.string().uuid(), installmentId: z.string().nullable(), amountMinor: z.number().int().positive(),
  method: merchantPaymentMethodSchema, reference: z.string().nullable(), paidAt: z.string().datetime({ offset: true }),
}).strict();
export const merchantInstallmentSchema = z.object({
  id: z.string(), number: z.number().int().positive(), amountMinor: z.number().int().positive(), dueDate: z.string().date(),
  status: z.enum(["open", "canceled"]), paidMinor: z.number().int().nonnegative().optional(),
  balanceMinor: z.number().int().nonnegative().optional(),
  derivedStatus: z.enum(["pending", "due_today", "overdue", "partially_paid", "paid", "canceled"]).optional(),
}).strict();
export const merchantSaleSchema = z.object({
  id: z.string().uuid(), customerId: z.string().uuid(), condition: merchantSaleConditionSchema,
  totalMinor: z.number().int().positive(), downPaymentMinor: z.number().int().nonnegative(), financedMinor: z.number().int().nonnegative(),
  balanceMinor: z.number().int().nonnegative().optional(), items: z.array(merchantSaleItemSchema),
  installments: z.array(merchantInstallmentSchema), payments: z.array(merchantLedgerPaymentSchema),
  createdAt: z.string().datetime({ offset: true }),
}).strict();
export const merchantSaleResponseSchema = z.object({ data: merchantSaleSchema }).strict();
export const merchantCustomerLedgerResponseSchema = z.object({
  data: z.object({ customer: merchantCustomerSchema, sales: z.array(merchantSaleSchema) }).strict(),
}).strict();
export const merchantCommitmentSchema = z.object({
  installment: merchantInstallmentSchema.extend({ saleId: z.string().uuid(), customerId: z.string().uuid(), paidMinor: z.number().int().nonnegative(), balanceMinor: z.number().int().nonnegative(), derivedStatus: z.enum(["pending", "due_today", "overdue", "partially_paid", "paid", "canceled"]) }),
  customer: z.object({ id: z.string().uuid(), name: z.string(), whatsapp: z.string().nullable() }).strict(),
  saleItems: z.array(merchantSaleItemSchema.omit({ catalogItemId: true })),
  payments: z.array(merchantLedgerPaymentSchema),
}).strict();
export const merchantLedgerOverviewResponseSchema = z.object({
  data: z.object({ customerCount: z.number().int().nonnegative(), saleCount: z.number().int().nonnegative(), dueToday: z.array(merchantCommitmentSchema), overdue: z.array(merchantCommitmentSchema), upcoming: z.array(merchantCommitmentSchema), recentPayments: z.array(merchantLedgerPaymentSchema) }).strict(),
}).strict();
export const merchantChargeMessageContextResponseSchema = z.object({ data: z.object({
  sourceType: z.enum(["sale", "sale_installment", "sale_payment", "recurring_charge", "recurring_payment"]), sourceId: z.string(), customerId: z.string().uuid(),
  customerName: z.string(), businessName: z.string(), amountMinor: z.number().int().positive(), dueDate: z.string().date().nullable(),
  installmentNumber: z.number().int().positive().nullable(), installmentTotal: z.number().int().positive().nullable(), itemNames: z.array(z.string()),
  paidAt: z.string().date().nullable(),
}).strict() }).strict();
export const merchantChargeMessageLinkedSchema = z.object({
  id: z.string().uuid(), customerId: z.string().uuid(), sourceType: z.enum(["sale", "sale_installment", "sale_payment", "recurring_charge", "recurring_payment"]),
  sourceId: z.string(), draftId: z.string().uuid(), createdAt: z.string().datetime({ offset: true }),
}).strict();
export const merchantChargeMessageSchema = merchantChargeMessageLinkedSchema.extend({ templateId: z.string(), templateName: z.string() }).strict();
export const merchantChargeMessageListResponseSchema = z.object({ data: z.array(merchantChargeMessageSchema) }).strict();
export const merchantChargeMessageLinkedResponseSchema = z.object({ data: merchantChargeMessageLinkedSchema }).strict();

export const merchantRecurringPaymentSchema = z.object({
  id: z.string().uuid(), chargeId: z.string().uuid(), amountMinor: z.number().int().positive(), method: merchantPaymentMethodSchema,
  reference: z.string().nullable(), paidAt: z.string().datetime({ offset: true }),
}).strict();
export const merchantRecurringChargeSchema = z.object({
  id: z.string().uuid(), customerId: z.string().uuid(), planId: z.string().uuid(), periodKey: z.string(),
  amountMinor: z.number().int().positive(), dueDate: z.string().date(), status: z.enum(["open", "canceled"]),
  description: z.string(), frequency: z.enum(["weekly", "fortnightly", "monthly"]),
  customer: z.object({ id: z.string().uuid(), name: z.string(), whatsapp: z.string().nullable() }).strict(),
  payments: z.array(merchantRecurringPaymentSchema), paidMinor: z.number().int().nonnegative(), balanceMinor: z.number().int().nonnegative(),
  derivedStatus: z.enum(["pending", "due_today", "overdue", "partially_paid", "paid", "canceled"]),
}).strict();
export const merchantRecurringPlanSchema = z.object({
  id: z.string().uuid(), customerId: z.string().uuid(), description: z.string(), catalogItemId: z.string().nullable(),
  amountMinor: z.number().int().nonnegative(), currentAmountMinor: z.number().int().nonnegative(),
  frequency: z.enum(["weekly", "fortnightly", "monthly"]), startDate: z.string().date(), dueDay: z.number().int().nullable(),
  endDate: z.string().date().nullable(), totalCycles: z.number().int().nullable(), status: z.enum(["active", "paused", "ended"]),
  rates: z.array(z.object({ effectiveDate: z.string().date(), amountMinor: z.number().int().nonnegative() }).strict()),
  pauses: z.array(z.object({ startDate: z.string().date(), endDate: z.string().date().nullable() }).strict()),
  charges: z.array(merchantRecurringChargeSchema), createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }),
}).strict();
export const merchantRecurringPlansResponseSchema = z.object({ data: z.array(merchantRecurringPlanSchema) }).strict();
export const merchantRecurringChargesResponseSchema = z.object({ data: z.array(merchantRecurringChargeSchema) }).strict();
export const merchantRecurringPaymentResponseSchema = z.object({ data: merchantRecurringPaymentSchema }).strict();
export const merchantRecurringOverviewResponseSchema = z.object({
  data: z.object({ activePlanCount: z.number().int().nonnegative(), dueToday: z.array(merchantRecurringChargeSchema), overdue: z.array(merchantRecurringChargeSchema), upcoming: z.array(merchantRecurringChargeSchema) }).strict(),
}).strict();
export const authSessionResponseSchema = sessionResponseSchema;

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
    user: adminUserSummarySchema.extend({
      name: z.string().nullable(),
      whatsapp: z.string().nullable(),
      birthDate: z.string().date().nullable(),
    }),
    purchases: z.array(z.object({
      purchaseId: z.string().uuid(),
      draftId: z.string().uuid(),
      templateId: z.string(),
      templateName: z.string(),
      purchaseStatus: z.enum(["pending", "paid", "refunded", "chargedback", "canceled", "refused"]),
      accessStatus: z.enum(["active", "revoked"]).nullable(),
      saleSource: z.enum(["checkout", "manual"]),
      accessPlan: z.enum(["annual", "lifetime"]).nullable(),
      amountMinor: z.number().int().positive().nullable(),
      currency: z.string().length(3).nullable(),
      paymentMethod: z.enum(["pix", "bank_transfer", "cash", "other"]).nullable(),
      paymentReference: z.string().nullable(),
      recordedByAdminEmail: z.string().email().nullable(),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
      createdAt: z.string().datetime({ offset: true }),
      updatedAt: z.string().datetime({ offset: true }),
    }).strict()),
    platformSales: z.array(z.object({
      saleId: z.string().uuid(),
      accessStatus: z.enum(["active", "expired", "revoked"]),
      accessPlan: z.enum(["annual", "lifetime"]),
      amountMinor: z.number().int().positive(),
      currency: z.string().length(3),
      paymentMethod: z.enum(["pix", "bank_transfer", "cash", "other"]),
      paymentReference: z.string().nullable(),
      recordedByAdminEmail: z.string().email(),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
      createdAt: z.string().datetime({ offset: true }),
    }).strict()),
    drafts: z.array(z.object({
      id: z.string().uuid(),
      templateId: z.string(),
      templateName: z.string(),
      updatedAt: z.string().datetime({ offset: true }),
    }).strict()),
    recentActions: z.array(z.object({
      action: z.enum(["account_suspended", "account_reactivated", "manual_payment_recorded", "manual_platform_sale_recorded", "customer_created"]),
      actorEmail: z.string().email(),
      purchaseId: z.string().uuid().nullable(),
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

export const adminManualPaymentResponseSchema = z.object({
  data: z.object({
    purchaseId: z.string().uuid(),
    status: z.literal("paid"),
    accessStatus: z.literal("active"),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
  }).strict(),
}).strict();

export const adminManualPlatformSaleResponseSchema = z.object({
  data: z.object({
    saleId: z.string().uuid(),
    accessStatus: z.literal("active"),
    accessPlan: z.enum(["annual", "lifetime"]),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
  }).strict(),
}).strict();

export const adminCreateCustomerResponseSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      createdAt: z.string().datetime({ offset: true }),
    }).strict(),
    accessLinkSent: z.boolean(),
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
export type AdminTemplate = z.infer<typeof adminTemplateSchema>;
export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateVisual = z.infer<typeof templateVisualSchema>;
export type TemplateCard = z.infer<typeof templateCardSchema>;
export type TemplateCardAction = NonNullable<TemplateCard["action"]>;
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type PurchaseStatus = z.infer<typeof purchaseStatusResponseSchema>["data"];
export type AccountAccessItem = z.infer<typeof accountAccessResponseSchema>["data"][number];
export type PlatformAccessSummary = z.infer<typeof platformAccessResponseSchema>["data"];
export type AuthenticatedCustomer = z.infer<typeof sessionResponseSchema>["data"]["user"];
export type CustomerPortalSummary = z.infer<typeof customerPortalResponseSchema>["data"];
export type MerchantCustomer = z.infer<typeof merchantCustomerSchema>;
export type MerchantCatalogItem = z.infer<typeof merchantCatalogItemSchema>;
export type MerchantSale = z.infer<typeof merchantSaleSchema>;
export type MerchantCustomerLedger = z.infer<typeof merchantCustomerLedgerResponseSchema>["data"];
export type MerchantLedgerOverview = z.infer<typeof merchantLedgerOverviewResponseSchema>["data"];
export type MerchantChargeMessageContext = z.infer<typeof merchantChargeMessageContextResponseSchema>["data"];
export type MerchantChargeMessage = z.infer<typeof merchantChargeMessageSchema>;
export type MerchantRecurringPlan = z.infer<typeof merchantRecurringPlanSchema>;
export type MerchantRecurringCharge = z.infer<typeof merchantRecurringChargeSchema>;
export type MerchantRecurringOverview = z.infer<typeof merchantRecurringOverviewResponseSchema>["data"];
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;
export type AdminUserDetail = z.infer<typeof adminUserResponseSchema>["data"];
export type DemoPublication = z.infer<typeof publicDemoPublicationResponseSchema>["data"];
export type PublicPublication = z.infer<typeof publicPublicationResponseSchema>["data"];
