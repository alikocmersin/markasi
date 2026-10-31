import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { getMemberId } from "@/lib/member-auth";
import { getDatabase } from "@/lib/db";
import { readJsonObject } from "@/lib/request";

const provincePlateCodes: Record<string, string> = {
  adana: "01", adiyaman: "02", afyonkarahisar: "03", agri: "04", amasya: "05",
  ankara: "06", antalya: "07", artvin: "08", aydin: "09", balikesir: "10",
  bilecik: "11", bingol: "12", bitlis: "13", bolu: "14", burdur: "15",
  bursa: "16", canakkale: "17", cakir: "18", corum: "19", denizli: "20",
  diyarbakir: "21", edirne: "22", elazig: "23", erzincan: "24", erzurum: "25",
  eskisehir: "26", gaziantep: "27", giresun: "28", gumushane: "29", hakkari: "30",
  hatay: "31", isparta: "32", mersin: "33", istanbul: "34", izmir: "35",
  kars: "36", kastamonu: "37", kayseri: "38", kirklareli: "39", kirsehir: "40",
  kocaeli: "41", konya: "42", kutahya: "43", malatya: "44", manisa: "45",
  kahramanmaras: "46", mardin: "47", mugla: "48", mus: "49", nevsehir: "50",
  nigde: "51", ordu: "52", rize: "53", sakarya: "54", samsun: "55",
  siirt: "56", sinop: "57", sivas: "58", tekirdag: "59", tokat: "60",
  trabzon: "61", tunceli: "62", sanliurfa: "63", usak: "64", van: "65",
  yeni: "66", zonguldak: "67", aksaray: "68", bayburt: "69", karaman: "70",
  kirikkale: "71", batman: "72", sirnak: "73", bartin: "74", ardahan: "75",
  igdir: "76", yalova: "77", karabuk: "78", kilis: "79", osmaniye: "80",
  duzce: "81",
};

function normalizeProvince(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z]/g, "");
}

function extractProvinceCode(address: string) {
  const normalized = normalizeProvince(address);
  for (const [name, code] of Object.entries(provincePlateCodes)) {
    if (normalized.includes(name)) return code;
  }
  return "00";
}

function generateOrderId(
  provinceCode: string,
  database: ReturnType<typeof getDatabase>,
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomPart = String(randomInt(10_000, 100_000));
    const id = `${provinceCode}-${randomPart}`;
    const exists = database.prepare("SELECT 1 FROM orders WHERE id = ?").get(id);
    if (!exists) return id;
  }
  return `${provinceCode}-${Date.now().toString().slice(-5)}`;
}

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Geçerli bir istek gönderin." }, { status: 400 });
  }

  const customerName = text(body.customerName, 100);
  const email = text(body.email, 160).toLowerCase();
  const phone = text(body.phone, 30);
  const address = text(body.address, 500);
  const paymentMethod = text(body.paymentMethod, 40);
  const allowedPaymentMethods = [
    "Kapıda ödeme",
    "Havale / EFT",
    "Kredi Kartı",
    "Kredi Kartı (Tek Çekim)",
    "Kredi Kartı (Taksitli)",
  ];

  if (
    customerName.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (phone.match(/\d/g)?.length ?? 0) < 10 ||
    address.length < 10 ||
    !allowedPaymentMethods.some((m) => paymentMethod.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(paymentMethod.toLowerCase())) ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 50
  ) {
    return NextResponse.json(
      { error: "Müşteri bilgilerini ve en az bir ürünü kontrol edin." },
      { status: 400 },
    );
  }

  const quantities = new Map<string, number>();
  for (const entry of body.items) {
    if (!entry || typeof entry !== "object") {
      return NextResponse.json({ error: "Sepet bilgisi geçersiz." }, { status: 400 });
    }
    const item = entry as { productId?: unknown; quantity?: unknown };
    const productId = text(item.productId, 80);
    const quantity = item.quantity;
    if (
      !productId ||
      !Number.isInteger(quantity) ||
      typeof quantity !== "number" ||
      quantity < 1 ||
      quantity > 99
    ) {
      return NextResponse.json({ error: "Sepet bilgisi geçersiz." }, { status: 400 });
    }
    const totalQuantity = (quantities.get(productId) ?? 0) + quantity;
    if (totalQuantity > 99) {
      return NextResponse.json(
        { error: "Bir parçadan en fazla 99 adet sipariş edilebilir." },
        { status: 400 },
      );
    }
    quantities.set(productId, totalQuantity);
  }

  const database = getDatabase();

  // Retrieve member ID if authenticated, or find member by email
  let memberId = await getMemberId();
  if (!memberId && email) {
    const memberRow = database
      .prepare("SELECT id FROM members WHERE email = ? COLLATE NOCASE")
      .get(email) as { id: string } | undefined;
    if (memberRow) {
      memberId = memberRow.id;
    }
  }

  const createOrder = database.transaction(() => {
    type OrderSelection =
      | { ok: false; error: string }
      | {
          ok: true;
          product: {
            id: string;
            name: string;
            code: string;
            price: number;
            centralStock: number;
            supplierStock: number;
          };
          quantity: number;
        };

    const selected: OrderSelection[] = [...quantities].map(
      ([productId, quantity]): OrderSelection => {
        const product = database
          .prepare(
            `SELECT id, name, code, price, central_stock AS centralStock
             FROM products WHERE id = ? AND active = 1`,
          )
          .get(productId) as
          | {
              id: string;
              name: string;
              code: string;
              price: number;
              centralStock: number;
            }
          | undefined;

        if (!product) {
          return { ok: false, error: `Ürün bulunamadı: ${productId}` };
        }

        const supplierStockRow = database
          .prepare(
            `SELECT coalesce(sum(quantity), 0) AS total
             FROM supplier_stock WHERE product_id = ?`,
          )
          .get(productId) as { total: number };

        const supplierStock = supplierStockRow?.total || 0;
        const totalStock = (product.centralStock || 0) + supplierStock;

        if (totalStock < quantity) {
          return {
            ok: false,
            error: `${product.name} için seçilen miktar stokta bulunmuyor (Mevcut: ${totalStock} adet). Lütfen adedi azaltıp tekrar deneyin.`,
          };
        }

        return {
          ok: true,
          product: {
            ...product,
            supplierStock,
          },
          quantity,
        };
      },
    );

    const failure = selected.find((item) => "error" in item);
    if (failure && !failure.ok) return { error: failure.error };

    const provinceCode = extractProvinceCode(address);
    const orderId = generateOrderId(provinceCode, database);
    const orderItems = selected.filter(
      (item): item is Extract<OrderSelection, { ok: true }> => item.ok,
    );
    const total = orderItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    database
      .prepare(
        `INSERT INTO orders
          (id, customer_name, email, phone, address, payment_method, total, member_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(orderId, customerName, email, phone, address, paymentMethod, total, memberId || null);

    const addItem = database.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, code, quantity, unit_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    for (const item of orderItems) {
      // Deduct from central stock up to available
      const fromCentral = Math.min(Math.max(0, item.product.centralStock), item.quantity);
      if (fromCentral > 0) {
        database
          .prepare(
            "UPDATE products SET central_stock = central_stock - ? WHERE id = ? AND central_stock >= ?",
          )
          .run(fromCentral, item.product.id, fromCentral);
      }

      // Deduct remaining from supplier stock if needed
      const fromSupplier = item.quantity - fromCentral;
      if (fromSupplier > 0) {
        database
          .prepare(
            `UPDATE supplier_stock
             SET quantity = MAX(0, quantity - ?)
             WHERE product_id = ? AND quantity > 0`,
          )
          .run(fromSupplier, item.product.id);
      }

      addItem.run(
        orderId,
        item.product.id,
        item.product.name,
        item.product.code,
        item.quantity,
        item.product.price,
      );
    }

    return { orderId, total };
  });

  const result = createOrder.immediate();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result, { status: 201 });
}
