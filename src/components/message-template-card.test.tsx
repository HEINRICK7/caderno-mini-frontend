// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import catalog from "../../../mini-backend/catalog/templates.json";
import { MessageTemplateCard } from "./message-template-card";
import type { TemplateDefinition } from "@/lib/api-contracts";
import { personalizedData } from "../../tests/visual-fixtures/template-fixtures";

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
  it("renders all 16 catalog templates with personalized values", () => {
    const templates = catalog as unknown as Array<{ id: string; definition: TemplateDefinition }>;
    const renderedIds: string[] = [];

    expect(templates).toHaveLength(16);

    for (const template of templates) {
      const { container } = render(
        <MessageTemplateCard data={personalizedData(template.definition)} definition={template.definition} />,
      );
      const article = container.querySelector("article");
      const card = template.definition.card;

      expect(article).not.toBeNull();
      expect(article?.className).toContain(`message-template--${card?.illustration}`);
      expect(container.querySelector(".status-sticker")).not.toBeNull();
      expect(container.querySelector("h1")?.textContent).toBeTruthy();
      expect(article?.textContent).toContain("Conteúdo personalizado");
      expect(article?.textContent).not.toContain("Conjunto de mesa");
      expect(article?.textContent).not.toContain("Maria");

      renderedIds.push(template.id);
      cleanup();
    }

    expect(new Set(renderedIds).size).toBe(16);
  });

  it("renders the backend template as HTML and updates its field binding", () => {
    const { container, rerender } = render(
      <MessageTemplateCard data={{ recipientName: "Maria" }} definition={definition} />,
    );

    expect(container.querySelector("h1")?.textContent).toBe("Olá, Maria!");
    expect(container.querySelector("p")?.textContent).toBe("Que bom ter você por aqui!");
    expect(container.querySelector("article")?.className).toContain("message-template--standard");
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
        { id: "businessLogo", type: "image", maxBytes: 5 * 1024 * 1024 },
        { id: "productImage", type: "image", maxBytes: 5 * 1024 * 1024 },
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

  it("shows newly selected company and product images in the phone preview before upload finishes", () => {
    const brandedDefinition: TemplateDefinition = {
      fields: [
        { id: "businessName", type: "text", placeholder: "Loja Exemplo" },
        { id: "businessLogo", type: "image", maxBytes: 5 * 1024 * 1024 },
        { id: "productImage", type: "image", maxBytes: 5 * 1024 * 1024 },
      ],
      card: {
        illustration: "shopping-bag-heart",
        heading: "Obrigado!",
        details: [{ label: "Produto", value: "Conjunto de mesa", imageFieldId: "productImage", icon: "package" }],
        brand: { businessNameFieldId: "businessName", logoFieldId: "businessLogo" },
        footer: "none",
      },
    };
    const logoPreview = "data:image/png;base64,bG9nbw==";
    const productPreview = "data:image/webp;base64,cHJvZHVjdA==";
    const { container } = render(
      <MessageTemplateCard
        data={{ businessName: "Loja Ana" }}
        definition={brandedDefinition}
        imagePreviews={{ businessLogo: logoPreview, productImage: productPreview }}
      />,
    );

    expect(container.querySelector(".message-template__brand-logo")?.getAttribute("src")).toBe(logoPreview);
    expect(container.querySelector(".message-template__detail-image")?.getAttribute("src")).toBe(productPreview);
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

  it("resolves editable labels, highlighted variables, typed values, and unlabeled welcome rows", () => {
    const customDefinition: TemplateDefinition = {
      fields: [
        { id: "title", type: "text" },
        { id: "highlightedText", type: "text" },
        { id: "businessName", type: "text" },
        { id: "detailLabel", type: "text" },
        { id: "amount", type: "number" },
        { id: "welcomeLine", type: "text" },
      ],
      card: {
        illustration: "wave",
        layout: "welcome",
        heading: "{{title}}",
        highlightedText: "{valor} · {{highlightedText}}",
        details: [
          { labelFieldId: "detailLabel", value: "{{amount}}", format: "currency", icon: "credit-card" },
          { value: "{{welcomeLine}}", icon: "chat" },
        ],
        variables: { valor: "amount", nome_empresa: "businessName" },
        footer: "none",
      },
    };
    const { container } = render(<MessageTemplateCard
      data={{ title: "Mensagem personalizada", highlightedText: "para a sua equipe", amount: 87.5, detailLabel: "Total ajustado", welcomeLine: "Atendimento próximo" }}
      definition={customDefinition}
    />);

    expect(container.querySelector("h1")?.textContent).toBe("Mensagem personalizada");
    expect(container.querySelector(".message-template__highlight")?.textContent).toBe("87.5 · para a sua equipe");
    expect(container.querySelectorAll(".message-template__detail")).toHaveLength(2);
    expect(container.querySelectorAll("dt")).toHaveLength(1);
    expect(container.textContent).toContain("Total ajustado");
    expect(container.textContent).toContain("R$ 87,50");
    expect(container.textContent).toContain("Atendimento próximo");
  });

  it("keeps reference-specific subtitle order and formats date variables for pt-BR", () => {
    const orderedDefinition: TemplateDefinition = {
      fields: [{ id: "dueDate", type: "date" }],
      card: {
        illustration: "due-calendar",
        heading: "{{dueDate}}",
        subtitle: "Sua parcela vence em",
        subtitlePlacement: "before-highlight",
        subtitleStyle: "subheading",
        highlightedText: "3 dias.",
        details: [{ value: "{{dueDate}}", icon: "calendar", format: "date", valueStyle: "supporting" }],
        footer: "none",
      },
    };
    const { container } = render(<MessageTemplateCard data={{ dueDate: "2027-02-19" }} definition={orderedDefinition} />);

    expect([...container.querySelector(".message-template__heading")!.children].map((node) => node.className)).toEqual([
      "message-template__heading-title",
      "message-template__subtitle message-template__subtitle--subheading",
      "message-template__highlight",
    ]);
    expect(container.querySelector(".message-template__subtitle")?.textContent).toBe("Sua parcela vence em");
    expect(container.querySelector(".message-template__detail dd")?.textContent).toBe("19 de fev de 2027");
  });

  it("renders a template status badge next to its typed value", () => {
    const badgeDefinition: TemplateDefinition = {
      fields: [{ id: "amount", type: "number", format: "currency" }],
      card: {
        illustration: "due-calendar",
        heading: "Vence hoje",
        details: [{ label: "Valor da parcela", value: "{{amount}}", format: "currency", statusBadge: "HOJE" }],
        footer: "none",
      },
    };
    const { container } = render(<MessageTemplateCard data={{ amount: 79 }} definition={badgeDefinition} />);

    expect(container.querySelector(".message-template__detail-badge")?.textContent).toBe("HOJE");
    expect(container.querySelector(".message-template__detail-value-line")?.textContent).toContain("R$ 79,00");
  });

  it("renders special-offer prices in the approved stacked order with a calculated discount", () => {
    const offerDefinition: TemplateDefinition = {
      fields: [
        { id: "productName", type: "text" },
        { id: "oldPrice", type: "number", format: "currency" },
        { id: "newPrice", type: "number", format: "currency" },
      ],
      card: {
        illustration: "offer-tag",
        layout: "offer",
        heading: "Oferta especial",
        product: { nameFieldId: "productName", originalPriceFieldId: "oldPrice", priceFieldId: "newPrice", icon: "calendar" },
        footer: "none",
      },
    };
    const { container } = render(<MessageTemplateCard data={{ productName: "Produto", oldPrice: 99.9, newPrice: 79.9 }} definition={offerDefinition} />);

    const prices = container.querySelector(".message-template__prices--offer");
    expect(prices?.firstElementChild?.textContent).toContain("99,90");
    expect(prices?.lastElementChild?.textContent).toContain("R$ 79,90");
    expect(prices?.textContent).toContain("20% OFF");
  });

  it("places Pix details before its application-provided QR panel", () => {
    const pixDefinition: TemplateDefinition = {
      fields: [
        { id: "amount", type: "number", format: "currency" },
        { id: "pixQrImage", type: "image" },
        { id: "pixSecurityNote", type: "text" },
      ],
      card: {
        illustration: "pix-qr",
        layout: "pix",
        heading: "Cobrança Pix",
        pixNoteFieldId: "pixSecurityNote",
        details: [
          { label: "Valor", value: "{{amount}}", format: "currency", icon: "credit-card" },
          { label: "QR Pix", value: "{{pixQrImage}}", imageFieldId: "pixQrImage", icon: "qrcode" },
        ],
        footer: "none",
      },
    };
    const { container } = render(
      <MessageTemplateCard
        data={{ amount: 70, pixSecurityNote: "Orientação personalizada" }}
        definition={pixDefinition}
        imagePreviews={{ pixQrImage: "data:image/png;base64,cGl4" }}
      />,
    );
    const content = container.querySelector(".message-template__surface")!;

    expect(content.querySelector(".message-template__detail")).not.toBeNull();
    expect(content.querySelector(".message-template__detail")!.compareDocumentPosition(content.querySelector(".message-template__pix")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(content.querySelector(".message-template__pix-note")?.textContent).toBe("Orientação personalizada");
  });

  it("maps every approved status illustration to its own sprite cell", () => {
    const cells = [
      ["wave", 0, 0], ["shopping-bag-heart", 1, 0], ["installment-calendar", 2, 0], ["due-calendar", 3, 0],
      ["overdue-warning", 0, 1], ["pix-qr", 1, 1], ["payment-check", 2, 1], ["trophy", 3, 1],
      ["service-clipboard", 0, 2], ["service-seal", 1, 2], ["gift", 2, 2], ["product-tag", 3, 2],
      ["offer-tag", 0, 3], ["collection-bag", 1, 3], ["reactivation-heart", 2, 3], ["approval-hourglass", 3, 3],
    ] as const;
    const { container, rerender } = render(<MessageTemplateCard data={{}} definition={{
      fields: [],
      card: { illustration: "wave", heading: "Preview", footer: "none" },
    }} />);

    for (const [illustration, column, row] of cells) {
      rerender(<MessageTemplateCard data={{}} definition={{
        fields: [],
        card: { illustration, heading: "Preview", footer: "none" },
      }} />);
      expect(container.querySelector(".status-sticker")?.getAttribute("style"), illustration)
        .toContain(`background-position: ${column * 100 / 3}% ${row * 100 / 3}%`);
    }
  });

  it("keeps paid and settled messages unavailable without trusted financial state", () => {
    const paidDefinition: TemplateDefinition = {
      fields: [{ id: "paymentStatus", type: "select", options: ["confirmed", "pending"] }],
      card: {
        illustration: "payment-check",
        heading: "Pagamento confirmado",
        financial: { stateFieldId: "paymentStatus", expectedState: "confirmed" },
        footer: "none",
      },
    };
    const { container, rerender } = render(<MessageTemplateCard data={{ paymentStatus: "pending" }} definition={paidDefinition} mode="published" />);
    expect(container.querySelector("article")?.getAttribute("aria-label")).toBe("Mensagem indisponível");

    rerender(<MessageTemplateCard data={{ paymentStatus: "confirmed" }} definition={paidDefinition} mode="published" />);
    expect(container.querySelector("h1")?.textContent).toBe("Pagamento confirmado");
  });
});
