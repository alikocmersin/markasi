import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  createReturnRequest,
  createSupplierRecourse,
  getDatabase,
  listReturns,
  listSupplierRecourses,
  recordAuditLog,
  updateReturnStatus,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const returns = listReturns();
  const recourses = listSupplierRecourses();

  return NextResponse.json({ returns, recourses });
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
  if (!body || !body.returnId || !body.status) {
    return NextResponse.json({ error: "İade ID ve durum zorunludur." }, { status: 400 });
  }

  const returnId = String(body.returnId);
  const status = String(body.status);
  const refundAmount = typeof body.refundAmount === "number" ? Math.round(body.refundAmount * 100) : undefined;

  updateReturnStatus(returnId, status, refundAmount);
  recordAuditLog(admin.email, "UPDATE_RMA_STATUS", "Return", returnId, `İade durumu: ${status}`);

  return NextResponse.json({ success: true });
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

  // Action 1: Supplier Recourse
  if (body.action === "recourse" || (body.supplier && body.partCode)) {
    if (!body.productId || !body.supplier || !body.partCode) {
      return NextResponse.json({ error: "Tedarikçi, ürün ve parça kodu zorunludur." }, { status: 400 });
    }

    const id = createSupplierRecourse({
      returnId: body.returnId ? String(body.returnId) : undefined,
      productId: String(body.productId),
      supplier: String(body.supplier),
      partCode: String(body.partCode),
      problemDescription: String(body.problemDescription || "Müşteriden kusurlu/arızalı iade geldi."),
    });

    recordAuditLog(admin.email, "CREATE_SUPPLIER_RECOURSE", "Recourse", id, `${body.supplier} firmasına rücu/garanti kaydı açıldı.`);
    return NextResponse.json({ success: true, id }, { status: 201 });
  }

  // Action 2: Customer RMA Return Request
  const orderId = String(body.orderId || "").trim();
  const reason = String(body.reason || "Kusurlu/yanlış ürün").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Sipariş ID zorunludur." }, { status: 400 });
  }

  const orderExists = getDatabase().prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
  if (!orderExists) {
    return NextResponse.json({ error: "Belirtilen sipariş numarası sistemde bulunamadı." }, { status: 404 });
  }

  const id = createReturnRequest({
    orderId,
    productId: body.productId ? String(body.productId) : undefined,
    customerName: body.customerName ? String(body.customerName) : undefined,
    reason,
    customerNote: body.customerNote ? String(body.customerNote) : undefined,
    photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
  });

  recordAuditLog(admin.email, "CREATE_RMA_RETURN", "Return", id, `${orderId} için iade talebi oluşturuldu.`);
  return NextResponse.json({ success: true, id }, { status: 201 });
}

