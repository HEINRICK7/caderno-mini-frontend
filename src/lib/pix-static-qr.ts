export type PixStaticKeyType = "cpf" | "cnpj" | "email" | "phone" | "other";

export type PixStaticQrInput = {
  keyType: PixStaticKeyType;
  key: string;
  identifier: string;
  amount: string;
  recipientName: string;
  recipientCity: string;
};

export type PixStaticQrResult =
  | { payload: string; error?: never }
  | { payload?: never; error: string };

export function formatPixCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPixCnpj(value: string): string {
  const characters = value.replace(/[^a-z\d]/gi, "").toUpperCase().slice(0, 14);
  if (characters.length <= 2) return characters;
  if (characters.length <= 5) return `${characters.slice(0, 2)}.${characters.slice(2)}`;
  if (characters.length <= 8) return `${characters.slice(0, 2)}.${characters.slice(2, 5)}.${characters.slice(5)}`;
  if (characters.length <= 12) return `${characters.slice(0, 2)}.${characters.slice(2, 5)}.${characters.slice(5, 8)}/${characters.slice(8)}`;
  return `${characters.slice(0, 2)}.${characters.slice(2, 5)}.${characters.slice(5, 8)}/${characters.slice(8, 12)}-${characters.slice(12)}`;
}

export function formatPixAmount(value: string): string {
  const cleaned = value.replace(/[^\d,.]/g, "");
  if (!cleaned) return "";

  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  const decimalIndex = commaIndex >= 0
    ? commaIndex
    : dotIndex >= 0 && cleaned.length - dotIndex - 1 <= 2
      ? dotIndex
      : -1;
  const integerSource = decimalIndex >= 0 ? cleaned.slice(0, decimalIndex) : cleaned;
  const fractionSource = decimalIndex >= 0 ? cleaned.slice(decimalIndex + 1) : "";
  const integerDigits = integerSource.replace(/\D/g, "").slice(0, 10);
  const fractionDigits = fractionSource.replace(/\D/g, "").slice(0, 2);
  const normalizedInteger = integerDigits.replace(/^0+(?=\d)/, "") || (decimalIndex >= 0 ? "0" : "");
  const groupedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return decimalIndex >= 0 ? `${groupedInteger},${fractionDigits}` : groupedInteger;
}

function normalizePixKey(type: PixStaticKeyType, rawKey: string): string | null {
  const key = rawKey.trim();
  if (!key) return null;

  if (type === "cpf") {
    if (!/^[\d.\-/\s]+$/.test(key)) return null;
    const digits = key.replace(/\D/g, "");
    return isValidCpf(digits) ? digits : null;
  }

  if (type === "cnpj") {
    if (!/^[a-z\d.\-/\s]+$/i.test(key)) return null;
    const value = key.replace(/[.\-/\s]/g, "").toUpperCase();
    return isValidCnpj(value) ? value : null;
  }

  if (type === "email") {
    return key.length <= 77 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) && /^[\x21-\x7e]+$/.test(key)
      ? key
      : null;
  }

  if (type === "phone") {
    if (!/^[+\d\s().-]+$/.test(key)) return null;
    const digits = key.replace(/\D/g, "");
    const internationalDigits = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;
    if (!/^([1-9]\d)(\d{8}|\d{9})$/.test(internationalDigits)) return null;
    return `+55${internationalDigits}`;
  }

  if (type === "other") {
    return /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(key) ? key.toLowerCase() : null;
  }

  return null;
}

function isValidCpf(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;

  const calculateDigit = (length: number): number => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(value[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(value[9]) && calculateDigit(10) === Number(value[10]);
}

function isValidCnpj(value: string): boolean {
  if (!/^[A-Z\d]{12}\d{2}$/.test(value) || /^(.)\1{13}$/.test(value)) return false;

  const calculateDigit = (length: number): number => {
    let sum = 0;
    let weight = 2;
    for (let index = length - 1; index >= 0; index -= 1) {
      // The alphanumeric CNPJ rule maps ASCII characters to their decimal value minus 48.
      sum += (value.charCodeAt(index) - 48) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === Number(value[12]) && calculateDigit(13) === Number(value[13]);
}

function normalizeMerchantText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\d ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAmount(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  let integer = "";
  let fraction = "";

  if (trimmed.includes(",")) {
    if ((trimmed.match(/,/g) ?? []).length !== 1) return null;
    const [formattedInteger, formattedFraction = ""] = trimmed.split(",");
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(formattedInteger) || !/^\d{0,2}$/.test(formattedFraction)) return null;
    integer = formattedInteger.replace(/\./g, "");
    fraction = formattedFraction;
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(trimmed)) {
    integer = trimmed.replace(/\./g, "");
  } else if (/^\d{1,10}(?:\.\d{1,2})?$/.test(trimmed)) {
    [integer, fraction = ""] = trimmed.split(".");
  } else {
    return null;
  }

  const amount = `${Number(integer)}.${fraction.padEnd(2, "0")}`;
  if (Number(amount) <= 0 || amount.length > 13) return null;
  return amount;
}

function tlv(id: string, value: string): string {
  if (value.length > 99) throw new Error("O conteúdo do QR Code excedeu o limite do padrão Pix.");
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16CcittFalse(value: string): string {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixStaticPayload(input: PixStaticQrInput): PixStaticQrResult {
  const key = normalizePixKey(input.keyType, input.key);
  if (!key) {
    return { error: "Confira a chave Pix, os dígitos verificadores e o tipo escolhido. Para telefone use DDD; para Outro, informe a chave aleatória." };
  }

  const identifier = input.identifier.trim();
  if (identifier && !/^[A-Za-z\d]{1,25}$/.test(identifier)) {
    return { error: "O identificador aceita até 25 letras e números, sem espaços." };
  }

  const amount = normalizeAmount(input.amount);
  if (amount === null) {
    return { error: "Informe um valor maior que zero, com até duas casas decimais e sem separador de milhar." };
  }

  const recipientName = normalizeMerchantText(input.recipientName);
  if (!recipientName || recipientName.length > 25) {
    return { error: "Informe o nome do recebedor com até 25 caracteres." };
  }

  const recipientCity = normalizeMerchantText(input.recipientCity);
  if (!recipientCity || recipientCity.length > 15) {
    return { error: "Informe a cidade do recebedor com até 15 caracteres." };
  }

  try {
    const merchantAccount = `${tlv("00", "br.gov.bcb.pix")}${tlv("01", key)}`;
    const additionalData = tlv("05", identifier || "***");
    const payloadWithoutCrc = [
      tlv("00", "01"),
      tlv("26", merchantAccount),
      tlv("52", "0000"),
      tlv("53", "986"),
      ...(amount ? [tlv("54", amount)] : []),
      tlv("58", "BR"),
      tlv("59", recipientName),
      tlv("60", recipientCity),
      tlv("62", additionalData),
      "6304",
    ].join("");

    return { payload: `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}` };
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Não foi possível montar o código Pix." };
  }
}
