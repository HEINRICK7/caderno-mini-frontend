import { getPublicPublication } from "@/lib/public-publication";
import { clientCompanyName, clientLogoAssetId, loadClientLogo } from "@/lib/share-preview";
import { renderClientSharePreview } from "@/lib/share-preview-image";

type ShareImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: ShareImageRouteProps): Promise<Response> {
  const { slug } = await params;
  const publication = await getPublicPublication(slug);
  const companyName = publication ? clientCompanyName(publication.templateDefinition, publication.data) : "";
  const logoId = publication ? clientLogoAssetId(publication.templateDefinition, publication.data) : null;
  const logo = logoId ? await loadClientLogo(logoId) : null;
  if (!companyName && !logo) return new Response(null, { status: 404 });
  return renderClientSharePreview({ companyName, logoSrc: logo });
}
