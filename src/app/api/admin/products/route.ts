import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  bulkImportProducts,
  bulkUpdatePrices,
  duplicateProduct,
  findCrossOemEquivalents,
  getDatabase,
  listProducts,
  recordAuditLog,
  setBrandVisibility,
  updateProduct,
  updateProductInline,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Template CSV Download
  if (searchParams.get("template") === "csv") {
    const csvContent = "\uFEFF" + [
      "Stok Kodu;Ürün Adı;Marka;Kategori;Fiyat;Maliyet;Merkez Stok;Koridor;Raf;Göz;Desi;Barkod;OEM Kodları",
      "04E 115 561 H;Yağ Filtresi (Örnek);MANN-FILTER;Filtreler;385.00;248.00;18;A;04;12;1.2;4011558021458;04E115561H,04E115561D",
      "5Q0 698 151 F;Ön Fren Balata Takımı (Örnek);ATE;Balata-Fren;2490.00;1760.00;7;B;02;05;2.5;4006632483109;5Q0698151F",
    ].join("\n");
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="markasi-ornek-urun-sablonu.csv"',
      },
    });
  }

  // Cross OEM lookup
  const crossOem = searchParams.get("crossOem");
  if (crossOem) {
    const excludeId = searchParams.get("excludeId") || undefined;
    const equivalents = findCrossOemEquivalents(crossOem, excludeId);
    return NextResponse.json({ equivalents });
  }

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const criticalOnly = searchParams.get("critical") === "1";
  const shelf = searchParams.get("shelf") || "";
  const corridor = searchParams.get("corridor") || "";

  const products = listProducts({
    query,
    category,
    includeCosts: true,
    includeHiddenBrands: true,
    includeHiddenCategories: true,
    criticalOnly,
    shelf,
    corridor,
  });

  // Handle CSV Export
  if (searchParams.get("export") === "csv") {
    const headers = [
      "ID",
      "Stok Kodu",
      "Ürün Adı",
      "Marka",
      "Kategori",
      "OEM Kodları",
      "Fiyat (TL)",
      "Maliyet (TL)",
      "Merkez Stok",
      "Koridor",
      "Raf",
      "Göz",
      "Desi",
      "Barkod",
      "Para Birimi",
    ];
    const rows = products.map((p) => [
      p.id,
      p.code,
      `"${p.name.replace(/"/g, '""')}"`,
      p.brand,
      p.category,
      `"${(p.oemCodes || []).join(", ")}"`,
      (p.price / 100).toFixed(2),
      (p.cost / 100).toFixed(2),
      p.centralStock,
      p.corridor || "",
      p.shelf || "",
      p.bin || "",
      p.desi || 1,
      p.barcode || "",
      p.currency || "TL",
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="markasi-urun-katalogu-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Geçerli bir istek gönderin." }, { status: 400 });
  }

  // Handle Product Duplicate
  if (body.action === "duplicate" && body.id) {
    const newId = duplicateProduct(String(body.id));
    if (!newId) {
      return NextResponse.json({ error: "Ürün kopyalanamadı." }, { status: 404 });
    }
    recordAuditLog(admin.email, "DUPLICATE_PRODUCT", "Product", newId, `Ürün kopyalandı: ${body.id}`);
    return NextResponse.json({ success: true, id: newId });
  }

  // Handle Bulk Import
  if (body.action === "bulk_import") {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "İçe aktarılacak ürün listesi boş." }, { status: 400 });
    }
    const result = bulkImportProducts(body.items, body.autoCreateCategory !== false);
    recordAuditLog(
      admin.email,
      "BULK_IMPORT_PRODUCTS",
      "Product",
      "MULTIPLE",
      `${result.inserted} yeni ürün eklendi, ${result.updated} ürün güncellendi.`
    );
    return NextResponse.json({ success: true, ...result });
  }
  // Handle Brand Visibility toggle (legacy)
  if (body.action === "visibility" && body.brand !== undefined) {
    const brand = String(body.brand).trim();
    const visible = Boolean(body.visible);
    setBrandVisibility(brand, visible);
    recordAuditLog(admin.email, "VISIBILITY_BRAND", "Brand", brand, `Görünürlük: ${visible}`);
    return NextResponse.json({ success: true });
  }

  const name = String(body.name || "").trim().slice(0, 200);
  const brand = String(body.brand || "").trim().slice(0, 80);
  const code = String(body.code || "").trim().slice(0, 60);
  const category = String(body.category || "").trim().slice(0, 80);
  const kind = body.kind === "OEM" ? "OEM" : "Eşdeğer";

  const price = typeof body.price === "number" ? Math.round(body.price * 100) : 0;
  const cost = typeof body.cost === "number" ? Math.round(body.cost * 100) : 0;
  const centralStock = typeof body.centralStock === "number" ? Math.max(0, Math.floor(body.centralStock)) : 0;

  if (name.length < 2 || brand.length < 1 || code.length < 2 || category.length < 1) {
    return NextResponse.json({ error: "Lütfen ürün adı, parça kodu, marka ve kategori alanlarını doldurun." }, { status: 400 });
  }

  const database = getDatabase();
  const productId = `prod-${randomUUID().slice(0, 12)}`;

  try {
    database.transaction(() => {
      database
        .prepare(`
          INSERT INTO products (
            id, brand, name, code, kind, category, price, cost, central_stock,
            shelf, fitment, sku, barcode, oem_codes, manufacturer_brand,
            condition, warranty_months, desi, weight_kg, corridor, bin,
            discount_price, currency, vat_rate, source_url, source_last_price,
            description, specs_json, compatible_vehicles, position, has_core_deposit, core_deposit_price
          ) VALUES (
            @id, @brand, @name, @code, @kind, @category, @price, @cost, @centralStock,
            @shelf, @fitment, @sku, @barcode, @oemCodes, @manufacturerBrand,
            @condition, @warrantyMonths, @desi, @weightKg, @corridor, @bin,
            @discountPrice, @currency, @vatRate, @sourceUrl, @sourceLastPrice,
            @description, @specsJson, @compatibleVehicles, @position, @hasCoreDeposit, @coreDepositPrice
          )
        `)
        .run({
          id: productId,
          brand,
          name,
          code,
          kind,
          category,
          price,
          cost,
          centralStock,
          shelf: String(body.shelf || "").trim(),
          fitment: String(body.fitment || "").trim(),
          sku: String(body.sku || code).trim(),
          barcode: String(body.barcode || "").trim(),
          oemCodes: JSON.stringify(Array.isArray(body.oemCodes) ? body.oemCodes : [code]),
          manufacturerBrand: String(body.manufacturerBrand || brand).trim(),
          condition: ["Sıfır", "Çıkma", "Yenilenmiş"].includes(String(body.condition)) ? body.condition : "Sıfır",
          warrantyMonths: typeof body.warrantyMonths === "number" ? body.warrantyMonths : 12,
          desi: typeof body.desi === "number" ? body.desi : 1.0,
          weightKg: typeof body.weightKg === "number" ? body.weightKg : 1.0,
          corridor: String(body.corridor || "").trim(),
          bin: String(body.bin || "").trim(),
          discountPrice: typeof body.discountPrice === "number" ? Math.round(body.discountPrice * 100) : 0,
          currency: ["TL", "USD", "EUR"].includes(String(body.currency)) ? body.currency : "TL",
          vatRate: typeof body.vatRate === "number" ? body.vatRate : 20,
          sourceUrl: String(body.sourceUrl || "").trim(),
          sourceLastPrice: typeof body.sourceLastPrice === "number" ? body.sourceLastPrice : cost,
          description: String(body.description || "").trim(),
          specsJson: JSON.stringify(body.specs && typeof body.specs === "object" ? body.specs : {}),
          compatibleVehicles: JSON.stringify(Array.isArray(body.compatibleVehicles) ? body.compatibleVehicles : []),
          position: String(body.position || "Yönsüz / Evrensel").trim(),
          hasCoreDeposit: body.hasCoreDeposit ? 1 : 0,
          coreDepositPrice: typeof body.coreDepositPrice === "number" ? Math.round(body.coreDepositPrice * 100) : 0,
        });

      // Images
      if (Array.isArray(body.images)) {
        const insertImg = database.prepare(`
          INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)
        `);
        body.images.forEach((imgUrl: string, idx: number) => {
          if (typeof imgUrl === "string" && imgUrl.trim()) {
            insertImg.run(productId, imgUrl.trim(), idx, idx === 0 ? 1 : 0);
          }
        });
      }

      // Suppliers
      if (Array.isArray(body.suppliers)) {
        const insertSup = database.prepare(`
          INSERT INTO supplier_stock (product_id, supplier, quantity, delivery, purchase_price) VALUES (?, ?, ?, ?, ?)
        `);
        for (const s of body.suppliers) {
          if (s && s.supplier && typeof s.quantity === "number") {
            insertSup.run(productId, String(s.supplier), s.quantity, String(s.delivery || "1-2 iş günü"), s.purchasePrice ? Math.round(s.purchasePrice * 100) : cost);
          }
        }
      }
    })();

    recordAuditLog(admin.email, "CREATE_PRODUCT", "Product", productId, `${name} (${code}) oluşturuldu.`);
    return NextResponse.json({ success: true, id: productId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: products.code")) {
      return NextResponse.json({ error: "Bu parça kodu zaten kullanımda." }, { status: 409 });
    }
    const errMsg = error instanceof Error ? error.message : "Ürün eklenirken hata oluştu.";
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// Inline update, detailed update, and bulk operations
export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Geçerli bir istek gönderin." }, { status: 400 });
  }

  // Handle bulk action in PATCH as well
  if (body.bulkAction === "percentage" || typeof body.percentageChange === "number" || typeof body.percentage === "number") {
    const rawPct = typeof body.percentageChange === "number" ? body.percentageChange : Number(body.percentage || 0);
    const percentageChange = body.type === "decrease" ? -Math.abs(rawPct) : rawPct;
    const applyTo = ["price", "cost", "both"].includes(String(body.applyTo)) ? (body.applyTo as "price" | "cost" | "both") : "price";
    const category = body.category ? String(body.category).trim() : undefined;
    const brand = body.brand ? String(body.brand).trim() : undefined;

    const affectedCount = bulkUpdatePrices({
      percentageChange,
      applyTo,
      category,
      brand,
    });

    recordAuditLog(
      admin.email,
      "BULK_PRICE_UPDATE",
      "Product",
      "MULTIPLE",
      `%${percentageChange} değişim uygulandı (${affectedCount} ürün etkilendi).`,
    );

    return NextResponse.json({ success: true, affectedCount });
  }

  const productId = String(body.productId || body.id || "").trim();
  if (!productId) {
    return NextResponse.json({ error: "Ürün ID belirtilmedi." }, { status: 400 });
  }

  // Handle Full Product Update
  if (body.action === "full_update" || body.name || body.category) {
    const updated = updateProduct(productId, {
      name: body.name ? String(body.name).trim() : undefined,
      brand: body.brand ? String(body.brand).trim() : undefined,
      code: body.code ? String(body.code).trim() : undefined,
      kind: body.kind === "OEM" ? "OEM" : body.kind === "Eşdeğer" ? "Eşdeğer" : undefined,
      category: body.category ? String(body.category).trim() : undefined,
      price: typeof body.price === "number" ? Math.round(body.price * 100) : undefined,
      cost: typeof body.cost === "number" ? Math.round(body.cost * 100) : undefined,
      centralStock: typeof body.centralStock === "number" ? Math.max(0, Math.floor(body.centralStock)) : undefined,
      shelf: typeof body.shelf === "string" ? body.shelf.trim() : undefined,
      corridor: typeof body.corridor === "string" ? body.corridor.trim() : undefined,
      bin: typeof body.bin === "string" ? body.bin.trim() : undefined,
      fitment: typeof body.fitment === "string" ? body.fitment.trim() : undefined,
      sku: typeof body.sku === "string" ? body.sku.trim() : undefined,
      barcode: typeof body.barcode === "string" ? body.barcode.trim() : undefined,
      oemCodes: Array.isArray(body.oemCodes) ? body.oemCodes : undefined,
      manufacturerBrand: typeof body.manufacturerBrand === "string" ? body.manufacturerBrand.trim() : undefined,
      condition: ["Sıfır", "Çıkma", "Yenilenmiş"].includes(String(body.condition)) ? (body.condition as "Sıfır" | "Çıkma" | "Yenilenmiş") : undefined,
      warrantyMonths: typeof body.warrantyMonths === "number" ? body.warrantyMonths : undefined,
      desi: typeof body.desi === "number" ? body.desi : undefined,
      weightKg: typeof body.weightKg === "number" ? body.weightKg : undefined,
      discountPrice: typeof body.discountPrice === "number" ? Math.round(body.discountPrice * 100) : undefined,
      currency: ["TL", "USD", "EUR"].includes(String(body.currency)) ? (body.currency as "TL" | "USD" | "EUR") : undefined,
      vatRate: typeof body.vatRate === "number" ? body.vatRate : undefined,
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      specsJson: body.specs ? JSON.stringify(body.specs) : undefined,
      images: Array.isArray(body.images) ? body.images : undefined,
      compatibleVehicles: Array.isArray(body.compatibleVehicles) ? body.compatibleVehicles : undefined,
      position: typeof body.position === "string" ? body.position.trim() : undefined,
      hasCoreDeposit: typeof body.hasCoreDeposit === "boolean" ? body.hasCoreDeposit : undefined,
      coreDepositPrice: typeof body.coreDepositPrice === "number" ? Math.round(body.coreDepositPrice * 100) : undefined,
    });

    if (updated) {
      recordAuditLog(admin.email, "FULL_UPDATE_PRODUCT", "Product", productId, `Ürün tam güncellendi: ${body.name || productId}`);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Ürün güncellenemedi." }, { status: 400 });
  }

  const updated = updateProductInline(productId, {
    centralStock: typeof body.centralStock === "number" ? body.centralStock : undefined,
    price: typeof body.price === "number" ? Math.round(body.price * 100) : undefined,
    cost: typeof body.cost === "number" ? Math.round(body.cost * 100) : undefined,
    shelf: typeof body.shelf === "string" ? body.shelf : undefined,
    corridor: typeof body.corridor === "string" ? body.corridor : undefined,
    bin: typeof body.bin === "string" ? body.bin : undefined,
    fitment: typeof body.fitment === "string" ? body.fitment : undefined,
  });

  if (updated) {
    recordAuditLog(admin.email, "INLINE_UPDATE_PRODUCT", "Product", productId, JSON.stringify(body));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Ürün güncellenemedi." }, { status: 400 });
}

// Bulk Price Operations
export async function PUT(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  if (!body || typeof body.percentageChange !== "number") {
    return NextResponse.json({ error: "Geçerli bir yüzde oranı girin." }, { status: 400 });
  }

  const percentageChange = body.percentageChange;
  const applyTo = ["price", "cost", "both"].includes(String(body.applyTo)) ? (body.applyTo as "price" | "cost" | "both") : "price";
  const category = body.category ? String(body.category).trim() : undefined;
  const brand = body.brand ? String(body.brand).trim() : undefined;

  const affectedCount = bulkUpdatePrices({
    percentageChange,
    applyTo,
    category,
    brand,
  });

  recordAuditLog(
    admin.email,
    "BULK_PRICE_UPDATE",
    "Product",
    "MULTIPLE",
    `%${percentageChange} değişim uygulandı (${affectedCount} ürün etkilendi).`,
  );

  return NextResponse.json({ success: true, affectedCount });
}

export async function DELETE(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");
  if (!id) {
    const body = await readJsonObject(request);
    if (body) {
      id = String(body.id || body.productId || "");
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Silinecek ürün ID'si gerekli." }, { status: 400 });
  }

  const res = getDatabase().prepare("DELETE FROM products WHERE id = ?").run(id);
  if (res.changes > 0) {
    recordAuditLog(admin.email, "DELETE_PRODUCT", "Product", id, `Ürün silindi.`);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
}
