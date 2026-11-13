import type { TemplateDefinition } from "@/lib/api-contracts";

export type WhatsAppShareVariables = {
  nome_cliente?: string;
  nome_empresa?: string;
  valor?: string | number;
  vencimento?: string;
  produto?: string;
  servico?: string;
};

type BillingMessage = {
  id: string;
  label: string;
  render: (variables: FormattedShareVariables) => string;
};

type FormattedShareVariables = {
  nome_cliente: string;
  nome_empresa: string;
  valor: string;
  vencimento: string;
};

export const DEFAULT_BILLING_MESSAGE_ID = "monthly-default";

export const billingWhatsAppMessages: BillingMessage[] = [
  {
    id: DEFAULT_BILLING_MESSAGE_ID,
    label: "Mensalidade · padrão",
    render: (variables) => [
      `${greeting(variables)} ${chargeSentence(variables)}`,
      "No link você encontra o QR Code Pix e o código Pix Copia e Cola. Confira o recebedor e o valor no app do banco antes de pagar.",
    ].join("\n"),
  },
  {
    id: "monthly-formal",
    label: "Cobrança · formal",
    render: (variables) => [
      `${greeting(variables)} ${chargeSentence(variables)}`,
      "Acesse os detalhes da cobrança para consultar o QR Code Pix ou copiar o código Pix Copia e Cola. Confira os dados no banco antes de confirmar.",
    ].join("\n"),
  },
  {
    id: "monthly-friendly",
    label: "Lembrete · cordial",
    render: (variables) => [
      `${greeting(variables)} Passando para lembrar que ${chargeClause(variables)}.`,
      "O QR Code Pix e o código Pix Copia e Cola estão nos detalhes da cobrança. Confira o recebedor e o valor antes de pagar.",
    ].join("\n"),
  },
  {
    id: "monthly-direct",
    label: "Cobrança · objetiva",
    render: (variables) => [
      `Mensalidade${variables.nome_empresa ? ` de ${variables.nome_empresa}` : ""}${chargeAmountAndDate(variables)}.`,
      "QR Code Pix e código Pix Copia e Cola disponíveis no link. Confirme o recebedor no app do banco antes de pagar.",
    ].join("\n"),
  },
  {
    id: "monthly-details",
    label: "Cobrança · detalhada",
    render: (variables) => [
      `${greeting(variables)} ${chargeSentence(variables)}`,
      "No link, escolha o QR Code Pix ou copie o código Pix Copia e Cola. Confira os dados no banco antes de concluir o pagamento.",
    ].join("\n"),
  },
  {
    id: "monthly-reminder",
    label: "Aviso · mensalidade",
    render: (variables) => [
      `${greeting(variables)} Lembrete: ${chargeClause(variables)}.`,
      "O link abre os detalhes para pagamento via Pix, com QR Code e código Copia e Cola. Confira o recebedor antes de confirmar.",
    ].join("\n"),
  },
  {
    id: "monthly-payment-options",
    label: "Opções para pagar via Pix",
    render: (variables) => [
      `${greeting(variables)} ${chargeSentence(variables)}`,
      "Abra os detalhes da cobrança para pagar com o QR Code Pix ou com o código Copia e Cola. Confira o recebedor e o valor no banco.",
    ].join("\n"),
  },
  {
    id: "monthly-business",
    label: "Mensagem · em nome do negócio",
    render: (variables) => [
      `${greeting(variables)} ${variables.nome_empresa ? `${variables.nome_empresa} compartilha os detalhes da` : "Veja os detalhes da"} mensalidade${variables.valor ? ` no valor de ${variables.valor}` : ""}${variables.vencimento ? `, com vencimento em ${variables.vencimento}` : ""}.`,
      "Consulte o QR Code Pix e o código Copia e Cola nos detalhes da cobrança. Confira os dados no app do banco antes de pagar.",
    ].join("\n"),
  },
  {
    id: "monthly-short",
    label: "Lembrete · curto",
    render: (variables) => [
      `${greeting(variables)} ${chargeSentence(variables)}`,
      "QR Code Pix e Copia e Cola no link. Confira o recebedor antes de pagar.",
    ].join("\n"),
  },
  {
    id: "monthly-warm",
    label: "Lembrete · acolhedor",
    render: (variables) => [
      `${greeting(variables)} Deixo aqui os detalhes: ${chargeClause(variables)}.`,
      "Você pode abrir o QR Code Pix ou copiar o código Pix Copia e Cola no link. Confira o recebedor e o valor no seu banco.",
    ].join("\n"),
  },
];

export function resolveWhatsAppShareVariables(definition: TemplateDefinition, data: Record<string, unknown>): WhatsAppShareVariables {
  const bindings = definition.card?.variables ?? {};
  const values: WhatsAppShareVariables = {};

  for (const name of ["nome_cliente", "nome_empresa", "valor", "vencimento", "produto", "servico"] as const) {
    const fieldId = name === "nome_empresa"
      ? definition.card?.brand?.businessNameFieldId ?? bindings[name]
      : bindings[name];
    if (!fieldId) continue;
    const value = data[fieldId];
    if (name === "valor") {
      if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) values.valor = value;
    } else if (typeof value === "string") {
      values[name] = value;
    }
  }

  return values;
}

export function renderBillingWhatsAppMessage(messageId: string, variables: WhatsAppShareVariables = {}): string {
  const message = billingWhatsAppMessages.find((option) => option.id === messageId) ?? billingWhatsAppMessages[0];
  return message.render(formatShareVariables(variables));
}

export function billingWhatsAppShareUrl(publicUrl: string, message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${publicUrl}`)}`;
}

export function whatsappShareUrl(publicUrl: string, businessName = ""): string {
  const normalizedBusinessName = businessName.trim().replace(/\s+/g, " ").slice(0, 80);
  const introduction = normalizedBusinessName
    ? `Olá! ${normalizedBusinessName} preparou este cartão digital no Cadernô Express.`
    : "Olá! Você recebeu um cartão digital do Cadernô Express.";
  const message = [
    introduction,
    `Confira: ${publicUrl}`,
    "Se houver cobrança, confira o recebedor e o valor.",
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function formatShareVariables(variables: WhatsAppShareVariables): FormattedShareVariables {
  return {
    nome_cliente: cleanName(variables.nome_cliente),
    nome_empresa: cleanName(variables.nome_empresa),
    valor: formatAmount(variables.valor),
    vencimento: formatDueDate(variables.vencimento),
  };
}

function chargeSentence(variables: FormattedShareVariables): string {
  const clause = chargeClause(variables);
  return `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.`;
}

function chargeClause(variables: FormattedShareVariables): string {
  const subject = `a mensalidade${variables.nome_empresa ? ` de ${variables.nome_empresa}` : ""}`;
  if (variables.valor && variables.vencimento) return `${subject} é ${variables.valor} e vence em ${variables.vencimento}`;
  if (variables.valor) return `${subject} é ${variables.valor}`;
  if (variables.vencimento) return `${subject} vence em ${variables.vencimento}`;
  return `${subject} está disponível para pagamento`;
}

function chargeAmountAndDate(variables: FormattedShareVariables): string {
  const details = [variables.valor, variables.vencimento ? `vence em ${variables.vencimento}` : ""].filter(Boolean);
  return details.length ? `: ${details.join(" · ")}` : "";
}

function greeting(variables: FormattedShareVariables): string {
  return variables.nome_cliente ? `Olá, ${variables.nome_cliente}!` : "Olá!";
}

function cleanName(value: string | number | undefined): string {
  return typeof value === "string" ? value.trim().replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").slice(0, 80) : "";
}

function formatAmount(value: string | number | undefined): string {
  if (typeof value === "number") return formatCurrency(value);
  if (typeof value !== "string" || value.trim() === "") return "";
  const raw = value.trim();
  const numeric = raw.includes(",") ? raw.replaceAll(".", "").replace(",", ".") : raw;
  const amount = Number(numeric.replace(/^R\$\s*/i, ""));
  return Number.isFinite(amount) ? formatCurrency(amount) : raw.slice(0, 40);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDueDate(value: string | number | undefined): string {
  if (typeof value !== "string" || value.trim() === "") return "";
  const raw = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 80);
  const date = new Date(`${raw}T12:00:00.000Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date)
    : raw;
}
