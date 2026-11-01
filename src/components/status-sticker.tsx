import type { TemplateDefinition } from "../lib/api-contracts";

type Illustration = NonNullable<TemplateDefinition["card"]>["illustration"];
type StatusStickerProps = {
  column?: number;
  illustration?: Illustration;
  label: string;
  row?: number;
  className?: string;
};

const illustrationPosition: Record<Illustration, { column: number; row: number }> = {
  wave: { column: 0, row: 0 },
  "shopping-bag-heart": { column: 1, row: 0 },
  "installment-calendar": { column: 2, row: 0 },
  "due-calendar": { column: 3, row: 0 },
  "overdue-warning": { column: 0, row: 1 },
  "pix-qr": { column: 1, row: 1 },
  "payment-check": { column: 2, row: 1 },
  trophy: { column: 3, row: 1 },
  "service-clipboard": { column: 0, row: 2 },
  "service-seal": { column: 1, row: 2 },
  gift: { column: 2, row: 2 },
  "product-tag": { column: 3, row: 2 },
  "offer-tag": { column: 0, row: 3 },
  "collection-bag": { column: 1, row: 3 },
  "reactivation-heart": { column: 2, row: 3 },
  "approval-hourglass": { column: 3, row: 3 },
};

export function StatusSticker({ illustration, column = 0, label, row = 0, className = "" }: StatusStickerProps) {
  const position = illustration ? illustrationPosition[illustration] : { column, row };
  return (
    <span
      aria-label={label}
      className={`status-sticker ${className}`.trim()}
      role="img"
      style={{ backgroundPosition: `${position.column * 100 / 3}% ${position.row * 100 / 3}%` }}
    />
  );
}
