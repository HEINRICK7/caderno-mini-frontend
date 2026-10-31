import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./safe-return-to";

describe("safeReturnTo", () => {
  it("preserva destinos locais", () => {
    expect(safeReturnTo("/mensagens/draft-1")).toBe("/mensagens/draft-1");
  });

  it("rejeita URLs externas e caminhos protocol-relative", () => {
    expect(safeReturnTo("https://example.com")).toBe("/templates");
    expect(safeReturnTo("//example.com")).toBe("/templates");
    expect(safeReturnTo("/\\\\example.com")).toBe("/templates");
  });
});
