import { listCategoryTree, listCmsPages, listProducts } from "@/lib/db";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const products = listProducts({ limit: 1000 });
  const categories = listCategoryTree();
  const pages = listCmsPages();

  const staticUrls = [
    `${origin}`,
    `${origin}/account`,
  ];

  const categoryUrls = categories.map((c) => `${origin}/?category=${encodeURIComponent(c.name)}`);
  const pageUrls = pages.map((p) => `${origin}/sayfa/${p.slug}`);
  const productUrls = products.map((p) => `${origin}/#${p.id}`);

  const allUrls = [...staticUrls, ...categoryUrls, ...pageUrls, ...productUrls];

  const urlElements = allUrls
    .map(
      (url) => `
    <url>
      <loc>${url}</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`,
    )
    .join("");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlElements}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

