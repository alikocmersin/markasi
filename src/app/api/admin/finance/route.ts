import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  getCurrencyRates,
  getDatabase,
  listPosInstallments,
  listShippingRules,
  recordAuditLog,
  updateCurrencyRate,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const currencies = getCurrencyRates();
  const installments = listPosInstallments();
  const shippingRules = listShippingRules();

  return NextResponse.json({ currencies, installments, shippingRules });
}

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
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const action = String(body.action || "");

  // Update Currency Rate
  if (action === "currency") {
    const currency = String(body.currency || "").toUpperCase();
    const rate = Number(body.rate || 0);

    if (!["USD", "EUR"].includes(currency) || rate <= 0) {
      return NextResponse.json({ error: "Geçersiz döviz veya kur." }, { status: 400 });
    }

    updateCurrencyRate(currency, rate);
    recordAuditLog(
      admin.email,
      "UPDATE_CURRENCY_RATE",
      "Finance",
      currency,
      `Yeni kur: 1 ${currency} = ${rate} TL. Endeksli ürünler güncellendi.`,
    );
    return NextResponse.json({ success: true, currency, rate });
  }

  // Update Shipping Rule
  if (action === "shipping-rule") {
    const id = Number(body.id);
    const price = typeof body.price === "number" ? Math.round(body.price * 100) : 0;
    const threshold = typeof body.threshold === "number" ? Math.round(body.threshold * 100) : 0;

    if (id > 0) {
      getDatabase()
        .prepare("UPDATE shipping_rules SET price = ?, free_shipping_threshold = ? WHERE id = ?")
        .run(price, threshold, id);
      recordAuditLog(admin.email, "UPDATE_SHIPPING_RULE", "Finance", String(id), `Kargo kuralı güncellendi.`);
      return NextResponse.json({ success: true });
    }
  }

  // Update POS installment rate
  if (action === "pos-installment") {
    const id = Number(body.id);
    const rate = Number(body.commissionRate);
    if (id > 0 && rate >= 0) {
      getDatabase()
        .prepare("UPDATE pos_installments SET commission_rate = ? WHERE id = ?")
        .run(rate, id);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Bilinmeyen finans işlemi." }, { status: 400 });
}

export const POST = PATCH;


