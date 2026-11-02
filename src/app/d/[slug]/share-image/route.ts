import { getPublicDemoPublication } from "@/lib/public-demo-publication";
import { clientCompanyName, clientLogoAssetId, loadClientLogo } from "@/lib/share-preview";
import { renderClientSharePreview } from "@/lib/share-preview-image";

type ShareImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: ShareImageRouteProps): Promise<Response> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  const companyName = demo ? clientCompanyName(demo.templateDefinition, demo.data) : "";
  const logoId = demo ? clientLogoAssetId(demo.templateDefinition, demo.data) : null;
  const logo = logoId ? await loadClientLogo(logoId) : null;
  if (!companyName && !logo) return new Response(null, { status: 404 });
  return renderClientSharePreview({ companyName, logoSrc: logo });
}
