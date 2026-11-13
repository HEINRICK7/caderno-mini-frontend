import type { Template, TemplateField } from "@/lib/api-contracts";

export type TemplateEditorValue = string | number | boolean;

export const SINGLE_PIX_CHARGE_MODE = "Cobrança única";
export const INSTALLMENT_PIX_CHARGE_MODE = "Cobrança parcelada";

const pixChargeModeField: TemplateField = {
  id: "chargeMode",
  type: "select",
  label: "Tipo da cobrança",
  options: [SINGLE_PIX_CHARGE_MODE, INSTALLMENT_PIX_CHARGE_MODE],
  required: true,
  section: "Detalhes da cobrança",
  width: "full",
};

export function resolvePixChargeMode(data: Record<string, unknown>): string {
  const hasInstallmentValues = [data.installmentNumber, data.installmentTotal]
    .some((value) => value !== undefined && value !== null && value !== "");
  return hasInstallmentValues ? INSTALLMENT_PIX_CHARGE_MODE : SINGLE_PIX_CHARGE_MODE;
}

export function templateEditorFields(template: Template, values: Record<string, TemplateEditorValue>): TemplateField[] {
  if (template.id !== "cobranca-pix") return template.definition.fields;

  const installments = template.definition.fields.filter((field) => field.id === "installmentNumber" || field.id === "installmentTotal");
  const fields: TemplateField[] = [];
  for (const field of template.definition.fields) {
    if (field.id === "detailLabel3" && values.chargeMode !== INSTALLMENT_PIX_CHARGE_MODE) continue;
    if (field.id === "installmentNumber") {
      fields.push(pixChargeModeField);
      if (values.chargeMode === INSTALLMENT_PIX_CHARGE_MODE) fields.push(...installments);
      continue;
    }
    if (field.id === "installmentTotal") continue;
    fields.push(field);
  }
  return fields;
}

export function templateEditorPreviewData(template: Template, values: Record<string, TemplateEditorValue>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...(template.definition.exampleData ?? {}), ...values };
  delete data.chargeMode;
  if (template.id === "cobranca-pix" && values.chargeMode !== INSTALLMENT_PIX_CHARGE_MODE) {
    delete data.installmentNumber;
    delete data.installmentTotal;
    delete data.detailLabel3;
  }
  return data;
}

export function templateEditorSubmitData(template: Template, values: Record<string, TemplateEditorValue>): Record<string, unknown> {
  const data: Record<string, unknown> = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
  delete data.chargeMode;
  if (template.id === "cobranca-pix" && values.chargeMode !== INSTALLMENT_PIX_CHARGE_MODE) {
    delete data.installmentNumber;
    delete data.installmentTotal;
    delete data.detailLabel3;
  }
  return data;
}
