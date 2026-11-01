import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { templateDefinitionSchema } from "./api-contracts";

const catalog = JSON.parse(readFileSync(resolve(process.cwd(), "../mini-backend/catalog/templates.json"), "utf8")) as Array<{
  id: string;
  definition: unknown;
}>;

describe("contrato frontend dos templates premium", () => {
  it("aceita os 16 contratos do catálogo e suas variantes de layout", () => {
    expect(catalog).toHaveLength(16);
    for (const template of catalog) {
      expect(() => templateDefinitionSchema.parse(template.definition), template.id).not.toThrow();
    }
  });
});
