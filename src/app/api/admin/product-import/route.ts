import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { readJsonObject } from "@/lib/request";

const maximumHtmlBytes = 2 * 1024 * 1024;
const maximumProducts = 20;
const maximumRedirects = 3;
const allowedRedirectStatuses = new Set([301, 302, 303, 307, 308]);

type ImportedProduct = {
  brand: string;
  name: string;
  code: string;
  category: string;
  fitment: string;
  price: number;
  currency: string;
};

function allowedHosts() {
  return (process.env.PRODUCT_IMPORT_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function validateSourceUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    isIP(host) ||
    !host.includes(".") ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    !allowedHosts().includes(host)
  ) {
    throw new Error(
      "Bağlantı güvenlik nedeniyle kabul edilmedi. HTTPS adresi kullanın ve alan adını PRODUCT_IMPORT_ALLOWED_HOSTS ayarına ekleyin.",
    );
  }
  url.hash = "";
  return url;
}

async function readHtml(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.toLowerCase().includes("text/html") &&
    !contentType.toLowerCase().includes("application/xhtml+xml")
  ) {
    throw new Error("Bağlantı bir HTML ürün veya kategori sayfası olmalıdır.");
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > maximumHtmlBytes) {
    throw new Error("Kaynak sayfa 2 MB sınırını aşıyor.");
  }
  if (!response.body) throw new Error("Kaynak sayfa içeriği boş.");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumHtmlBytes) {
        await reader.cancel();
        throw new Error("Kaynak sayfa 2 MB sınırını aşıyor.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchProductPage(input: URL) {
  let url = validateSourceUrl(input.toString());
  for (let redirects = 0; redirects <= maximumRedirects; redirects += 1) {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "MarkasiProductImporter/1.0",
      },
    });
    if (allowedRedirectStatuses.has(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirects === maximumRedirects) {
        throw new Error("Kaynak sayfa yönlendirme sınırını aştı.");
      }
      url = validateSourceUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) {
      throw new Error(`Kaynak sayfa açılamadı (HTTP ${response.status}).`);
    }
    return { html: await readHtml(response), url };
  }
  throw new Error("Kaynak sayfa açılamadı.");
}

function plainText(value: unknown, maximumLength = 500) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function readBrand(value: unknown) {
  if (typeof value === "string") return plainText(value, 80);
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return plainText((value as Record<string, unknown>).name, 80);
}

function readOffer(value: unknown) {
  const offer = Array.isArray(value) ? value[0] : value;
  if (!offer || typeof offer !== "object") {
    return { price: 0, currency: "" };
  }
  const data = offer as Record<string, unknown>;
  const rawPrice = data.price ?? data.lowPrice;
  const parsedPrice =
    typeof rawPrice === "number"
      ? rawPrice
      : typeof rawPrice === "string"
        ? Number(rawPrice.replace(",", "."))
        : 0;
  const currency = plainText(data.priceCurrency, 3).toUpperCase();
  return {
    price:
      Number.isFinite(parsedPrice) &&
      parsedPrice >= 0 &&
      parsedPrice <= 10_000_000 &&
      (!currency || currency === "TRY" || currency === "TL")
        ? parsedPrice
        : 0,
    currency,
  };
}

function productFromStructuredData(value: Record<string, unknown>) {
  const brand = readBrand(value.brand);
  const name = plainText(value.name, 120);
  const code = plainText(
    value.sku ?? value.mpn ?? value.productID ?? value.gtin13 ?? value.gtin,
    80,
  );
  if (name.length < 2 || code.length < 2) return null;
  const offer = readOffer(value.offers);
  const category = Array.isArray(value.category)
    ? plainText(value.category[0], 60)
    : plainText(value.category, 60);
  return {
    brand: brand || "Marka belirtilmemiş",
    name,
    code,
    category: category || "Genel",
    fitment: plainText(value.vehicleFitment ?? value.description, 200),
    ...offer,
  } satisfies ImportedProduct;
}

function collectStructuredData(value: unknown, products: ImportedProduct[], links: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStructuredData(item, products, links);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const types = Array.isArray(record["@type"])
    ? record["@type"]
    : [record["@type"]];
  const normalizedTypes = types.filter(
    (type): type is string => typeof type === "string",
  ).map((type) => type.toLowerCase().split(/[\/#]/).at(-1));
  if (normalizedTypes.includes("product")) {
    const product = productFromStructuredData(record);
    if (product) products.push(product);
    return;
  }
  if (normalizedTypes.includes("itemlist")) {
    const entries = Array.isArray(record.itemListElement)
      ? record.itemListElement
      : [];
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const listItem = entry as Record<string, unknown>;
      const item = listItem.item;
      if (typeof item === "string") links.add(item);
      else if (item && typeof item === "object" && !Array.isArray(item)) {
        const itemRecord = item as Record<string, unknown>;
        if (typeof itemRecord.url === "string") links.add(itemRecord.url);
        else if (typeof itemRecord["@id"] === "string") {
          links.add(itemRecord["@id"]);
        }
        collectStructuredData(item, products, links);
      } else if (typeof listItem.url === "string") {
        links.add(listItem.url);
      }
    }
  }
  for (const key of ["@graph", "mainEntity", "hasPart"]) {
    if (record[key]) collectStructuredData(record[key], products, links);
  }
}

function findProducts(html: string) {
  const products: ImportedProduct[] = [];
  const productLinks = new Set<string>();
  const scriptPattern =
    /<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script\s*>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const source = match[1]?.trim();
    if (!source || source.length > maximumHtmlBytes) continue;
    try {
      collectStructuredData(JSON.parse(source) as unknown, products, productLinks);
    } catch {
      continue;
    }
  }
  const uniqueProducts = new Map<string, ImportedProduct>();
  for (const product of products) {
    const key = product.code.replace(/[\s-]/g, "").toLocaleLowerCase("en-US");
    if (key && !uniqueProducts.has(key)) uniqueProducts.set(key, product);
  }
  return { products: [...uniqueProducts.values()], productLinks };
}

async function previewProducts(url: URL, categoryMode: boolean) {
  const firstPage = await fetchProductPage(url);
  const first = findProducts(firstPage.html);
  const products = [...first.products];
  if (categoryMode && products.length === 0) {
    const links = [...first.productLinks]
      .slice(0, maximumProducts)
      .map((link) => validateSourceUrl(new URL(link, firstPage.url).toString()));
    for (let index = 0; index < links.length; index += 5) {
      const batch = links.slice(index, index + 5);
      const results = await Promise.all(
        batch.map(async (productUrl) => {
          try {
            const page = await fetchProductPage(productUrl);
            return findProducts(page.html).products;
          } catch {
            return [];
          }
        }),
      );
      for (const result of results) products.push(...result);
      if (products.length >= maximumProducts) break;
    }
  }
  const uniqueProducts = new Map<string, ImportedProduct>();
  for (const product of products) {
    const key = product.code.replace(/[\s-]/g, "").toLocaleLowerCase("en-US");
    if (key && !uniqueProducts.has(key)) uniqueProducts.set(key, product);
  }
  const database = getDatabase();
  const existingCodes = database
    .prepare("SELECT code FROM products")
    .all() as Array<{ code: string }>;
  const existing = new Set(
    existingCodes.map((item) =>
      item.code.replace(/[\s-]/g, "").toLocaleLowerCase("en-US"),
    ),
  );
  return [...uniqueProducts.values()]
    .slice(0, maximumProducts)
    .map((product) => ({
      ...product,
      duplicate: existing.has(
        product.code.replace(/[\s-]/g, "").toLocaleLowerCase("en-US"),
      ),
    }));
}

function parseProducts(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximumProducts) {
    return null;
  }
  const products = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const row = entry as Record<string, unknown>;
    const brand = plainText(row.brand, 80);
    const name = plainText(row.name, 120);
    const code = plainText(row.code, 80);
    const category = plainText(row.category, 60);
    const fitment = plainText(row.fitment, 200);
    const kind = row.kind;
    const price = row.price;
    const cost = row.cost;
    const centralStock = row.centralStock;
    const shelf = plainText(row.shelf, 30);
    if (
      brand.length < 2 ||
      name.length < 2 ||
      code.length < 2 ||
      !category ||
      !["OEM", "Eşdeğer"].includes(String(kind)) ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 10_000_000 ||
      typeof cost !== "number" ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      cost > 10_000_000 ||
      typeof centralStock !== "number" ||
      !Number.isInteger(centralStock) ||
      centralStock < 0 ||
      centralStock > 1_000_000 ||
      !shelf
    ) {
      return null;
    }
    products.push({
      brand,
      name,
      code,
      category,
      fitment,
      kind,
      price: Math.round(price * 100),
      cost: Math.round(cost * 100),
      centralStock,
      shelf,
    });
  }
  return products;
}

export async function POST(request: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 100_000) {
    return NextResponse.json(
      { error: "Ürün aktarım isteği beklenenden büyük." },
      { status: 413 },
    );
  }
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Geçerli bir istek gönderin." }, { status: 400 });
  }

  if (body.action === "import") {
    const products = parseProducts(body.products);
    if (!products) {
      return NextResponse.json(
        { error: "İçe aktarılacak ürün bilgilerini kontrol edin (en fazla 20 ürün)." },
        { status: 400 },
      );
    }
    const database = getDatabase();
    const existingCodes = new Set(
      (database.prepare("SELECT code FROM products").all() as Array<{
        code: string;
      }>).map((item) =>
        item.code.replace(/[\s-]/g, "").toLocaleLowerCase("en-US"),
      ),
    );
    const seenCodes = new Set<string>();
    let importedCount = 0;
    let duplicateCount = 0;
    const insertProduct = database.prepare(
      `INSERT INTO products
       (id, brand, name, code, kind, category, price, cost, central_stock, shelf, fitment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const importBatch = database.transaction(() => {
      for (const product of products) {
        const normalizedCode = product.code
          .replace(/[\s-]/g, "")
          .toLocaleLowerCase("en-US");
        if (existingCodes.has(normalizedCode) || seenCodes.has(normalizedCode)) {
          duplicateCount += 1;
          continue;
        }
        insertProduct.run(
          randomUUID(),
          product.brand,
          product.name,
          product.code,
          product.kind,
          product.category,
          product.price,
          product.cost,
          product.centralStock,
          product.shelf,
          product.fitment,
        );
        seenCodes.add(normalizedCode);
        importedCount += 1;
      }
    });
    try {
      importBatch.immediate();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed: products.code")
      ) {
        return NextResponse.json(
          { error: "İçe aktarma sırasında bir ürün kodu çakıştı. Listeyi yenileyip tekrar deneyin." },
          { status: 409 },
        );
      }
      throw error;
    }
    return NextResponse.json({ importedCount, duplicateCount });
  }

  if (body.action !== "preview") {
    return NextResponse.json({ error: "İşlem türü geçersiz." }, { status: 400 });
  }
  if (allowedHosts().length === 0) {
    return NextResponse.json(
      {
        error:
          "Ürün bağlantısı aktarımı kapalı: .env.local dosyasındaki PRODUCT_IMPORT_ALLOWED_HOSTS alanına yalnızca ürünlerini içe aktarma izniniz olan tedarikçi alan adlarını ekleyin (ör. PRODUCT_IMPORT_ALLOWED_HOSTS=tedarikci.example). Ardından geliştirme sunucusunu yeniden başlatın.",
      },
      { status: 503 },
    );
  }
  if (
    typeof body.url !== "string" ||
    body.url.length > 2048 ||
    typeof body.sourceType !== "string" ||
    !["product", "category"].includes(body.sourceType) ||
    !body.url.trim()
  ) {
    return NextResponse.json(
      { error: "Geçerli bir ürün veya kategori bağlantısı girin." },
      { status: 400 },
    );
  }
  try {
    const sourceUrl = validateSourceUrl(body.url);
    const products = await previewProducts(
      sourceUrl,
      body.sourceType === "category",
    );
    if (products.length === 0) {
      return NextResponse.json(
        {
          error:
            "Bağlantıda aktarılabilir ürün bulunamadı. Kaynak sayfada schema.org Product bilgisi bulunmalı; kategori sayfaları için ItemList ürün listesi kullanılmalıdır.",
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ürün bağlantısı okunamadı. Kaynağı kontrol edip tekrar deneyin.",
      },
      { status: 400 },
    );
  }
}
