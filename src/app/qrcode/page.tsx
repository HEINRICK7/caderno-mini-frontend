"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, QrCode, ShieldCheck } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { ApiError, api } from "@/lib/api-client";
import type { CustomerPortalSummary } from "@/lib/api-contracts";
import { buildPixStaticPayload, formatPixAmount, formatPixCnpj, formatPixCpf } from "@/lib/pix-static-qr";

type Workspace = {
  email: string;
  name: string;
  access: CustomerPortalSummary["platformAccess"];
};

const keyOptions = [
  { value: "cpf", label: "CPF", placeholder: "000.000.000-00", inputMode: "numeric" },
  { value: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", inputMode: "text" },
  { value: "email", label: "Email", placeholder: "nome@exemplo.com.br", inputMode: "email" },
  { value: "phone", label: "Telefone", placeholder: "+55 (00) 00000-0000", inputMode: "tel" },
  { value: "other", label: "Outro", placeholder: "Chave aleatória do banco", inputMode: "text" },
] as const;

function identifierFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\d]/g, "")
    .slice(0, 25);
}

function isKeyCharacter(character: string): boolean {
  return /[A-Z\d]/i.test(character);
}

function formatKeepingCaret(
  input: HTMLInputElement,
  formatter: (value: string) => string,
  isToken: (character: string) => boolean,
  isSkippableSeparator: (character: string) => boolean,
): string {
  const cursor = input.selectionStart ?? input.value.length;
  const formattedPrefix = formatter(input.value.slice(0, cursor));
  const tokenCount = [...formattedPrefix].filter(isToken).length;
  const formattedValue = formatter(input.value);

  requestAnimationFrame(() => {
    let position = 0;
    let foundTokens = 0;
    while (position < formattedValue.length && foundTokens < tokenCount) {
      if (isToken(formattedValue[position])) foundTokens += 1;
      position += 1;
    }
    while (position < formattedValue.length && isSkippableSeparator(formattedValue[position])) position += 1;
    input.setSelectionRange(position, position);
  });

  return formattedValue;
}

export default function QrCodeCreatorPage() {
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [authAttempt, setAuthAttempt] = useState(0);
  const [keyType, setKeyType] = useState<(typeof keyOptions)[number]["value"]>("cpf");
  const [key, setKey] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;

    void api.getCustomerPortal().then((portal) => {
      if (!active) return;
      if (!portal.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fqrcode");
        return;
      }
      const name = portal.user.name ?? "";
      setWorkspace({ email: portal.user.email, name, access: portal.platformAccess });
      setRecipientName(name);
      setIdentifier(identifierFromName(name));
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fqrcode");
      } else {
        setWorkspaceError(cause instanceof ApiError ? cause.message : "Não foi possível validar sua conta.");
      }
    }).finally(() => {
      if (active) setWorkspaceLoading(false);
    });

    return () => { active = false; };
  }, [authAttempt, router]);

  function generateQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    const result = buildPixStaticPayload({ keyType, key, identifier, amount, recipientName, recipientCity });
    if (!result.payload) {
      setError(result.error ?? "Não foi possível montar o QR Code Pix.");
      setQrPayload("");
      return;
    }

    setError("");
    setQrPayload(result.payload);
  }

  function updatePixKey(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (keyType === "cpf") {
      setKey(formatKeepingCaret(input, formatPixCpf, (character) => /\d/.test(character), (character) => character === "." || character === "-"));
    } else if (keyType === "cnpj") {
      setKey(formatKeepingCaret(input, formatPixCnpj, isKeyCharacter, (character) => character === "." || character === "/" || character === "-"));
    } else {
      setKey(input.value);
    }
    clearPreviousResult();
  }

  function finishAmountFormatting() {
    setAmount((current) => {
      const formatted = formatPixAmount(current);
      if (!formatted) return "";
      if (!formatted.includes(",")) return `${formatted},00`;
      const [integer, fraction = ""] = formatted.split(",");
      return `${integer},${fraction.padEnd(2, "0")}`;
    });
  }

  async function copyPixCode() {
    if (!qrPayload) return;
    try {
      await navigator.clipboard.writeText(qrPayload);
      setFeedback("Pix Copia e Cola copiado.");
    } catch {
      setFeedback("Não foi possível copiar automaticamente. Selecione o código e copie manualmente.");
    }
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) {
      setFeedback("Gere o QR Code novamente antes de baixar.");
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "qr-code-pix-caderno-express.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setFeedback("QR Code Pix baixado como imagem PNG.");
  }

  function clearQr() {
    setKey("");
    setIdentifier(identifierFromName(recipientName));
    setAmount("");
    setQrPayload("");
    setError("");
    setFeedback("");
  }

  function updateRecipientName(value: string) {
    setRecipientName(value);
    setIdentifier(identifierFromName(value));
    setQrPayload("");
    setError("");
    setFeedback("");
  }

  function clearPreviousResult() {
    setQrPayload("");
    setError("");
    setFeedback("");
  }

  if (workspaceLoading) return <CustomerWorkspaceLoading label="Abrindo o criador de QR Code Pix…" />;
  if (!workspace && !workspaceError) return <CustomerWorkspaceLoading label="Abrindo sua área privada…" />;

  return (
    <CustomerAreaShell access={workspace?.access} email={workspace?.email}>
      {!workspace ? (
        <div className="qr-code-auth-error" role="alert">
          <p>{workspaceError}</p>
          <button className="button button--secondary" onClick={() => {
            setWorkspace(null);
            setWorkspaceError("");
            setWorkspaceLoading(true);
            setAuthAttempt((attempt) => attempt + 1);
          }} type="button">
            Tentar novamente
          </button>
        </div>
      ) : (
        <section className="subpage-content qr-code-page">
          <div className="template-editor-heading qr-code-heading">
            <span className="customer-area-eyebrow"><QrCode aria-hidden="true" size={14} /> Ferramenta do cliente</span>
            <h1>Criar QR Code Pix</h1>
            <p>Preencha os dados abaixo para gerar um QR Code Pix estático e o código Copia e Cola.</p>
          </div>

          <div className="qr-code-layout">
            <form className="qr-code-form" onSubmit={generateQr}>
              <div className="qr-code-form__fields">
                <label className="qr-code-field" htmlFor="pix-key-type">
                  <span>Tipo da chave</span>
                  <select
                    id="pix-key-type"
                    onChange={(event) => {
                      setKeyType(event.target.value as (typeof keyOptions)[number]["value"]);
                      setKey("");
                      clearPreviousResult();
                    }}
                    value={keyType}
                  >
                    {keyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="qr-code-field" htmlFor="pix-key">
                  <span>Chave Pix</span>
                  <input
                    autoComplete="off"
                    id="pix-key"
                    inputMode={keyOptions.find((option) => option.value === keyType)?.inputMode}
                    maxLength={keyType === "cpf" ? 14 : keyType === "cnpj" ? 18 : keyType === "other" ? 36 : keyType === "email" ? 77 : 30}
                    onChange={updatePixKey}
                    autoCapitalize={keyType === "cnpj" ? "characters" : "off"}
                    placeholder={keyOptions.find((option) => option.value === keyType)?.placeholder}
                    required
                    type="text"
                    value={key}
                  />
                  {keyType === "cnpj" ? <small>Chaves CNPJ podem conter números e letras.</small> : null}
                  {keyType === "phone" ? <small>Informe o DDD; o código do país +55 é acrescentado quando necessário.</small> : null}
                  {keyType === "other" ? <small>Use a chave aleatória fornecida pelo banco, no formato UUID.</small> : null}
                </label>

                <label className="qr-code-field" htmlFor="pix-recipient-name">
                  <span>Nome do recebedor ou da loja</span>
                  <input
                    autoComplete="organization"
                    id="pix-recipient-name"
                    maxLength={80}
                    onChange={(event) => updateRecipientName(event.target.value)}
                    required
                    value={recipientName}
                  />
                  <small>Usado no BR Code e como base para sugerir o identificador.</small>
                </label>

                <label className="qr-code-field" htmlFor="pix-identifier">
                  <span>Identificador do Pix (TxID) <em>Opcional</em></span>
                  <input
                    autoComplete="off"
                    id="pix-identifier"
                    maxLength={25}
                    onChange={(event) => { setIdentifier(event.target.value); clearPreviousResult(); }}
                    placeholder="Gerado pelo nome ou loja"
                    value={identifier}
                  />
                  <small>Gerado a partir do nome acima. Pode editar ou apagar.</small>
                </label>

                <label className="qr-code-field" htmlFor="pix-amount">
                  <span>Valor (R$) <em>Opcional</em></span>
                  <div className="qr-code-currency">
                    <span aria-hidden="true">R$</span>
                    <input
                      autoComplete="off"
                      id="pix-amount"
                      inputMode="decimal"
                      maxLength={16}
                      onBlur={finishAmountFormatting}
                      onChange={(event) => {
                        setAmount(formatKeepingCaret(event.currentTarget, formatPixAmount, (character) => /\d/.test(character) || character === ",", (character) => character === "."));
                        clearPreviousResult();
                      }}
                      placeholder="0,00"
                      value={amount}
                    />
                  </div>
                  <small>Use vírgula para os centavos. Sem valor, o pagador informa no banco.</small>
                </label>

                <label className="qr-code-field" htmlFor="pix-recipient-city">
                  <span>Cidade do recebedor</span>
                  <input
                    autoComplete="address-level2"
                    id="pix-recipient-city"
                    maxLength={40}
                    onChange={(event) => { setRecipientCity(event.target.value); clearPreviousResult(); }}
                    placeholder="Ex.: Fortaleza"
                    required
                    value={recipientCity}
                  />
                  <small>O padrão Pix limita esse campo a 15 caracteres.</small>
                </label>
              </div>

              {error ? <p className="qr-code-form__error" role="alert">{error}</p> : null}
              <div className="qr-code-form__actions">
                <button className="button button--primary" type="submit"><QrCode aria-hidden="true" size={17} /> Gerar QR Code Pix</button>
                <button className="button button--secondary" onClick={clearQr} type="button">Limpar chave e valor</button>
              </div>
              <p className="qr-code-form__privacy"><ShieldCheck aria-hidden="true" size={16} /> Chave e valor ficam neste navegador; nada é salvo no servidor.</p>
            </form>

            <section aria-labelledby="qr-code-preview-title" className="qr-code-preview">
              <h2 id="qr-code-preview-title">Prévia do QR Code Pix</h2>
              {qrPayload ? (
                <>
                  <div aria-label="QR Code Pix gerado" className="qr-code-preview__image" ref={qrRef} role="img">
                    <QRCodeCanvas level="M" marginSize={4} size={320} title="QR Code Pix gerado" value={qrPayload} />
                  </div>
                  <div className="qr-code-preview__content">
                    <span>Pix Copia e Cola</span>
                    <code>{qrPayload}</code>
                  </div>
                  <div className="qr-code-preview__actions">
                    <button className="button button--primary" onClick={() => void copyPixCode()} type="button">
                      <Copy aria-hidden="true" size={16} /> Copiar Pix Copia e Cola
                    </button>
                    <button className="button button--secondary" onClick={downloadQr} type="button">
                      <Download aria-hidden="true" size={16} /> Baixar QR Code
                    </button>
                  </div>
                  {feedback ? <p className="qr-code-preview__feedback" role="status">{feedback}</p> : null}
                </>
              ) : (
                <div className="qr-code-preview__empty">
                  <QrCode aria-hidden="true" size={36} />
                  <strong>O QR Code Pix aparecerá aqui</strong>
                  <span>Preencha os dados para visualizar e baixar o QR.</span>
                </div>
              )}
            </section>
          </div>

          <p className="qr-code-safety-note">Este gerador monta um Pix estático e não consulta o DICT nem confirma a titularidade da chave. Antes de pagar, confira o nome do recebedor e o valor no app do banco.</p>
        </section>
      )}
    </CustomerAreaShell>
  );
}
