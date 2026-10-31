import { readFileSync, writeFileSync } from "node:fs";
import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  exportSiteSnapshot,
  getDatabase,
  getDatabasePath,
  importSiteSnapshot,
  listAdmins,
  listAuditLogs,
  recordAuditLog,
  resetDatabase,
  updateAdminRole,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // 1. Live SQLite Database Backup Download (From active database path)
  if (action === "backup") {
    try {
      const db = getDatabase();
      try {
        db.pragma("wal_checkpoint(TRUNCATE)");
      } catch {}

      const dbPath = getDatabasePath();
      const fileBuffer = readFileSync(dbPath);

      recordAuditLog(admin.email, "DOWNLOAD_BACKUP", "Security", "DATABASE", "Canlı veritabanı yedeği indirildi.");

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="markasi-live-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err: unknown) {
      console.error("[Backup Error]", err);
      return NextResponse.json({ error: "Veritabanı yedeği alınamadı." }, { status: 500 });
    }
  }

  // 2. Full Store State Snapshot Download (Clean JSON)
  if (action === "snapshot") {
    try {
      const snapshot = exportSiteSnapshot();
      recordAuditLog(admin.email, "EXPORT_SNAPSHOT", "Security", "SNAPSHOT", "Mağaza durum snapshot'ı dışa aktarıldı.");

      return new Response(JSON.stringify(snapshot, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="markasi-snapshot-${new Date().toISOString().slice(0, 10)}.json"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err: unknown) {
      console.error("[Snapshot Export Error]", err);
      return NextResponse.json({ error: "Snapshot oluşturulamadı." }, { status: 500 });
    }
  }

  const auditLogs = listAuditLogs(150);
  const admins = listAdmins();

  return NextResponse.json({ auditLogs, admins });
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // 1. Restore JSON Snapshot
  if (action === "restore-snapshot") {
    try {
      const body = await readJsonObject(request);
      if (!body || !body.snapshot) {
        return NextResponse.json({ error: "Snapshot verisi bulunamadı." }, { status: 400 });
      }
      const result = importSiteSnapshot(body.snapshot);
      recordAuditLog(
        admin.email,
        "RESTORE_SNAPSHOT",
        "Security",
        "SNAPSHOT",
        `Snapshot geri yüklendi (${result.productsCount} ürün, ${result.categoriesCount} kategori, ${result.settingsCount} ayar).`
      );
      return NextResponse.json(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Snapshot geri yüklenirken hata oluştu.";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  // 2. Restore SQLite Binary File
  if (action === "restore-db") {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Lütfen bir .sqlite veritabanı dosyası seçin." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      // SQLite header check (magic header: "SQLite format 3\0")
      if (!buffer.subarray(0, 15).toString().startsWith("SQLite format 3")) {
        return NextResponse.json({ error: "Yüklenen dosya geçerli bir SQLite veritabanı değil." }, { status: 400 });
      }

      // Close current DB connection, write new file, and reopen
      resetDatabase();
      const targetPath = getDatabasePath();
      writeFileSync(targetPath, buffer);

      // Verify new database opens correctly
      const newDb = getDatabase();
      const check = newDb.prepare("SELECT count(*) as count FROM products").get() as { count: number };

      recordAuditLog(
        admin.email,
        "RESTORE_DATABASE",
        "Security",
        "DATABASE",
        `Veritabanı geri yüklendi (${check.count} ürün mevcut).`
      );

      return NextResponse.json({
        success: true,
        message: `Veritabanı başarıyla geri yüklendi! (${check.count} ürün aktif)`,
      });
    } catch (err: unknown) {
      console.error("[Restore DB Error]", err);
      const errorMsg = err instanceof Error ? err.message : "Veritabanı geri yüklenirken hata oluştu.";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
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
  if (!body || !body.email || !body.role) {
    return NextResponse.json({ error: "Yönetici e-posta ve rol zorunludur." }, { status: 400 });
  }

  const email = String(body.email);
  const role = String(body.role);
  const active = body.active !== false;

  updateAdminRole(email, role, active);
  recordAuditLog(admin.email, "UPDATE_ADMIN_ROLE", "Admin", email, `Rol: ${role}, Aktif: ${active}`);

  return NextResponse.json({ success: true });
}
