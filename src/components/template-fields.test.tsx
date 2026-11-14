// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplateField } from "@/lib/api-contracts";
import { backendCatalog } from "../../tests/helpers/backend-catalog";
const { uploadImage } = vi.hoisted(() => ({ uploadImage: vi.fn() }));
vi.mock("../lib/api-client", () => ({ api: { uploadImage } }));
import { api } from "../lib/api-client";
import { TemplateFields } from "./template-fields";

afterEach(cleanup);
const logoId = "7b7d828b-f189-496a-b59b-9fae6a9b8531";

beforeEach(() => uploadImage.mockReset().mockResolvedValue({ id: logoId, contentUrl: `/api/v1/assets/${logoId}/content` }));

describe("campo de logo da empresa", () => {
  it("converte a imagem para o formato do contrato e permite removê-la", async () => {
    const onChange = vi.fn();
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const props = { fields: [{ id: "businessLogo", type: "image" as const, label: "Logo da empresa", maxBytes: 8 }], onChange };
    const { rerender } = render(<TemplateFields {...props} values={{}} />);

    fireEvent.change(screen.getByLabelText("Logo da empresa"), {
      target: { files: [new File([bytes], "logo.png", { type: "image/png" })] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("businessLogo", logoId));
    expect(api.uploadImage).toHaveBeenCalledWith("data:image/png;base64,iVBORw0KGgo=");
    rerender(<TemplateFields {...props} values={{ businessLogo: logoId }} />);
    expect(screen.getByAltText("Prévia de logo da empresa").getAttribute("src")).toBe(`/api/v1/assets/${logoId}/content`);
    fireEvent.click(screen.getByRole("button", { name: "Remover imagem" }));
    expect(onChange).toHaveBeenLastCalledWith("businessLogo", "");
  });

  it("não aceita imagem acima do limite enviado pelo backend", () => {
    const onChange = vi.fn();
    render(<TemplateFields fields={[{ id: "businessLogo", type: "image", label: "Logo da empresa", maxBytes: 1024 }]} values={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Logo da empresa"), {
      target: { files: [new File([new Uint8Array(1025)], "logo.png", { type: "image/png" })] },
    });

    expect(screen.getByRole("alert").textContent).toContain("até 1 KB");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renderiza os campos editáveis definidos pelo backend nos 16 modelos", () => {
    const onChange = vi.fn();

    for (const template of backendCatalog) {
      const fields = (template.definition as { fields: TemplateField[] }).fields;
      const { container } = render(<TemplateFields fields={fields} values={{}} onChange={onChange} />);

      for (const field of fields) {
        const input = container.querySelector(`#${field.id}`);
        if (field.editable === false) {
          expect(input, `${template.id}.${field.id} deve continuar protegido`).toBeNull();
        } else {
          expect(input, `${template.id}.${field.id} deve aparecer no formulário`).not.toBeNull();
        }
      }

      cleanup();
    }
  });
});
