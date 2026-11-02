import { ImageResponse } from "next/og";

export function renderClientLogoPreview(logoSrc: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF9F0",
        }}
      >
        <img alt="" height={480} src={logoSrc} width={480} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
