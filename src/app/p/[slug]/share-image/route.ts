import { getPublicPublication } from "@/lib/public-publication";
import { clientCompanyName, clientLogoAssetId, loadClientLogo } from "@/lib/share-preview";
import { renderClientSharePreview } from "@/lib/share-preview-image";

type ShareImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: ShareImageRouteProps): Promise<Response> {
  const { slug } = await params;
  const publication = await getPublicPublication(slug);
  if (!publication) return new Response(null, { status: 404 });
  const companyName = clientCompanyName(publication.templateDefinition, publication.data);
  const logoId = clientLogoAssetId(publication.templateDefinition, publication.data);
  const logo = logoId ? await loadClientLogo(logoId) : null;
  return renderClientSharePreview({
    companyName,
    templateName: publication.templateName,
    logoSrc: logo,
    purpose: publication.templateId === "cobranca-pix" ? "pix-charge" : "message",
  });
}
