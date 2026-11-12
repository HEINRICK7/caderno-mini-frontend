import { z } from "zod";
import {
  checkoutResponseSchema,
  authMessageResponseSchema,
  accountAccessResponseSchema,
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
  adminTemplateListResponseSchema,
  adminTemplateResponseSchema,
  adminTemplateArchiveResponseSchema,
  adminTemplateValidationResponseSchema,
  type Draft,
  type AccountAccessItem,
  type DemoPublication,
  type PublicPublication,
  type PurchaseStatus,
  type AdminUserDetail,
  type AdminUserSummary,
  type AdminTemplate,
  type Template,
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

  async verifyMagicLink(token: string): Promise<void> {
    await request("/api/v1/auth/verify", sessionResponseSchema, {
      method: "POST",
      body: JSON.stringify({ token }),
    });
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

  async getAdminUser(userId: string): Promise<AdminUserDetail> {
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}`,
      adminUserResponseSchema,
    )).data;
  },

  async setAdminUserStatus(userId: string, status: "active" | "suspended") {
    return (await request(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
      adminSetUserStatusResponseSchema,
      { method: "POST", body: JSON.stringify({ status }) },
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
