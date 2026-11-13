import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

let fontData: Promise<Buffer> | undefined;

function loadFont(): Promise<Buffer> {
  fontData ??= readFile(join(process.cwd(), "node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff"));
  return fontData;
}

export async function renderClientSharePreview(input: {
  companyName: string;
  templateName: string;
  logoSrc: string | null;
  purpose?: "message" | "pix-charge";
}): Promise<ImageResponse> {
  const font = await loadFont();
  const rawCardTitle = input.companyName || input.templateName || "Uma mensagem especial";
  const cardTitle = rawCardTitle.length > 44 ? `${rawCardTitle.slice(0, 43).trimEnd()}…` : rawCardTitle;
  const isPixCharge = input.purpose === "pix-charge";
  const previewTitle = isPixCharge ? "Cobrança Pix" : "Uma mensagem especial";
  const previewDescription = isPixCharge
    ? "Acesse o QR Code Pix e o código Pix Copia e Cola."
    : input.companyName ? `Preparada por ${cardTitle} para você.` : `${cardTitle}, feito especialmente para compartilhar.`;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "48px",
          background: "#FFF9F0",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px 48px",
            border: "2px solid #D7EAE4",
            borderRadius: 30,
            background: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#126D70", fontFamily: "Poppins", fontSize: 18 }}>
              <span style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: "#F47D71" }} />
              {isPixCharge ? "COBRANÇA PIX · CADERNÔ EXPRESS" : "CARTÃO DIGITAL · CADERNÔ EXPRESS"}
            </div>
            {input.companyName ? (
              <span style={{ maxWidth: 420, color: "#536274", fontSize: 18 }}>{cardTitle}</span>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
            <div style={{ display: "flex", maxWidth: 740, flexDirection: "column" }}>
              <span style={{ color: "#168A80", fontSize: 19, letterSpacing: 2 }}>
                {isPixCharge ? "PAGAMENTO VIA PIX" : "UMA MENSAGEM PARA VOCÊ"}
              </span>
              <span style={{ marginTop: 16, color: "#24324A", fontFamily: "Poppins", fontSize: 56, lineHeight: 1.12 }}>
                {previewTitle}
              </span>
              <span style={{ marginTop: 16, color: "#536274", fontSize: 25, lineHeight: 1.3 }}>
                {previewDescription}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                width: 236,
                height: 236,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px solid #D7EAE4",
                borderRadius: 28,
                background: "#E8F6F2",
              }}
            >
              {input.logoSrc ? (
                // ImageResponse rasterizes this logo for social previews; next/image is not supported here.
                // eslint-disable-next-line @next/next/no-img-element -- Required by the ImageResponse renderer.
                <img alt="" height={196} src={input.logoSrc} style={{ objectFit: "contain" }} width={196} />
              ) : (
                <span style={{ color: "#168A80", fontFamily: "Poppins", fontSize: 100 }}>{cardTitle.slice(0, 1).toLocaleUpperCase("pt-BR")}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid #E8E5DF" }}>
            <span style={{ color: "#536274", fontSize: 18 }}>
              {isPixCharge
                ? input.companyName ? `Cobrança Pix de ${cardTitle}` : "Confira os dados antes de pagar"
                : input.companyName ? `Uma mensagem de ${cardTitle}` : "Cartão digital personalizado"}
            </span>
            <span style={{ display: "flex", padding: "13px 22px", borderRadius: 12, background: "#168A80", color: "#FFFFFF", fontSize: 19 }}>
              {isPixCharge ? "Ver cobrança" : "Ver mensagem"}&nbsp; →
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Poppins", data: font, weight: 700, style: "normal" }],
    },
  );
}
