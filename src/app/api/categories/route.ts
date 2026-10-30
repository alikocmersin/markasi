import { NextResponse } from "next/server";
import { listCategoryTree, slugify } from "@/lib/db";

function sanitizeCategoryUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  // Filter out any known problematic or broken external CDNs
  if (trimmed.includes("cdnaws.com.tr") || trimmed.includes("yedekparcacomtr")) {
    return "";
  }
  return trimmed;
}

const fallbackSvgMap: Record<string, string> = {
  "balata-fren": "/categories/balata-fren.svg",
  "fren": "/categories/fren-sistemi.svg",
  "fren-sistemi": "/categories/fren-sistemi.svg",
  "debriyaj": "/categories/debriyaj.svg",
  "debriyaj-sistemi": "/categories/debriyaj.svg",
  "filtreler": "/categories/filtreler.svg",
  "filtre": "/categories/filtreler.svg",
  "motor-yaglari": "/categories/motor-yaglari.svg",
  "motor-yaglari-ve-katkilar": "/categories/motor-yaglari.svg",
  "motor-parcalari": "/categories/motor-parcalari.svg",
  "suspansiyon": "/categories/suspansiyon.svg",
  "yakit-sistemi": "/categories/yakit-sistemi.svg",
};

export async function GET() {
  const categories = listCategoryTree({ includeHidden: false, isVehicleTree: false });
  return NextResponse.json({
    categories: categories.map((c) => {
      const slug = c.slug || slugify(c.name);
      const icon = sanitizeCategoryUrl(c.icon);
      const banner = sanitizeCategoryUrl(c.banner);
      const fallback = fallbackSvgMap[slug] || `/categories/fren-sistemi.svg`;
      return {
        id: c.id,
        name: c.name,
        slug,
        icon,
        banner,
        image: icon || banner || fallback,
        description: c.seoDescription || `${c.name} yedek parçaları`,
      };
    }),
  });
}
