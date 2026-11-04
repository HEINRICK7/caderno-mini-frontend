import type { TemplateDefinition } from "@/lib/api-contracts";
import { BrandMark } from "./brand-mark";
import { MessageTemplateCard } from "./message-template-card";

type MessagePhonePreviewProps = {
  definition: TemplateDefinition;
  data: Record<string, unknown>;
  title: string;
  imagePreviews?: Record<string, string>;
};

export function MessagePhonePreview({
  definition,
  data,
  title,
  imagePreviews,
}: MessagePhonePreviewProps) {
  return (
    <section aria-label="Prévia no celular" className="template-editor-preview">
      <h2 className="template-editor-preview__title">Prévia no celular</h2>
      <div aria-label="Tela do celular" className="message-phone" role="region">
        <div aria-hidden="true" className="message-phone__status">
          <span>9:41</span>
          <span className="message-phone__island" />
          <span className="message-phone__indicators">
            <span className="message-phone__signal">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="message-phone__wifi" />
            <span className="message-phone__battery"><i /></span>
          </span>
        </div>
        <div className="message-phone__screen">
          <header className="message-phone__appbar">
            <BrandMark />
          </header>
          <MessageTemplateCard
            data={data}
            definition={definition}
            imagePreviews={imagePreviews}
            showBusinessNamePlaceholder={false}
            requireActionDestinationInPreview
            title={title}
          />
        </div>
        <div aria-hidden="true" className="message-phone__home">
          <span />
        </div>
      </div>
    </section>
  );
}
