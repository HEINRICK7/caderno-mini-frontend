// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MessageTemplateCard } from "./message-template-card";
import type { TemplateDefinition } from "@/lib/api-contracts";

afterEach(cleanup);

const definition: TemplateDefinition = {
  fields: [{ id: "recipientName", type: "text", label: "Nome", placeholder: "Maria" }],
  visual: { background: "#fff0c3", surface: "#ffffff", accent: "#ff6674" },
  card: {
    illustration: "wave",
    heading: "Olá, {{recipientName}}!",
    message: "Que bom ter você por aqui!",
    footer: "heart",
  },
};

describe("MessageTemplateCard", () => {
  it("renders the backend template as HTML and updates its field binding", () => {
    const { container, rerender } = render(
      <MessageTemplateCard data={{}} definition={definition} />,
    );

    expect(container.querySelector("h1")?.textContent).toBe("Olá, Maria!");
    expect(container.querySelector("p")?.textContent).toBe("Que bom ter você por aqui!");
    expect(container.querySelector("article")?.className).toContain("message-template--layout-card");
    expect(container.querySelector(".status-sticker")).not.toBeNull();
    expect(container.querySelector(".status-sticker")?.getAttribute("style")).toContain("background-position");
    expect(container.querySelector("img")).toBeNull();

    rerender(<MessageTemplateCard data={{ recipientName: "Ana" }} definition={definition} />);
    expect(container.querySelector("h1")?.textContent).toBe("Olá, Ana!");
  });

  it("treats user supplied text as text instead of markup", () => {
    const { container } = render(
      <MessageTemplateCard data={{ recipientName: "<img src=x onerror=alert(1)>" }} definition={definition} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("h1")?.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("renders backend detail rows and a non-interactive CTA in the editor preview", () => {
    const purchaseDefinition: TemplateDefinition = {
      fields: [
        { id: "recipientName", type: "text", placeholder: "Maria" },
        { id: "productName", type: "text", placeholder: "Conjunto de mesa" },
        { id: "purchaseAmount", type: "number", format: "currency", placeholder: "350" },
        { id: "detailsUrl", type: "url" },
      ],
      visual: { background: "#e5f0ff", surface: "#ffffff", accent: "#2563eb" },
      card: {
        illustration: "shopping-bag-heart",
        heading: "Obrigado, {{recipientName}}! 💙",
        message: "Sua compra foi registrada com sucesso.",
        details: [
          { label: "Produto", value: "{{productName}}", icon: "package" },
          { label: "Valor", value: "{{purchaseAmount}}", icon: "credit-card", format: "currency" },
        ],
        action: { label: "Ver detalhes da compra", hrefFieldId: "detailsUrl" },
        footer: "none",
      },
    };
    const { container, rerender } = render(
      <MessageTemplateCard data={{ productName: "Conjunto de mesa", purchaseAmount: 350 }} definition={purchaseDefinition} />,
    );

    expect(container.textContent).toContain("Conjunto de mesa");
    expect(container.textContent).toContain("R$ 350,00");
    expect(container.querySelector(".message-template__action")?.tagName).toBe("DIV");
    expect(container.querySelector(".message-template__heart")).toBeNull();

    rerender(
      <MessageTemplateCard
        data={{ recipientName: "Ana", productName: "Mesa", purchaseAmount: 350, detailsUrl: "https://loja.example/pedido" }}
        definition={purchaseDefinition}
        mode="published"
      />,
    );
    expect(container.querySelector(".message-template__action")?.getAttribute("href")).toBe("https://loja.example/pedido");
  });

  it("shows the company logo and name configured by the backend card contract", () => {
    const brandedDefinition: TemplateDefinition = {
      fields: [
        { id: "businessName", type: "text", placeholder: "Loja Exemplo" },
        { id: "businessLogo", type: "image", maxBytes: 131_072 },
        { id: "productImage", type: "image", maxBytes: 131_072 },
      ],
      card: {
        illustration: "shopping-bag-heart",
        heading: "Obrigado!",
        details: [{ label: "Produto", value: "Conjunto de mesa", imageFieldId: "productImage", icon: "package" }],
        brand: { businessNameFieldId: "businessName", logoFieldId: "businessLogo" },
        footer: "none",
      },
    };
    const logo = "7b7d828b-f189-496a-b59b-9fae6a9b8531";
    const { container } = render(
      <MessageTemplateCard data={{ businessName: "Loja Ana", businessLogo: logo, productImage: logo }} definition={brandedDefinition} />,
    );

    expect(container.querySelector(".message-template__brand")?.textContent).toContain("Loja Ana");
    expect(container.querySelector(".message-template__brand-logo")?.getAttribute("src")).toBe(`/api/v1/assets/${logo}/content`);
    expect(container.querySelector(".message-template__detail-image")?.getAttribute("src")).toBe(`/api/v1/assets/${logo}/content`);
  });

  it("shows both service approval choices and uses the matching backend URLs after publication", () => {
    const approvalDefinition: TemplateDefinition = {
      fields: [
        { id: "approveLink", type: "url" },
        { id: "rejectLink", type: "url" },
      ],
      card: {
        illustration: "approval-hourglass",
        heading: "Olá, cliente!",
        actions: [
          { label: "Sim, quero", hrefFieldId: "approveLink" },
          { label: "Agora não", hrefFieldId: "rejectLink" },
        ],
        footer: "none",
      },
    };
    const { container, rerender } = render(<MessageTemplateCard data={{}} definition={approvalDefinition} />);

    expect([...container.querySelectorAll(".message-template__action")].map((action) => action.textContent)).toEqual([
      "Sim, quero",
      "Agora não",
    ]);
    expect(container.querySelectorAll("a.message-template__action")).toHaveLength(0);

    rerender(<MessageTemplateCard
      data={{ approveLink: "https://example.com/approve", rejectLink: "https://example.com/reject" }}
      definition={approvalDefinition}
      mode="published"
    />);
    expect([...container.querySelectorAll("a.message-template__action")].map((action) => action.getAttribute("href"))).toEqual([
      "https://example.com/approve",
      "https://example.com/reject",
    ]);
  });
});
