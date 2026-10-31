type StatusStickerProps = { column?: number; label: string; row?: number };

export function StatusSticker({ column = 0, label, row = 0 }: StatusStickerProps) {
  return (
    <span
      aria-label={label}
      className="status-sticker"
      role="img"
      style={{ backgroundPosition: `${column * 100 / 3}% ${row * 100 / 3}%` }}
    />
  );
}
