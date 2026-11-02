"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallActionProps = {
  variant: "desktop" | "menu";
};

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeToStandalone(callback: () => void) {
  const standalone = window.matchMedia(STANDALONE_QUERY);
  standalone.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);

  return () => {
    standalone.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function getServerStandaloneSnapshot() {
  return false;
}

export function PwaInstallAction({ variant }: PwaInstallActionProps) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    getServerStandaloneSnapshot,
  );
  const isIos =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (isStandalone) return null;

  async function handleInstall() {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setShowInstructions(false);
    } catch {
      setShowInstructions(true);
    } finally {
      setInstallPrompt(null);
    }
  }

  return (
    <>
      <button
        aria-label="Instalar Cadernô Express"
        aria-expanded={showInstructions}
        aria-haspopup="dialog"
        className={`pwa-install-action pwa-install-action--${variant}`}
        onClick={() => void handleInstall()}
        type="button"
      >
        <Download aria-hidden="true" size={variant === "desktop" ? 15 : 17} />
        <span>Instalar app</span>
      </button>
      {showInstructions && (
        <div className="pwa-install-dialog-backdrop">
          <section
            aria-labelledby="pwa-install-title"
            aria-modal="true"
            className="pwa-install-dialog"
            role="dialog"
          >
            <button
              aria-label="Fechar instruções de instalação"
              className="pwa-install-dialog__close"
              onClick={() => setShowInstructions(false)}
              type="button"
            >
              <X aria-hidden="true" size={19} />
            </button>
            <span aria-hidden="true" className="pwa-install-dialog__icon">
              <Download size={22} />
            </span>
            <h2 id="pwa-install-title">Instale o Cadernô Express</h2>
            {isIos ? (
              <ol>
                <li>Abra esta página no Safari.</li>
                <li>Toque em Compartilhar.</li>
                <li>Escolha “Adicionar à Tela de Início” e confirme.</li>
              </ol>
            ) : (
              <p>
                No menu do navegador, escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
