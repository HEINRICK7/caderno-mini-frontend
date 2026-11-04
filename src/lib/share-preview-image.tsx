import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

let fontData: Promise<Buffer> | undefined;
let brandIconData: Promise<Buffer> | undefined;

function loadFont(): Promise<Buffer> {
  fontData ??= readFile(join(process.cwd(), "node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff"));
  return fontData;
}

function loadBrandIcon(): Promise<Buffer> {
  brandIconData ??= readFile(join(process.cwd(), "public/icons/caderno-express-512.png"));
  return brandIconData;
}

export async function renderClientSharePreview(input: {
  companyName: string;
  templateName: string;
  logoSrc: string | null;
}): Promise<ImageResponse> {
  const [font, brandIcon] = await Promise.all([loadFont(), loadBrandIcon()]);
  const rawCardTitle = input.companyName || input.templateName || "Uma mensagem especial";
  const cardTitle = rawCardTitle.length > 44 ? `${rawCardTitle.slice(0, 43).trimEnd()}…` : rawCardTitle;
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
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img alt="" height={50} src={`data:image/png;base64,${brandIcon.toString("base64")}`} width={50} />
              <div style={{ display: "flex", flexDirection: "column", color: "#24324A", fontFamily: "Poppins", lineHeight: 1 }}>
                <span style={{ fontSize: 25 }}>cadernô</span>
                <span style={{ marginTop: 5, color: "#168A80", fontSize: 11, letterSpacing: 2 }}>EXPRESS</span>
              </div>
            </div>
            <div style={{ display: "flex", padding: "10px 16px", borderRadius: 999, background: "#E8F6F2", color: "#126D70", fontSize: 16 }}>
              CARTÃO DIGITAL
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
            <div style={{ display: "flex", maxWidth: 740, flexDirection: "column" }}>
              <span style={{ color: "#168A80", fontSize: 19, letterSpacing: 2 }}>UMA MENSAGEM ESPECIAL</span>
              <span style={{ marginTop: 16, color: "#24324A", fontFamily: "Poppins", fontSize: 56, lineHeight: 1.12 }}>
                {cardTitle}
              </span>
              <span style={{ marginTop: 16, color: "#536274", fontSize: 25, lineHeight: 1.3 }}>
                Um cartão digital personalizado para você.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                width: 184,
                height: 184,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px solid #D7EAE4",
                borderRadius: 92,
                background: "#E8F6F2",
              }}
            >
              {input.logoSrc ? (
                <img alt="" height={142} src={input.logoSrc} width={142} />
              ) : (
                <span style={{ color: "#168A80", fontFamily: "Poppins", fontSize: 86 }}>{cardTitle.slice(0, 1).toLocaleUpperCase("pt-BR")}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid #E8E5DF" }}>
            <span style={{ color: "#536274", fontSize: 18 }}>Feito para aproximar pessoas e negócios.</span>
            <span style={{ display: "flex", padding: "13px 22px", borderRadius: 12, background: "#168A80", color: "#FFFFFF", fontSize: 19 }}>
              Abrir cartão&nbsp; →
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
