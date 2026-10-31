import Link from "next/link";

type BrandMarkProps = { compact?: boolean };

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link aria-label="Cadernô Express — início" className="brand-mark" href="/">
      <svg aria-hidden="true" className="brand-mark__symbol" fill="none" viewBox="0 0 48 48">
        <path d="M7 12.5 27.4 6l11.4 6.2v26.4L7 32.8V12.5Z" fill="#168A80" />
        <path d="M14 14.1c0-1.5 1.2-2.7 2.7-2.7h13.7L39 20v17.3c0 1.5-1.2 2.7-2.7 2.7H16.7c-1.5 0-2.7-1.2-2.7-2.7V14.1Z" fill="#F47D71" />
        <path d="M30.4 11.4V18c0 1.1.9 2 2 2H39" fill="#FFF9F0" />
        <path d="m39.6 5.7 1.2-3.1m3 7.7 2.9-1m-4 7.4 3.2.3" stroke="#24324A" strokeLinecap="round" strokeWidth="2.3" />
      </svg>
      <span className="brand-mark__wording">
        <span className="brand-mark__name">cadernô</span>
        {!compact && <span className="brand-mark__express">EXPRESS</span>}
      </span>
    </Link>
  );
}
