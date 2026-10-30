import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  addCategory,
  deleteCategory,
  listCategoryTree,
  recordAuditLog,
  renameCategory,
  setCategoryVisibility,
  upsertCategory,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isVehicleTree = searchParams.get("vehicleTree") === "1";

  const categories = listCategoryTree({
    includeHidden: true,
    isVehicleTree: searchParams.has("vehicleTree") ? isVehicleTree : undefined,
  });

  return NextResponse.json({ categories });
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

  const action = String(body.action || "upsert");

  if (action === "upsert") {
    const name = String(body.name || "").trim().slice(0, 100);
    if (name.length < 2) {
      return NextResponse.json({ error: "Kategori veya Araç adı en az 2 karakter olmalıdır." }, { status: 400 });
    }

    const res = upsertCategory({
      id: body.id ? String(body.id).trim() : undefined,
      name,
      slug: body.slug ? String(body.slug).trim() : undefined,
      parentId: body.parentId ? String(body.parentId).trim() : null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      icon: typeof body.icon === "string" ? body.icon.trim() : "",
      banner: typeof body.banner === "string" ? body.banner.trim() : "",
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle.trim() : "",
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription.trim() : "",
      defaultMargin: typeof body.defaultMargin === "number" ? body.defaultMargin : 20.0,
      isVehicleTree: Boolean(body.isVehicleTree),
      active: body.active !== false,
    });

    recordAuditLog(
      admin.email,
      res.created ? "CREATE_CATEGORY" : "UPDATE_CATEGORY",
      "Category",
      res.id,
      `${name} kategorisi/düğümü güncellendi.`,
    );

    return NextResponse.json({ success: true, id: res.id });
  }

  // Legacy actions
  if (action === "add") {
    const name = String(body.name || "").trim().slice(0, 60);
    if (name.length < 2) {
      return NextResponse.json({ error: "Kategori adı en az 2 karakter olmalıdır." }, { status: 400 });
    }
    if (!addCategory(name)) {
      return NextResponse.json({ error: "Bu kategori adı zaten kullanılıyor." }, { status: 409 });
    }
    recordAuditLog(admin.email, "CREATE_CATEGORY", "Category", name, `${name} kategorisi eklendi.`);
    return NextResponse.json({ success: true }, { status: 201 });
  }

  if (action === "rename") {
    const currentName = String(body.currentName || "").trim();
    const nextName = String(body.nextName || "").trim();
    if (nextName.length < 2) {
      return NextResponse.json({ error: "Yeni kategori adı en az 2 karakter olmalıdır." }, { status: 400 });
    }
    const result = renameCategory(currentName, nextName);
    if (result === "missing") return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });
    if (result === "duplicate") return NextResponse.json({ error: "Bu isimde bir kategori zaten mevcut." }, { status: 409 });
    recordAuditLog(admin.email, "RENAME_CATEGORY", "Category", currentName, `${currentName} -> ${nextName} olarak değiştirildi.`);
    return NextResponse.json({ success: true });
  }

  if (action === "visibility") {
    const name = String(body.name || "").trim();
    const visible = Boolean(body.visible);
    setCategoryVisibility(name, visible);
    recordAuditLog(admin.email, "VISIBILITY_CATEGORY", "Category", name, `Görünürlük: ${visible}`);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
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
  let id = searchParams.get("id") || "";
  let reassignToId = searchParams.get("reassignToId") || undefined;

  if (!id) {
    const body = await readJsonObject(request);
    if (body) {
      id = String(body.id || body.name || "").trim();
      if (body.reassignToId) reassignToId = String(body.reassignToId);
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Silinecek kategori belirtilmedi." }, { status: 400 });
  }

  const success = deleteCategory(id, reassignToId);
  if (!success) {
    return NextResponse.json({ error: "Kategori silinemedi veya bulunamadı." }, { status: 404 });
  }

  recordAuditLog(
    admin.email,
    "DELETE_CATEGORY",
    "Category",
    id,
    reassignToId ? `Silindi, ürünler ${reassignToId} kategorisine aktarıldı.` : "Silindi.",
  );

  return NextResponse.json({ success: true });
}
