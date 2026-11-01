"use client";

import { useState } from "react";

type CopyTextActionProps = {
  label: string;
  value: string;
  className: string;
  showArrow?: boolean;
};

export function CopyTextAction({ label, value, className, showArrow = true }: CopyTextActionProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const successful = document.execCommand("copy");
      textarea.remove();
      setCopied(successful);
      if (successful) window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button aria-live="polite" className={className} onClick={() => void copy()} type="button">
      <span>{copied ? "Código copiado" : label}</span>
      {showArrow && !copied ? <span aria-hidden="true" className="message-template__action-arrow">›</span> : null}
    </button>
  );
}
