import { describe, expect, it } from "vitest";
import { templateDefinitionSchema } from "./api-contracts";
import { backendCatalog } from "../../tests/helpers/backend-catalog";

describe("contrato frontend dos templates premium", () => {
  it("aceita os 16 contratos do catálogo e suas variantes de layout", () => {
    expect(backendCatalog).toHaveLength(16);
    for (const template of backendCatalog) {
      expect(() => templateDefinitionSchema.parse(template.definition), template.id).not.toThrow();
    }
  });
});
