import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

let fontData: Promise<Buffer> | undefined;

function loadFont(): Promise<Buffer> {
  fontData ??= readFile(join(process.cwd(), "node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff"));
  return fontData;
}

export async function renderClientSharePreview(input: { companyName: string; logoSrc: string | null }): Promise<ImageResponse> {
  const font = await loadFont();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          padding: "72px",
          background: "#FFF9F0",
        }}
      >
        {input.logoSrc ? <img alt="" height={280} src={input.logoSrc} width={280} /> : null}
        {input.companyName ? (
          <div style={{ display: "flex", maxWidth: 760, color: "#126d70", fontFamily: "Poppins", fontSize: 72, lineHeight: 1.1 }}>
            {input.companyName}
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Poppins", data: font, weight: 700, style: "normal" }],
    },
  );
}
