import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { readJsonObject } from "@/lib/request";
import { checkSourcePriceAndStock, scrapeCategoryUrl, scrapeProductUrl } from "@/lib/scraper";
import { recordAuditLog } from "@/lib/db";

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const action = String(body.action || "scrape");

  if (action === "scrape-category") {
    const url = String(body.url || "").trim();
    if (!url) {
      return NextResponse.json({ error: "Lütfen bir kategori bağlantısı girin." }, { status: 400 });
    }
    try {
      const items = await scrapeCategoryUrl(url);
      recordAuditLog(
        admin.email,
        "SCRAPE_CATEGORY",
        "Category",
        url,
        `${items.length} adet ürün çekildi.`
      );
      return NextResponse.json({ success: true, items });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Kategori ürünleri çekilemedi." },
        { status: 502 },
      );
    }
  }

  if (action === "check-sync") {
    const sourceUrl = String(body.sourceUrl || "").trim();
    if (!sourceUrl) {
      return NextResponse.json({ error: "Kaynak URL belirtilmedi." }, { status: 400 });
    }
    try {
      const syncResult = await checkSourcePriceAndStock(sourceUrl);
      return NextResponse.json(syncResult);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Kaynak kontrol edilemedi." },
        { status: 502 },
      );
    }
  }

  const url = String(body.url || "").trim();
  if (!url) {
    return NextResponse.json({ error: "Lütfen bir ürün bağlantısı girin." }, { status: 400 });
  }

  const markupPercent = Number(body.markupPercent || 0);
  const markupAmount = Number(body.markupAmount || 0); // in kurus

  try {
    const scraped = await scrapeProductUrl(url);

    // Calculate suggested sale price
    let calculatedPrice = scraped.price;
    if (markupPercent > 0) {
      calculatedPrice = Math.round(calculatedPrice * (1 + markupPercent / 100));
    }
    if (markupAmount > 0) {
      calculatedPrice += markupAmount;
    }

    recordAuditLog(
      admin.email,
      "SCRAPE_PRODUCT",
      "Product",
      url,
      `Başarıyla çekildi: ${scraped.name} (Fiyat: ${(scraped.price / 100).toFixed(2)} TL)`,
    );

    return NextResponse.json({
      ...scraped,
      calculatedPrice,
      markupPercent,
      markupAmount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ürün bilgileri çekilemedi." },
      { status: 502 },
    );
  }
}

