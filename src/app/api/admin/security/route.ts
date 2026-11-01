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
import { syncCloudDatabase } from "@/lib/cloud-sync";

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

  // 3. MySQL / phpMyAdmin Compatible SQL Dump Download
  if (action === "export-mysql") {
    try {
      const db = getDatabase();
      const tables = [
        "site_settings",
        "categories",
        "products",
        "product_images",
        "supplier_stock",
        "admins",
        "members",
        "sliders_banners",
        "cms_pages",
        "currency_rates",
        "shipping_rules",
        "pos_installments",
        "b2b_groups",
        "coupons",
        "orders",
        "order_items",
        "product_bundles",
        "bundle_items",
        "returns",
        "supplier_recourses",
        "pay_links",
        "member_vehicles",
      ];

      let sqlDump = `-- Markasi Otomotiv MySQL Dump\n-- Generated: ${new Date().toISOString()}\n-- Compatible with MySQL 5.7+, 8.0+, MariaDB, TiDB & phpMyAdmin\n\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

      for (const table of tables) {
        const rows = db.prepare(`SELECT * FROM "${table}"`).all() as any[];
        if (rows.length === 0) continue;

        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(", ");

        sqlDump += `--\n-- Data for table \`${table}\`\n--\n`;
        for (const row of rows) {
          const values = columns.map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number") return val;
            return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
          });
          sqlDump += `INSERT INTO \`${table}\` (${colList}) VALUES (${values.join(", ")});\n`;
        }
        sqlDump += "\n";
      }

      sqlDump += "SET FOREIGN_KEY_CHECKS = 1;\n";

      recordAuditLog(admin.email, "EXPORT_MYSQL", "Security", "MYSQL", "MySQL .sql dökümü indirildi.");

      return new Response(sqlDump, {
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="markasi-mysql-dump-${new Date().toISOString().slice(0, 10)}.sql"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err: unknown) {
      console.error("[MySQL Export Error]", err);
      return NextResponse.json({ error: "MySQL .sql dökümü oluşturulamadı." }, { status: 500 });
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
      void syncCloudDatabase().catch(() => {});
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
      if (!buffer.subarray(0, 15).toString().startsWith("SQLite format 3")) {
        return NextResponse.json({ error: "Yüklenen dosya geçerli bir SQLite veritabanı değil." }, { status: 400 });
      }

      resetDatabase();
      const targetPath = getDatabasePath();
      writeFileSync(targetPath, buffer);

      const newDb = getDatabase();
      const check = newDb.prepare("SELECT count(*) as count FROM products").get() as { count: number };

      recordAuditLog(
        admin.email,
        "RESTORE_DATABASE",
        "Security",
        "DATABASE",
        `Veritabanı geri yüklendi (${check.count} ürün mevcut).`
      );

      void syncCloudDatabase().catch(() => {});

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
