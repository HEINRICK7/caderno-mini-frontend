import { z } from "zod";
import {
  checkoutResponseSchema,
  authMessageResponseSchema,
  accountAccessResponseSchema,
  platformAccessResponseSchema,
  authSessionResponseSchema,
  customerPortalResponseSchema,
  createDraftResponseSchema,
  draftResponseSchema,
  publicPublicationResponseSchema,
  purchaseStatusResponseSchema,
  sessionResponseSchema,
  templateListResponseSchema,
  templateResponseSchema,
  templateValidationResponseSchema,
  imageUploadResponseSchema,
  publicationResponseSchema,
  demoPublicationResponseSchema,
  publicDemoPublicationResponseSchema,
  adminSessionResponseSchema,
  adminAccessResponseSchema,
  adminUsersResponseSchema,
  adminUserResponseSchema,
  adminSetUserStatusResponseSchema,
  adminManualPaymentResponseSchema,
  adminManualPlatformSaleResponseSchema,
  adminCreateCustomerResponseSchema,
  adminTemplateListResponseSchema,
  adminTemplateResponseSchema,
  adminTemplateArchiveResponseSchema,
  adminTemplateValidationResponseSchema,
  merchantCustomerListResponseSchema,
  merchantCustomerResponseSchema,
  merchantCatalogItemListResponseSchema,
  merchantCatalogItemResponseSchema,
  merchantSaleResponseSchema,
  merchantCustomerLedgerResponseSchema,
  merchantLedgerOverviewResponseSchema,
  merchantChargeMessageContextResponseSchema,
  merchantChargeMessageListResponseSchema,
  merchantChargeMessageLinkedResponseSchema,
  merchantRecurringPlansResponseSchema,
  merchantRecurringChargesResponseSchema,
  merchantRecurringPaymentResponseSchema,
  merchantRecurringOverviewResponseSchema,
  merchantRecurringPlanSchema,
  type Draft,
  type AccountAccessItem,
  type DemoPublication,
  type PublicPublication,
  type PurchaseStatus,
  type AdminUserDetail,
  type AdminUserSummary,
  type AdminTemplate,
  type Template,
  type MerchantCustomer,
  type MerchantCatalogItem,
  type MerchantSale,
  type MerchantCustomerLedger,
  type MerchantLedgerOverview,
  type MerchantChargeMessageContext,
  type MerchantChargeMessage,
  type MerchantRecurringPlan,
  type MerchantRecurringCharge,
  type MerchantRecurringOverview,
} from "./api-contracts";

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao serviço. Tente novamente.", 0, "NETWORK_ERROR");
  }

  const body: unknown = response.status === 204
    ? undefined
    : await response.json().catch(() => undefined);

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    throw new ApiError(
      parsedError.success ? parsedError.data.error.message : "Não foi possível concluir sua solicitação.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "REQUEST_FAILED",
      parsedError.success ? parsedError.data.error.details : undefined,
    );
  }

  return schema.parse(body);
}

export const api = {
  async uploadImage(dataUrl: string): Promise<{ id: string; contentUrl: string }> {
    return (await request("/api/v1/assets", imageUploadResponseSchema, {
      method: "POST",
      body: JSON.stringify({ dataUrl }),
    })).data;
  },

  async getTemplates(): Promise<Template[]> {
    return (await request("/api/v1/templates", templateListResponseSchema)).data;
  },

  async getTemplate(templateId: string): Promise<Template> {
    return (await request(
      `/api/v1/templates/${encodeURIComponent(templateId)}`,
      templateResponseSchema,
    )).data;
  },

  async validateTemplate(templateId: string, data: Record<string, unknown>): Promise<void> {
    await request(
      `/api/v1/templates/${encodeURIComponent(templateId)}/validate`,
      templateValidationResponseSchema,
      { method: "POST", body: JSON.stringify({ data }) },
    );
  },

  async createDraft(templateId: string, data: Record<string, unknown>): Promise<Draft> {
    return (await request("/api/v1/drafts", createDraftResponseSchema, {
      method: "POST",
      body: JSON.stringify({ templateId, data }),
    })).data;
  },

  async requestMagicLink(email: string): Promise<string> {
    return (await request("/api/v1/auth/magic-link", authMessageResponseSchema, {
      method: "POST",
      body: JSON.stringify({ email }),
    })).data.message;
  },

  async verifyMagicLink(token: string) {
    return (await request("/api/v1/auth/verify", sessionResponseSchema, {
      method: "POST",
      body: JSON.stringify({ token }),
    })).data.user;
  },

  async getDraft(draftId: string): Promise<Draft> {
    return (await request(
      `/api/v1/drafts/${encodeURIComponent(draftId)}`,
      draftResponseSchema,
    )).data;
  },

  async saveDraft(draftId: string, data: Record<string, unknown>): Promise<Draft> {
    return (await request(
      `/api/v1/drafts/${encodeURIComponent(draftId)}`,
      draftResponseSchema,
      { method: "PUT", body: JSON.stringify({ data }) },
    )).data;
  },

  async publishDraft(draftId: string): Promise<z.infer<typeof publicationResponseSchema>["data"]> {
    return (await request(
      `/api/v1/drafts/${encodeURIComponent(draftId)}/publication`,
      publicationResponseSchema,
      { method: "POST" },
    )).data;
  },

  async createDemoPublication(draftId: string) {
    return (await request("/api/v1/demo-publications", demoPublicationResponseSchema, {
      method: "POST",
      body: JSON.stringify({ draftId }),
    })).data;
  },

  async getDemoPublication(slug: string): Promise<DemoPublication> {
    return (await request(
      `/api/v1/demo-publications/${encodeURIComponent(slug)}`,
      publicDemoPublicationResponseSchema,
    )).data;
  },

  async getPurchase(purchaseId: string): Promise<PurchaseStatus> {
    return (await request(
      `/api/v1/purchases/${encodeURIComponent(purchaseId)}`,
      purchaseStatusResponseSchema,
    )).data;
  },

  async getAccountAccess(): Promise<AccountAccessItem[]> {
    return (await request("/api/v1/account/access", accountAccessResponseSchema)).data;
  },

  async getPlatformAccess() {
    return (await request("/api/v1/account/platform-access", platformAccessResponseSchema)).data;
  },

  async getCustomerPortal(init: RequestInit = {}) {
    return (await request("/api/v1/customer-portal", customerPortalResponseSchema, init)).data;
  },

  async getMerchantCustomers(input: { query?: string; status?: "active" | "archived" | "all" } = {}): Promise<MerchantCustomer[]> {
    const params = new URLSearchParams();
    if (input.query?.trim()) params.set("q", input.query.trim());
    if (input.status) params.set("status", input.status);
    const suffix = params.size ? `?${params.toString()}` : "";
    return (await request(`/api/v1/merchant/customers${suffix}`, merchantCustomerListResponseSchema)).data;
  },

  async createMerchantCustomer(input: {
    name: string; whatsapp?: string; email?: string; address?: string; notes?: string; status?: "active" | "archived";
  }): Promise<MerchantCustomer> {
    return (await request("/api/v1/merchant/customers", merchantCustomerResponseSchema, {
      method: "POST",
      body: JSON.stringify(input),
    })).data;
  },

  async updateMerchantCustomer(id: string, input: {
    name: string; whatsapp?: string; email?: string; address?: string; notes?: string; status: "active" | "archived";
  }): Promise<MerchantCustomer> {
    return (await request(`/api/v1/merchant/customers/${encodeURIComponent(id)}`, merchantCustomerResponseSchema, {
      method: "PUT",
      body: JSON.stringify(input),
    })).data;
  },

  async getMerchantCatalogItems(input: {
    query?: string; kind?: "product" | "service"; status?: "active" | "archived" | "all";
  } = {}): Promise<MerchantCatalogItem[]> {
    const params = new URLSearchParams();
    if (input.query?.trim()) params.set("q", input.query.trim());
    if (input.kind) params.set("kind", input.kind);
    if (input.status) params.set("status", input.status);
    const suffix = params.size ? `?${params.toString()}` : "";
    return (await request(`/api/v1/merchant/catalog-items${suffix}`, merchantCatalogItemListResponseSchema)).data;
  },

  async createMerchantCatalogItem(input: {
    kind: "product" | "service"; name: string; description?: string; priceMinor: number; status?: "active" | "archived";
  }): Promise<MerchantCatalogItem> {
    return (await request("/api/v1/merchant/catalog-items", merchantCatalogItemResponseSchema, {
      method: "POST",
      body: JSON.stringify(input),
    })).data;
  },

  async updateMerchantCatalogItem(id: string, input: {
    kind: "product" | "service"; name: string; description?: string; priceMinor: number; status: "active" | "archived";
  }): Promise<MerchantCatalogItem> {
    return (await request(`/api/v1/merchant/catalog-items/${encodeURIComponent(id)}`, merchantCatalogItemResponseSchema, {
      method: "PUT",
      body: JSON.stringify(input),
    })).data;
  },

  async getMerchantCustomerLedger(customerId: string): Promise<MerchantCustomerLedger> {
    return (await request(`/api/v1/merchant/customers/${encodeURIComponent(customerId)}/ledger`, merchantCustomerLedgerResponseSchema)).data;
  },

  async createMerchantSale(input: {
    customerId: string;
    items: Array<{ catalogItemId?: string; name?: string; kind?: "product" | "service" | "other"; quantity: number; unitPriceMinor?: number }>;
    condition: "cash" | "single_due" | "installments";
    downPaymentMinor?: number;
    initialPaymentMethod?: "pix" | "cash" | "bank_transfer" | "other";
    installmentCount?: number;
    firstDueDate?: string;
  }): Promise<MerchantSale> {
    return (await request("/api/v1/merchant/sales", merchantSaleResponseSchema, { method: "POST", body: JSON.stringify(input) })).data;
  },

  async recordMerchantInstallmentPayment(id: string, input: { amountMinor: number; method: "pix" | "cash" | "bank_transfer" | "other"; reference?: string }) {
    const schema = z.object({ data: z.object({
      id: z.string(), saleId: z.string().uuid(), installmentId: z.string().nullable(), amountMinor: z.number().int().positive(),
      method: z.enum(["pix", "cash", "bank_transfer", "other"]), reference: z.string().nullable(), paidAt: z.string().datetime({ offset: true }),
    }).strict() }).strict();
    return (await request(`/api/v1/merchant/installments/${encodeURIComponent(id)}/payments`, schema, { method: "POST", body: JSON.stringify(input) })).data;
  },

  async getMerchantLedgerOverview(): Promise<MerchantLedgerOverview> {
    return (await request("/api/v1/merchant/overview", merchantLedgerOverviewResponseSchema)).data;
  },

  async getMerchantInstallmentMessageContext(id: string): Promise<MerchantChargeMessageContext> {
    return (await request(`/api/v1/merchant/installments/${encodeURIComponent(id)}/message-context`, merchantChargeMessageContextResponseSchema)).data;
  },

  async getMerchantSaleMessageContext(id: string): Promise<MerchantChargeMessageContext> {
    return (await request(`/api/v1/merchant/sales/${encodeURIComponent(id)}/message-context`, merchantChargeMessageContextResponseSchema)).data;
  },

  async getMerchantSalePaymentMessageContext(id: string): Promise<MerchantChargeMessageContext> {
    return (await request(`/api/v1/merchant/sales/payments/${encodeURIComponent(id)}/message-context`, merchantChargeMessageContextResponseSchema)).data;
  },

  async linkMerchantChargeMessage(input: { draftId: string; sourceType: "sale" | "sale_installment" | "sale_payment" | "recurring_charge" | "recurring_payment"; sourceId: string }): Promise<void> {
    await request("/api/v1/merchant/charge-messages", merchantChargeMessageLinkedResponseSchema, { method: "POST", body: JSON.stringify(input) });
  },

  async getMerchantChargeMessages(customerId: string): Promise<MerchantChargeMessage[]> {
    return (await request(`/api/v1/merchant/customers/${encodeURIComponent(customerId)}/charge-messages`, merchantChargeMessageListResponseSchema)).data;
  },

  async getMerchantRecurringPlans(status: "active" | "paused" | "ended" | "all" = "all"): Promise<MerchantRecurringPlan[]> {
    return (await request(`/api/v1/merchant/recurrences?status=${status}`, merchantRecurringPlansResponseSchema)).data;
  },

  async createMerchantRecurringPlan(input: {
    customerId: string; description?: string; catalogItemId?: string; amountMinor?: number;
    frequency: "weekly" | "fortnightly" | "monthly"; startDate: string; dueDay?: number; endDate?: string; totalCycles?: number;
  }): Promise<MerchantRecurringPlan> {
    const schema = z.object({ data: merchantRecurringPlanSchema }).strict();
    return (await request("/api/v1/merchant/recurrences", schema, { method: "POST", body: JSON.stringify(input) })).data;
  },

  async changeMerchantRecurringRate(id: string, input: { effectiveDate: string; amountMinor: number }): Promise<Array<{ effectiveDate: string; amountMinor: number }>> {
    const schema = z.object({ data: z.object({ rates: z.array(z.object({ effectiveDate: z.string().date(), amountMinor: z.number().int().nonnegative() }).strict()) }).strict() }).strict();
    return (await request(`/api/v1/merchant/recurrences/${encodeURIComponent(id)}/rate`, schema, { method: "PUT", body: JSON.stringify(input) })).data.rates;
  },

  async pauseMerchantRecurringPlan(id: string): Promise<void> {
    await request(`/api/v1/merchant/recurrences/${encodeURIComponent(id)}/pause`, z.object({ data: z.object({ status: z.literal("paused") }) }), { method: "POST", body: "{}" });
  },

  async resumeMerchantRecurringPlan(id: string): Promise<void> {
    await request(`/api/v1/merchant/recurrences/${encodeURIComponent(id)}/resume`, z.object({ data: z.object({ status: z.literal("active") }) }), { method: "POST", body: "{}" });
  },

  async endMerchantRecurringPlan(id: string): Promise<void> {
    await request(`/api/v1/merchant/recurrences/${encodeURIComponent(id)}/end`, z.object({ data: z.object({ status: z.literal("ended") }) }), { method: "POST", body: "{}" });
  },

  async getMerchantRecurringCharges(input: { planId?: string; customerId?: string } = {}): Promise<MerchantRecurringCharge[]> {
    const params = new URLSearchParams();
    if (input.planId) params.set("planId", input.planId);
    if (input.customerId) params.set("customerId", input.customerId);
    const suffix = params.size ? `?${params.toString()}` : "";
    return (await request(`/api/v1/merchant/recurring-charges${suffix}`, merchantRecurringChargesResponseSchema)).data;
  },

  async getMerchantRecurringChargeMessageContext(id: string): Promise<MerchantChargeMessageContext> {
    return (await request(`/api/v1/merchant/recurring-charges/${encodeURIComponent(id)}/message-context`, merchantChargeMessageContextResponseSchema)).data;
  },

  async getMerchantRecurringPaymentMessageContext(id: string): Promise<MerchantChargeMessageContext> {
    return (await request(`/api/v1/merchant/recurring-charges/payments/${encodeURIComponent(id)}/message-context`, merchantChargeMessageContextResponseSchema)).data;
  },

  async recordMerchantRecurringPayment(id: string, input: { amountMinor: number; method: "pix" | "cash" | "bank_transfer" | "other"; reference?: string }) {
    return (await request(`/api/v1/merchant/recurring-charges/${encodeURIComponent(id)}/payments`, merchantRecurringPaymentResponseSchema, { method: "POST", body: JSON.stringify(input) })).data;
  },

  async getMerchantRecurringOverview(): Promise<MerchantRecurringOverview> {
    return (await request("/api/v1/merchant/recurring-overview", merchantRecurringOverviewResponseSchema)).data;
  },

  async updateCustomerProfile(input: { name: string; whatsapp: string; birthDate: string }) {
    return (await request("/api/v1/account/profile", sessionResponseSchema, {
      method: "PUT",
      body: JSON.stringify(input),
    })).data.user;
  },

  async signOutCustomer(): Promise<void> {
    await request("/api/v1/auth/session", z.undefined(), { method: "DELETE" });
  },

  async getCurrentUser() {
    return (await request("/api/v1/auth/session", authSessionResponseSchema)).data.user;
  },

  async getAdminAccess(): Promise<boolean> {
    return (await request("/api/v1/admin/access", adminAccessResponseSchema)).data.allowed;
  },

  async signInAdmin(email: string, password: string): Promise<string> {
    return (await request("/api/v1/admin/session", adminSessionResponseSchema, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })).data.email;
  },

  async getAdminSession(): Promise<string> {
    return (await request("/api/v1/admin/session", adminSessionResponseSchema)).data.email;
  },

  async signOutAdmin(): Promise<void> {
    await request("/api/v1/admin/session", z.undefined(), { method: "DELETE" });
  },

  async getAdminUsers(query = "", offset = 0): Promise<{ total: number; users: AdminUserSummary[] }> {
    const params = new URLSearchParams({ limit: "50" });
    if (query.trim()) params.set("q", query.trim());
    if (offset > 0) params.set("offset", String(offset));
    return (await request(`/api/v1/admin/users?${params}`, adminUsersResponseSchema)).data;
  },

  async createAdminCustomer(email: string) {
    return (await request("/api/v1/admin/customers", adminCreateCustomerResponseSchema, {
      method: "POST",
      body: JSON.stringify({ email }),
    })).data;
  },

  async getAdminUser(userId: string): Promise<AdminUserDetail> {
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}`,
      adminUserResponseSchema,
    )).data;
  },

  async sendAdminCustomerAccessLink(userId: string): Promise<string> {
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/access-link`,
      authMessageResponseSchema,
      { method: "POST" },
    )).data.message;
  },

  async setAdminUserStatus(userId: string, status: "active" | "suspended") {
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
      adminSetUserStatusResponseSchema,
      { method: "POST", body: JSON.stringify({ status }) },
    )).data;
  },

  async registerAdminManualSale(input: {
    userId: string;
    draftId: string;
    plan: "annual" | "lifetime";
    amountMinor: number;
    paymentMethod: "pix" | "bank_transfer" | "cash" | "other";
    paymentReference?: string;
  }) {
    const { userId, ...body } = input;
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/manual-sales`,
      adminManualPaymentResponseSchema,
      { method: "POST", body: JSON.stringify(body) },
    )).data;
  },

  async registerAdminPlatformSale(input: {
    userId: string;
    plan: "annual" | "lifetime";
    amountMinor: number;
    paymentMethod: "pix" | "bank_transfer" | "cash" | "other";
    paymentReference?: string;
  }) {
    const { userId, ...body } = input;
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/platform-sales`,
      adminManualPlatformSaleResponseSchema,
      { method: "POST", body: JSON.stringify({ ...body, confirmPaymentReceived: true }) },
    )).data;
  },

  async getAdminTemplates(): Promise<AdminTemplate[]> {
    return (await request("/api/v1/admin/templates", adminTemplateListResponseSchema)).data;
  },

  async createAdminTemplateDraft(input: { id: string; name: string; description: string | null; definition: Record<string, unknown> }): Promise<AdminTemplate> {
    return (await request("/api/v1/admin/templates", adminTemplateResponseSchema, {
      method: "POST",
      body: JSON.stringify(input),
    })).data;
  },

  async updateAdminTemplateDraft(input: { id: string; version: number; name: string; description: string | null; definition: Record<string, unknown> }): Promise<AdminTemplate> {
    const path = `/api/v1/admin/templates/${encodeURIComponent(input.id)}/versions/${input.version}`;
    const body = { name: input.name, description: input.description, definition: input.definition };
    return (await request(path, adminTemplateResponseSchema, {
      method: "PUT",
      body: JSON.stringify(body),
    })).data;
  },

  async validateAdminTemplateDefinition(definition: Record<string, unknown>): Promise<void> {
    await request("/api/v1/admin/templates/validate", adminTemplateValidationResponseSchema, {
      method: "POST",
      body: JSON.stringify({ definition }),
    });
  },

  async publishAdminTemplateDraft(templateId: string, version: number): Promise<AdminTemplate> {
    return (await request(
      `/api/v1/admin/templates/${encodeURIComponent(templateId)}/versions/${version}/publish`,
      adminTemplateResponseSchema,
      { method: "POST" },
    )).data;
  },

  async archiveAdminTemplate(templateId: string): Promise<void> {
    await request(
      `/api/v1/admin/templates/${encodeURIComponent(templateId)}/archive`,
      adminTemplateArchiveResponseSchema,
      { method: "POST" },
    );
  },

  async getPublicPublication(slug: string): Promise<PublicPublication> {
    return (await request(
      `/api/v1/publications/${encodeURIComponent(slug)}`,
      publicPublicationResponseSchema,
    )).data;
  },

  async createCheckout(draftId: string, plan: "annual" | "lifetime"): Promise<{ purchaseId: string; checkoutUrl: string }> {
    const result = await request("/api/v1/checkout", checkoutResponseSchema, {
      method: "POST",
      body: JSON.stringify({ draftId, plan }),
    });
    return result.data;
  },
};
