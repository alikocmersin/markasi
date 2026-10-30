import { listProducts } from "@/lib/db";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const products = listProducts({ limit: 5000 });

  const xmlItems = products.map((p) => {
    const link = `${origin}/#${p.id}`;
    const priceFormatted = (p.price / 100).toFixed(2);
    const inStock = p.centralStock > 0 ? "in_stock" : "out_of_stock";
    const image = p.images && p.images.length > 0 ? p.images[0] : `${origin}/markasi-icon.svg`;

    return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name} - ${p.brand}]]></g:title>
      <g:description><![CDATA[${p.brand} ${p.code} ${p.name}. Uyumluluk: ${p.fitment}]]></g:description>
      <g:link>${link}</g:link>
      <g:image_link>${image}</g:image_link>
      <g:brand><![CDATA[${p.brand}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${inStock}</g:availability>
      <g:price>${priceFormatted} TRY</g:price>
      <g:mpn>${p.code}</g:mpn>
      <g:product_type><![CDATA[${p.category}]]></g:product_type>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Markasi Otomotiv Ürün Kataloğu</title>
    <link>${origin}</link>
    <description>Oto Yedek Parça XML Feed (Google Merchant / Akakçe / Cimri)</description>
    ${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

