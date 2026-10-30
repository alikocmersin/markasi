import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  getDatabase,
  listB2BGroups,
  listMembersFull,
  recordAuditLog,
  updateMemberB2B,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const members = listMembersFull();
  const b2bGroups = listB2BGroups();

  return NextResponse.json({ members, b2bGroups, groups: b2bGroups });
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
  if (!body || !body.memberId) {
    return NextResponse.json({ error: "Üye ID belirtilmedi." }, { status: 400 });
  }

  const memberId = String(body.memberId);
  const updated = updateMemberB2B(memberId, {
    b2bGroupId: body.b2bGroupId !== undefined ? (body.b2bGroupId ? String(body.b2bGroupId) : null) : undefined,
    companyTitle: body.companyTitle !== undefined ? String(body.companyTitle).trim() : undefined,
    taxOffice: body.taxOffice !== undefined ? String(body.taxOffice).trim() : undefined,
    taxNumber: body.taxNumber !== undefined ? String(body.taxNumber).trim() : undefined,
    creditBalanceDelta: typeof body.creditBalanceDelta === "number" ? Math.round(body.creditBalanceDelta * 100) : undefined,
    isBanned: body.isBanned !== undefined ? Boolean(body.isBanned) : undefined,
  });

  if (updated) {
    recordAuditLog(admin.email, "UPDATE_MEMBER_B2B", "Member", memberId, JSON.stringify(body));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Üye güncellenemedi." }, { status: 400 });
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

  // Action: Add new B2B Group
  if (body.action === "add-b2b-group") {
    const name = String(body.name || "").trim();
    const discountPercent = Number(body.discountPercent || 0);
    const description = String(body.description || "").trim();
    const minOrderAmount = Number(body.minOrderAmount || 0) * 100;

    if (!name) return NextResponse.json({ error: "Grup adı zorunludur." }, { status: 400 });

    const id = `b2b-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    getDatabase()
      .prepare(`
        INSERT INTO b2b_groups (id, name, discount_percent, description, min_order_amount)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET discount_percent = excluded.discount_percent, description = excluded.description
      `)
      .run(id, name, discountPercent, description, minOrderAmount);

    recordAuditLog(admin.email, "CREATE_B2B_GROUP", "B2BGroup", id, `${name} grubu oluşturuldu.`);
    return NextResponse.json({ success: true, id });
  }

  // Action: Cari transaction / balance adjustment
  if (body.action === "cari_transaction" || body.action === "credit_balance") {
    const memberId = String(body.memberId || "");
    const amountDelta = typeof body.amountDelta === "number" ? Math.round(body.amountDelta) : typeof body.creditBalanceDelta === "number" ? Math.round(body.creditBalanceDelta * 100) : 0;
    if (!memberId) {
      return NextResponse.json({ error: "Üye ID zorunludur." }, { status: 400 });
    }

    const updated = updateMemberB2B(memberId, { creditBalanceDelta: amountDelta });
    if (updated) {
      recordAuditLog(admin.email, "CARI_TRANSACTION", "Member", memberId, `Bakiye değişimi: ${(amountDelta / 100).toFixed(2)} TL`);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Üye bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
}

