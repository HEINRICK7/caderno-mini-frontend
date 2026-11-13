const STORAGE_KEY = "caderno.pix-qr-handoff";
const HANDOFF_TTL_MS = 10 * 60 * 1000;
const MAX_PIX_PAYLOAD_LENGTH = 2048;

export const PIX_QR_SUPPORTED_TEMPLATE_IDS = [
  "cobranca-pix",
  "parcela-proxima",
  "parcela-hoje",
  "parcela-atrasada",
] as const;

export type PixQrHandoff = {
  payload: string;
  amount: number | null;
};

type StoredPixQrHandoff = PixQrHandoff & {
  createdAt: number;
};

export function savePixQrHandoff(handoff: PixQrHandoff): boolean {
  if (typeof window === "undefined" || !isValidHandoff(handoff)) return false;

  try {
    const stored: StoredPixQrHandoff = { ...handoff, createdAt: Date.now() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export function hasPendingPixQrHandoff(): boolean {
  return readPixQrHandoff() !== null;
}

export function consumePixQrHandoff(): PixQrHandoff | null {
  if (typeof window === "undefined") return null;

  const handoff = readPixQrHandoff();
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Keep the one-time handoff short-lived even if storage cleanup fails.
  }
  return handoff;
}

function readPixQrHandoff(): PixQrHandoff | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored: unknown = JSON.parse(raw);
    if (!isStoredHandoff(stored)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const age = Date.now() - stored.createdAt;
    if (age < 0 || age > HANDOFF_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return { payload: stored.payload, amount: stored.amount };
  } catch {
    return null;
  }
}

function isStoredHandoff(value: unknown): value is StoredPixQrHandoff {
  if (!value || typeof value !== "object") return false;
  const handoff = value as Partial<StoredPixQrHandoff>;
  return isValidHandoff(handoff) && typeof handoff.createdAt === "number" && Number.isFinite(handoff.createdAt);
}

function isValidHandoff(value: Partial<PixQrHandoff>): value is PixQrHandoff {
  return typeof value.payload === "string"
    && value.payload.length > 0
    && value.payload.length <= MAX_PIX_PAYLOAD_LENGTH
    && (value.amount === null || (typeof value.amount === "number" && Number.isFinite(value.amount) && value.amount > 0));
}
