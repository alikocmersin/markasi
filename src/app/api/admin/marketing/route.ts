import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  createPayLink,
  getDatabase,
  listAbandonedCarts,
  listCoupons,
  listPayLinks,
  recordAuditLog,
  upsertCoupon,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const payLinks = listPayLinks();
  const abandonedCarts = listAbandonedCarts();
  const coupons = listCoupons();

  return NextResponse.json({ payLinks, abandonedCarts, coupons });
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
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const action = String(body.action || "create-paylink");

  // Create PayLink
  if (["create-paylink", "pay_link", "paylink"].includes(action)) {
    const customerName = String(body.customerName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const partDescription = String(body.partDescription || body.partName || "").trim();
    const amount = typeof body.amount === "number" ? (body.amount > 1000 ? Math.round(body.amount) : Math.round(body.amount * 100)) : 0;

    if (!customerName || !phone || !partDescription || amount <= 0) {
      return NextResponse.json({ error: "Müşteri adı, telefon, parça tanımı ve geçerli tutar zorunludur." }, { status: 400 });
    }

    const payLinkId = createPayLink({
      customerName,
      phone,
      email,
      partDescription,
      amount,
      createdBy: admin.name || admin.email,
    });

    const payUrl = `${new URL(request.url).origin}/odeme/${payLinkId}`;

    recordAuditLog(admin.email, "CREATE_PAYLINK", "PayLink", payLinkId, `${customerName} için ${(amount / 100).toFixed(2)} TL ödeme linki üretildi.`);
    return NextResponse.json({
      success: true,
      payLinkId,
      payUrl,
      payLink: { id: payLinkId, url: payUrl, customerName, phone, amount }
    });
  }

  // Create or Update Coupon
  if (action === "coupon") {
    const code = String(body.code || "").trim().toUpperCase();
    const discountType = body.discountType === "percentage" ? "percentage" : "fixed";
    const discountValue = typeof body.discountValue === "number" ? (discountType === "fixed" ? Math.round(body.discountValue * 100) : body.discountValue) : 0;
    const minOrderAmount = typeof body.minOrderAmount === "number" ? Math.round(body.minOrderAmount * 100) : 0;
    const usageLimit = typeof body.usageLimit === "number" ? body.usageLimit : 100;

    if (!code || discountValue <= 0) {
      return NextResponse.json({ error: "Kupon kodu ve geçerli indirim değeri gereklidir." }, { status: 400 });
    }

    const id = upsertCoupon({
      code,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
    });

    recordAuditLog(admin.email, "UPSERT_COUPON", "Coupon", code, `${code} kuponu kaydedildi.`);
    return NextResponse.json({ success: true, id });
  }

  // Mark abandoned cart as notified
  if (action === "notify-cart") {
    const cartId = String(body.cartId || "");
    if (cartId) {
      getDatabase()
        .prepare("UPDATE abandoned_carts SET last_notified_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(cartId);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
}

