import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const catalogPath = [
  resolve(process.cwd(), "mini-backend/catalog/templates.json"),
  resolve(process.cwd(), "../mini-backend/catalog/templates.json"),
].find(existsSync);

if (!catalogPath) {
  throw new Error("Backend catalog not found. Check out mini-backend/catalog/templates.json before running the frontend contract tests.");
}

export const backendCatalog = JSON.parse(readFileSync(catalogPath, "utf8")) as Array<{
  id: string;
  definition: unknown;
}>;
