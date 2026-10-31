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
    expect(container.querySelector("svg")).not.toBeNull();
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
});
