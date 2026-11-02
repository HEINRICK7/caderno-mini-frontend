"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallActionProps = {
  variant: "desktop" | "menu";
};

export function PwaInstallAction({ variant }: PwaInstallActionProps) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () =>
      setIsStandalone(
        standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
    };
    const isIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

    updateStandalone();
    setIsIos(/iPad|iPhone|iPod/i.test(navigator.userAgent) || isIpad);
    standalone.addEventListener("change", updateStandalone);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      standalone.removeEventListener("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
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
