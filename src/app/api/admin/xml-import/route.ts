import { XMLParser, XMLValidator } from "fast-xml-parser";
import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

const maximumFileBytes = 2 * 1024 * 1024;
const fieldAliases = {
  code: new Set([
    "oem",
    "oemno",
    "oemnumber",
    "code",
    "sku",
    "stockcode",
    "partno",
    "partnumber",
    "itemcode",
    "parca",
    "parcakodu",
    "parcanumarasi",
  ]),
  quantity: new Set([
    "stock",
    "qty",
    "quantity",
    "available",
    "availableqty",
    "stockquantity",
    "quantityavailable",
    "adet",
    "stok",
    "stokadet",
    "miktar",
  ]),
  price: new Set([
    "price",
    "unitprice",
    "purchaseprice",
    "supplierprice",
    "alisfiyati",
    "tedarikfiyati",
  ]),
};

type FeedRow = { code: string; quantity: number; price?: number };

function normalizedKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function scalar(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const textEntry = Object.entries(value).find(
      ([key]) => normalizedKey(key) === "text",
    );
    if (textEntry) return scalar(textEntry[1]);
  }
  return null;
}

function readField(
  row: Record<string, unknown>,
  aliases: Set<string>,
): string | null {
  for (const [key, value] of Object.entries(row)) {
    if (!aliases.has(normalizedKey(key))) continue;
    const result = scalar(value);
    if (result) return result;
  }
  return null;
}

function parseQuantity(value: string) {
  let normalized = value.replace(/\s/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/[.,]/g, "");
  } else if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : null;
}

function parseMoney(value: string) {
  let normalized = value.replace(/[^\d.,-]/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    const decimalSeparator =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".") ? "," : ".";
    const groupingSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized
      .split(groupingSeparator)
      .join("")
      .replace(decimalSeparator, ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "");
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) {
    return null;
  }
  const kurus = Math.round(amount * 100);
  return Number.isSafeInteger(kurus) ? kurus : null;
}

function collectRows(value: unknown, rows: FeedRow[]) {
  if (rows.length > 5000) return;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (rows.length > 5000) break;
      collectRows(item, rows);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const code = readField(record, fieldAliases.code);
  const quantity = readField(record, fieldAliases.quantity);
  if (code && quantity) {
    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity !== null) {
      const rawPrice = readField(record, fieldAliases.price);
      const price = rawPrice ? parseMoney(rawPrice) : null;
      rows.push({
        code,
        quantity: parsedQuantity,
        ...(price !== null ? { price } : {}),
      });
    }
    return;
  }
  for (const child of Object.values(record)) {
    if (rows.length > 5000) break;
    collectRows(child, rows);
  }
}

export async function POST(request: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumFileBytes + 100_000) {
    return NextResponse.json(
      { error: "XML dosyası en fazla 2 MB olabilir." },
      { status: 413 },
    );
  }

  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "XML dosyasını multipart/form-data biçiminde gönderin." },
      { status: 400 },
    );
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Yükleme formu okunamadı. XML dosyasını tekrar seçin." },
      { status: 400 },
    );
  }
  const supplier = form.get("supplier");
  const deliveryValue = form.get("delivery");
  const file = form.get("file");
  if (
    typeof supplier !== "string" ||
    supplier.trim().length < 2 ||
    supplier.trim().length > 100 ||
    typeof deliveryValue !== "string" ||
    deliveryValue.trim().length < 2 ||
    deliveryValue.trim().length > 100 ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      { error: "Tedarikçi, teslimat bilgisi ve bir XML dosyası gereklidir." },
      { status: 400 },
    );
  }
  if (!file.name.toLowerCase().endsWith(".xml")) {
    return NextResponse.json(
      { error: "Yalnızca .xml uzantılı dosyalar kabul edilir." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > maximumFileBytes) {
    return NextResponse.json(
      { error: "XML dosyası boş olamaz ve en fazla 2 MB olabilir." },
      { status: 413 },
    );
  }

  const bytes = await file.arrayBuffer();
  let xml: string;
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return NextResponse.json(
      { error: "XML dosyası UTF-8 biçiminde olmalıdır." },
      { status: 400 },
    );
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) {
    return NextResponse.json(
      { error: "XML içinde DTD ve harici entity tanımlarına izin verilmez." },
      { status: 400 },
    );
  }
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    return NextResponse.json(
      { error: `XML biçimi geçersiz: ${validation.err.msg}` },
      { status: 400 },
    );
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
    processEntities: false,
  });
  const rows: FeedRow[] = [];
  let parsedXml: unknown;
  try {
    parsedXml = parser.parse(xml) as unknown;
  } catch {
    return NextResponse.json(
      { error: "XML içeriği çözümlenemedi. Dosya yapısını kontrol edin." },
      { status: 400 },
    );
  }
  collectRows(parsedXml, rows);
  if (rows.length === 0) {
    return NextResponse.json(
      {
        error:
          "XML içinde eşleştirilebilir parça bulunamadı. Parça kodu (code/OEM) ve stok (stock/quantity) alanlarını kontrol edin.",
      },
      { status: 400 },
    );
  }
  if (rows.length > 5000) {
    return NextResponse.json(
      { error: "Tek bir XML dosyasında en fazla 5.000 satır içe aktarılabilir." },
      { status: 400 },
    );
  }

  const uniqueRows = new Map<string, FeedRow>();
  for (const row of rows) {
    const normalizedCode = row.code.replace(/[\s-]/g, "").toLowerCase();
    if (normalizedCode) uniqueRows.set(normalizedCode, row);
  }
  const database = getDatabase();
  const productByCode = database.prepare(
    `SELECT id FROM products
     WHERE lower(replace(replace(code, ' ', ''), '-', '')) = ? AND active = 1`,
  );
  const upsertSupplier = database.prepare(
    `INSERT INTO supplier_stock
       (product_id, supplier, quantity, delivery, purchase_price)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(product_id, supplier) DO UPDATE SET
       quantity = excluded.quantity,
       delivery = excluded.delivery,
       purchase_price = coalesce(excluded.purchase_price, supplier_stock.purchase_price)`,
  );
  const unmatchedCodes: string[] = [];
  let matchedCount = 0;
  const importFeed = database.transaction(() => {
    for (const [normalizedCode, row] of uniqueRows) {
      const product = productByCode.get(normalizedCode) as
        | { id: string }
        | undefined;
      if (!product) {
        if (unmatchedCodes.length < 100) unmatchedCodes.push(row.code);
        continue;
      }
      upsertSupplier.run(
        product.id,
        supplier.trim(),
        row.quantity,
        deliveryValue.trim(),
        row.price ?? null,
      );
      matchedCount += 1;
    }
    database
      .prepare(
        `INSERT INTO xml_syncs
         (supplier, filename, imported_count, matched_count, unmatched_codes)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        supplier.trim(),
        file.name.replace(/[^\w.-]/g, "_").slice(0, 120),
        uniqueRows.size,
        matchedCount,
        JSON.stringify(unmatchedCodes),
      );
  });
  importFeed.immediate();

  return NextResponse.json(
    {
      importedCount: uniqueRows.size,
      matchedCount,
      unmatchedCount: uniqueRows.size - matchedCount,
      unmatchedCodes,
    },
    { status: 200 },
  );
}
