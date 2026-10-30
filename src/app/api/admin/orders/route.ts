import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  getDatabase,
  listOrders,
  recordAuditLog,
  updateOrderShipping,
  updateOrderVin,
  type OrderStatus,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

const validStatuses: OrderStatus[] = [
  "Yeni",
  "Hazırlanıyor",
  "Kargoya verildi",
  "Tamamlandı",
  "İptal edildi",
];

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const vinStatus = searchParams.get("vinStatus") || "";
  const query = searchParams.get("q") || "";

  const orders = listOrders({ status, vinStatus, query });
  return NextResponse.json({ orders });
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
    return NextResponse.json({ error: "Geçerli bir istek gönderin." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Sipariş ID gerekli." }, { status: 400 });
  }

  // Handle direct or action-based VIN Check update
  if (body.action === "vin" || body.vinStatus !== undefined) {
    let rawStatus = String(body.vinStatus || "Bekliyor");
    if (rawStatus === "approved") rawStatus = "Uyumlu";
    if (rawStatus === "mismatch") rawStatus = "Uyumsuz";
    if (rawStatus === "pending") rawStatus = "Bekliyor";
    const vinStatus = ["Bekliyor", "Uyumlu", "Uyumsuz"].includes(rawStatus)
      ? (rawStatus as "Bekliyor" | "Uyumlu" | "Uyumsuz")
      : "Bekliyor";
    const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : "";
    updateOrderVin(id, vinStatus, adminNotes);
    recordAuditLog(admin.email, "UPDATE_ORDER_VIN", "Order", id, `Şasi durumu: ${vinStatus}. Not: ${adminNotes}`);
    if (!body.cargoCompany && !body.trackingCode && !body.status) {
      return NextResponse.json({ success: true });
    }
  }

  // Handle direct or action-based Courier & Tracking update
  if (body.action === "shipping" || body.cargoCompany || body.courierCompany || body.trackingCode) {
    const courierCompany = String(body.courierCompany || body.cargoCompany || "").trim();
    const trackingCode = String(body.trackingCode || "").trim();
    const shippingStatus = String(body.shippingStatus || "Kargoya Verildi").trim();
    updateOrderShipping(id, courierCompany, trackingCode, shippingStatus);
    recordAuditLog(admin.email, "UPDATE_ORDER_SHIPPING", "Order", id, `Kargo: ${courierCompany}, Takip: ${trackingCode}`);
    if (!body.status) {
      return NextResponse.json({ success: true });
    }
  }

  // Action 3: General Status update
  if (typeof body.status === "string" && validStatuses.includes(body.status as OrderStatus)) {
    const nextStatus = body.status as OrderStatus;
    const database = getDatabase();
    const updateResult = database.transaction(() => {
      const order = database.prepare("SELECT status FROM orders WHERE id = ?").get(id) as { status: OrderStatus } | undefined;
      if (!order) return "missing";

      if (nextStatus === "İptal edildi" && order.status !== "İptal edildi") {
        // Return reserved stocks
        const items = database.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(id) as Array<{ product_id: string; quantity: number }>;
        const restoreStock = database.prepare("UPDATE products SET central_stock = central_stock + ? WHERE id = ?");
        for (const it of items) {
          restoreStock.run(it.quantity, it.product_id);
        }
      }

      database.prepare("UPDATE orders SET status = ? WHERE id = ?").run(nextStatus, id);
      return "updated";
    }).immediate();

    if (updateResult === "missing") {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    recordAuditLog(admin.email, "UPDATE_ORDER_STATUS", "Order", id, `Durum: ${nextStatus}`);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Geçersiz sipariş güncelleme isteği." }, { status: 400 });
}
