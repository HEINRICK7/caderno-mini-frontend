import { describe, expect, it } from "vitest";
import { clientLogoAssetId } from "./share-preview";

const logoId = "7b7d828b-f189-496a-b59b-9fae6a9b8531";

describe("logo usada na prévia do WhatsApp", () => {
  it("lê a logo configurada no cartão", () => {
    expect(clientLogoAssetId(
      { card: { brand: { logoFieldId: "businessLogo" } } },
      { businessLogo: logoId },
    )).toBe(logoId);
  });

  it("ignora cartão sem logo ou com valor que não é uma imagem", () => {
    expect(clientLogoAssetId({ card: { brand: {} } }, { businessLogo: logoId })).toBeNull();
    expect(clientLogoAssetId(
      { card: { brand: { logoFieldId: "businessLogo" } } },
      { businessLogo: "https://example.com/logo.png" },
    )).toBeNull();
  });
});
