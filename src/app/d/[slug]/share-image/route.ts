import { getPublicDemoPublication } from "@/lib/public-demo-publication";
import { clientCompanyName, clientLogoAssetId, loadClientLogo } from "@/lib/share-preview";
import { renderClientSharePreview } from "@/lib/share-preview-image";

type ShareImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: ShareImageRouteProps): Promise<Response> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  if (!demo) return new Response(null, { status: 404 });
  const companyName = clientCompanyName(demo.templateDefinition, demo.data);
  const logoId = clientLogoAssetId(demo.templateDefinition, demo.data);
  const logo = logoId ? await loadClientLogo(logoId) : null;
  return renderClientSharePreview({ companyName, templateName: demo.templateName, logoSrc: logo });
}
