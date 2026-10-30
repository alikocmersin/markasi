import * as cheerio from "cheerio";

export type ScrapedProduct = {
  url: string;
  name: string;
  price: number; // in kuruş
  currency: string;
  brand: string;
  sku: string;
  oemCodes: string[];
  description: string;
  specs: Record<string, string>;
  images: string[];
  inStock: boolean;
};

function parsePriceToKurus(rawPrice: string | number): number {
  if (typeof rawPrice === "number") {
    return Math.round(rawPrice * 100);
  }
  let clean = String(rawPrice).trim();
  // Strip currency symbols
  clean = clean.replace(/[₺$€TLtlUSDusdEUReur\s]/g, "");

  // Format check: 1.250,50 vs 1,250.50
  if (clean.includes(",") && clean.includes(".")) {
    const lastComma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Turkish format: 1.250,50
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: 1,250.50
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(",")) {
    clean = clean.replace(",", ".");
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

function extractOemCodes(text: string): string[] {
  const oemRegex = /\b([0-9A-Za-z]{3,6}[\s-]?[0-9A-Za-z]{3,6}(?:[\s-]?[0-9A-Za-z]{1,4})?)\b/g;
  const matches = text.match(oemRegex) || [];
  const cleanCodes = new Set<string>();
  for (const m of matches) {
    const clean = m.trim().toUpperCase();
    if (clean.length >= 6 && /\d/.test(clean) && !clean.includes("HTTP")) {
      cleanCodes.add(clean);
    }
  }
  return Array.from(cleanCodes).slice(0, 10);
}

export async function scrapeProductUrl(targetUrl: string): Promise<ScrapedProduct> {
  let urlObj: URL;
  try {
    urlObj = new URL(targetUrl);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Geçerli bir HTTP veya HTTPS linki girin.");
    }
    // SSRF protection for local network
    const host = urlObj.hostname.toLowerCase();
    if (host === "localhost" || host.startsWith("127.") || host.startsWith("192.168.") || host.startsWith("10.")) {
      throw new Error("Yerel ağ adresleri taranamamaktadır.");
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Geçersiz web adresi.");
  }

  const response = await fetch(urlObj.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Hedef siteye bağlanılamadı (${response.status}).`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  let name = "";
  let price = 0;
  let currency = "TL";
  let brand = "";
  let sku = "";
  const oemCodesSet = new Set<string>();
  let description = "";
  const specs: Record<string, string> = {};
  const imagesSet = new Set<string>();
  let inStock = true;

  // LAYER 1: JSON-LD (Schema.org)
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const json = JSON.parse($(elem).html() || "{}");
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];

      for (const item of items) {
        if (item["@type"] === "Product" || item.type === "Product") {
          if (!name && item.name) name = String(item.name).trim();
          if (!brand && item.brand) {
            brand = typeof item.brand === "object" ? item.brand.name || "" : String(item.brand);
          }
          if (!sku && item.sku) sku = String(item.sku).trim();
          if (item.mpn) oemCodesSet.add(String(item.mpn).trim());

          // Price & Stock
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offers) {
            if (!price && offers.price) {
              price = parsePriceToKurus(offers.price);
            }
            if (offers.priceCurrency) {
              currency = offers.priceCurrency === "TRY" ? "TL" : offers.priceCurrency;
            }
            if (offers.availability && String(offers.availability).includes("OutOfStock")) {
              inStock = false;
            }
          }

          // Images
          if (item.image) {
            const imgs = Array.isArray(item.image) ? item.image : [item.image];
            for (const img of imgs) {
              const src = typeof img === "object" ? img.url || img.contentUrl : img;
              if (src && typeof src === "string") imagesSet.add(new URL(src, urlObj).toString());
            }
          }

          if (!description && item.description) {
            description = String(item.description).replace(/<[^>]+>/g, " ").trim();
          }
        }
      }
    } catch {
      // continue to next layer
    }
  });

  // LAYER 2: OpenGraph & Meta Tags
  if (!name) name = $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content") || "";
  if (!description) description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
  
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) imagesSet.add(new URL(ogImage, urlObj).toString());

  if (!price) {
    const metaPrice = $('meta[property="product:price:amount"]').attr("content") || $('meta[name="price"]').attr("content");
    if (metaPrice) price = parsePriceToKurus(metaPrice);
  }

  // LAYER 3: DOM / Cheerio Scraping
  if (!name) {
    name = $("h1.product-title, h1.product-name, h1#product-name, h1, .product-detail-name").first().text().trim();
  }

  // DOM Price selectors
  if (!price) {
    const priceText = $(
      ".product-price, .current-price, .price-new, span.price, #product-price, .product-price-new, [data-price], .price"
    ).first().text().trim();
    if (priceText) price = parsePriceToKurus(priceText);
  }

  // Brand selector
  if (!brand) {
    brand = $(".product-brand, [itemprop='brand'], .brand-name, .manufacturer a").first().text().trim();
  }

  // SKU / Code selector
  if (!sku) {
    sku = $(".product-code, .sku, [itemprop='sku'], .barcode, #product-sku").first().text().replace(/[^\w-]/g, "").trim();
  }

  // Gallery Images from DOM
  $("img[data-zoom-image], img.product-image, img.gallery-image, .product-gallery img, .product-slider img, [data-image]").each((_, el) => {
    const src = $(el).attr("data-zoom-image") || $(el).attr("data-large") || $(el).attr("data-src") || $(el).attr("src");
    if (src && !src.includes("data:image") && !src.includes("icon") && !src.includes("logo")) {
      try {
        imagesSet.add(new URL(src, urlObj).toString());
      } catch {}
    }
  });

  // Technical Specs Table from DOM
  $("table.product-specifications, table.tech-specs, .product-attributes table, #product-features table, .specs-table").find("tr").each((_, row) => {
    const th = $(row).find("th, td:first-child").text().trim().replace(/:$/, "");
    const td = $(row).find("td:last-child").text().trim();
    if (th && td && th !== td) {
      specs[th] = td;
      if (/oem|orijinal\s*kod|parça\s*no/i.test(th)) {
        extractOemCodes(td).forEach(c => oemCodesSet.add(c));
      }
      if (!brand && /marka|üretici/i.test(th)) brand = td;
      if (!sku && /stok\s*kodu|ürün\s*kodu|sku/i.test(th)) sku = td;
    }
  });

  // Also search description for OEM codes
  if (description) {
    extractOemCodes(description).forEach(c => oemCodesSet.add(c));
  }

  // Final fallback cleanups
  if (!name) name = $("title").text().split(/[-|]/)[0].trim() || "Bilinmeyen Ürün";

  return {
    url: targetUrl,
    name: name.slice(0, 200),
    price,
    currency,
    brand: brand.slice(0, 60) || "Genel",
    sku: sku.slice(0, 60),
    oemCodes: Array.from(oemCodesSet),
    description: description.slice(0, 3000),
    specs,
    images: Array.from(imagesSet).slice(0, 10),
    inStock,
  };
}

export async function checkSourcePriceAndStock(sourceUrl: string): Promise<{
  currentPrice: number;
  inStock: boolean;
  checkedAt: string;
}> {
  const result = await scrapeProductUrl(sourceUrl);
  return {
    currentPrice: result.price,
    inStock: result.inStock,
    checkedAt: new Date().toISOString(),
  };
}

export type ScrapedCategoryProduct = {
  name: string;
  price: number; // in kuruş
  currency: string;
  brand: string;
  code: string;
  url: string;
  image: string;
  description: string;
};

export async function scrapeCategoryUrl(categoryUrl: string): Promise<ScrapedCategoryProduct[]> {
  let urlObj: URL;
  try {
    urlObj = new URL(categoryUrl);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Geçerli bir HTTP veya HTTPS linki girin.");
    }
    const host = urlObj.hostname.toLowerCase();
    if (host === "localhost" || host.startsWith("127.") || host.startsWith("192.168.") || host.startsWith("10.")) {
      throw new Error("Yerel ağ adresleri taranamamaktadır.");
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Geçersiz web adresi.");
  }

  const response = await fetch(urlObj.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Hedef siteye bağlanılamadı (${response.status}).`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const products: ScrapedCategoryProduct[] = [];
  const seenUrls = new Set<string>();

  // 1. Try JSON-LD ItemList
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const checkItemList = (obj: any) => {
        if (!obj) return;
        if (obj["@type"] === "ItemList" && Array.isArray(obj.itemListElement)) {
          for (const item of obj.itemListElement) {
            const p = item.item || item;
            const pName = p.name || p.title;
            if (pName) {
              const pPrice = p.offers?.price || p.offers?.lowPrice || p.price || 0;
              const pImg = typeof p.image === "string" ? p.image : Array.isArray(p.image) ? p.image[0] : "";
              const pUrl = p.url ? new URL(p.url, urlObj.origin).toString() : "";
              const pBrand = p.brand?.name || p.brand || "";
              const pSku = p.sku || p.mpn || "";
              if (!seenUrls.has(pUrl || pName)) {
                seenUrls.add(pUrl || pName);
                products.push({
                  name: String(pName).trim().slice(0, 200),
                  price: parsePriceToKurus(pPrice),
                  currency: "TL",
                  brand: String(pBrand).trim().slice(0, 60) || "Genel",
                  code: String(pSku).trim().slice(0, 60) || `PRD-${Date.now().toString(36).toUpperCase()}-${products.length + 1}`,
                  url: pUrl,
                  image: pImg ? new URL(pImg, urlObj.origin).toString() : "",
                  description: String(p.description || "").trim().slice(0, 1000),
                });
              }
            }
          }
        }
      };
      checkItemList(data);
      if (Array.isArray(data)) {
        for (const d of data) checkItemList(d);
      }
    } catch {}
  });

  if (products.length >= 3) {
    return products.slice(0, 40);
  }

  // 2. DOM Parsing for Product Cards
  const cardSelectors = [
    ".product-item",
    ".product-card",
    ".productCard",
    ".productItem",
    ".product-box",
    ".productBox",
    ".catalog-item",
    ".showcase-item",
    ".item-box",
    "article.product",
    "[data-product-id]",
    ".product",
    ".products > div",
    ".product-list > li",
    ".product-grid > div",
  ];

  for (const selector of cardSelectors) {
    if ($(selector).length >= 2) {
      $(selector).each((_, el) => {
        const card = $(el);
        let name = card
          .find("h2, h3, h4, .title, .product-title, .name, .product-name, [class*='title'], [class*='name']")
          .first()
          .text()
          .trim();
        if (!name) {
          name = card.find("a[title]").first().attr("title")?.trim() || "";
        }
        if (!name) {
          name = card.find("img[alt]").first().attr("alt")?.trim() || "";
        }
        if (!name || name.length < 3) return;

        const href = card.find("a[href]").first().attr("href");
        const fullUrl = href ? new URL(href, urlObj.origin).toString() : "";
        if (fullUrl && seenUrls.has(fullUrl)) return;
        if (fullUrl) seenUrls.add(fullUrl);

        const img = card.find("img[src], img[data-src], img[data-original], img[srcset]").first();
        let imgSrc = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
        if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;
        else if (imgSrc.startsWith("/")) imgSrc = new URL(imgSrc, urlObj.origin).toString();

        let priceText = card.find("[class*='price'], [class*='fiyat'], .current-price, .sale-price").first().text().trim();
        if (!priceText) {
          priceText = card.text();
        }
        const kurusPrice = parsePriceToKurus(priceText);

        const brand = card.find("[class*='brand'], [class*='marka']").first().text().trim() || "Genel";
        let code = card.find("[class*='sku'], [class*='code'], [class*='kod']").first().text().trim();
        if (!code && fullUrl) {
          const slugPart = fullUrl.split("/").pop()?.replace(/\.html?$/i, "") || "";
          code =
            slugPart.slice(0, 30).toUpperCase().replace(/[^A-Z0-9-]/g, "") ||
            `PRD-${Date.now().toString(36).toUpperCase()}-${products.length + 1}`;
        }

        const desc = card.find("[class*='desc'], [class*='ozet'], p").first().text().trim();

        products.push({
          name: name.slice(0, 200),
          price: kurusPrice,
          currency: "TL",
          brand: brand.slice(0, 60),
          code: code.slice(0, 60),
          url: fullUrl,
          image: imgSrc,
          description: desc.slice(0, 1000),
        });
      });

      if (products.length >= 2) break;
    }
  }

  return products.slice(0, 50);
}

