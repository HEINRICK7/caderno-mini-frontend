import { getPublicDemoPublication } from "@/lib/public-demo-publication";
import { clientLogoAssetId, loadClientLogo } from "@/lib/share-preview";
import { renderClientLogoPreview } from "@/lib/share-preview-image";

type ShareImageRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: ShareImageRouteProps): Promise<Response> {
  const { slug } = await params;
  const demo = await getPublicDemoPublication(slug);
  const logoId = demo ? clientLogoAssetId(demo.templateDefinition, demo.data) : null;
  const logo = logoId ? await loadClientLogo(logoId) : null;
  if (!logo) return new Response(null, { status: 404 });
  return renderClientLogoPreview(logo);
}
