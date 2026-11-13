// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, verifyMagicLink } = vi.hoisted(() => ({
  replace: vi.fn(),
  verifyMagicLink: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("token=valid-token"),
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {},
  api: { verifyMagicLink },
}));

import VerifyPage from "./page";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  replace.mockReset();
  verifyMagicLink.mockReset();
});

describe("retorno do magic link", () => {
  it("abre a área privada padrão quando o link foi aberto sem o armazenamento da aba de origem", async () => {
    verifyMagicLink.mockResolvedValue({ profileComplete: true });
    render(<VerifyPage />);

    await act(async () => { await Promise.resolve(); });

    expect(replace).toHaveBeenCalledWith("/painel");
  });
});
