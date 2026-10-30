import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { createBundle, listBundles, recordAuditLog } from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const bundles = listBundles();
  return NextResponse.json({ bundles });
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
  if (!body || !body.name || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Paket adı ve en az bir ürün seçilmelidir." }, { status: 400 });
  }

  const name = String(body.name).trim();
  const price = typeof body.price === "number" ? Math.round(body.price * 100) : 0;
  const discountPrice = typeof body.discountPrice === "number" ? Math.round(body.discountPrice * 100) : 0;

  const bundleId = createBundle({
    name,
    price,
    discountPrice,
    description: String(body.description || ""),
    items: body.items as Array<{ productId: string; quantity: number }>,
  });

  recordAuditLog(admin.email, "CREATE_BUNDLE", "Bundle", bundleId, `${name} paketi oluşturuldu.`);
  return NextResponse.json({ success: true, bundleId }, { status: 201 });
}

