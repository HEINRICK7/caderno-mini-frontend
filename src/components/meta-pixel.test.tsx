// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/como-funciona",
  useSearchParams: () => ({ toString: () => "" }),
}));

vi.mock("next/script", () => ({
  default: ({ children }: { children: string }) => <div data-testid="meta-pixel-script" data-code={children} />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789");
  window.localStorage.clear();
  delete window.fbq;
  delete window.__cadernoMetaPixelQueue;
});

describe("Meta Pixel consent", () => {
  it("keeps tracking off until the visitor accepts or customizes the choice", async () => {
    const { MetaPixel, trackMetaEvent } = await import("./meta-pixel");
    render(<MetaPixel />);

    expect(await screen.findByRole("region", { name: "Preferências de cookies de marketing" })).toBeTruthy();
    expect(screen.queryByTestId("meta-pixel-script")).toBeNull();
    expect(trackMetaEvent("PageView")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Personalizar" }));
    const toggle = await screen.findByRole("checkbox", { name: /Medição de anúncios \(Meta Pixel\)/ });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Salvar preferências" }));

    await waitFor(() => expect(window.localStorage.getItem("caderno-meta-marketing-consent-v1")).toBe("accepted"));
    expect(await screen.findByTestId("meta-pixel-script")).toBeTruthy();
    expect(trackMetaEvent("PageView")).toBe(true);
  });

  it("supports rejecting and later reopening preferences to revoke consent", async () => {
    const { MetaPixel, trackMetaEvent } = await import("./meta-pixel");
    render(<MetaPixel />);

    fireEvent.click(await screen.findByRole("button", { name: "Recusar medição" }));
    await waitFor(() => expect(window.localStorage.getItem("caderno-meta-marketing-consent-v1")).toBe("rejected"));
    expect(trackMetaEvent("PageView")).toBe(false);
    expect(screen.queryByTestId("meta-pixel-script")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Preferências de cookies" }));
    expect(await screen.findByRole("checkbox", { name: /Medição de anúncios \(Meta Pixel\)/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Política de cookies da Meta/ })).toBeTruthy();
  });
});
