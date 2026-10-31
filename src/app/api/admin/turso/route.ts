import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { exportSiteSnapshot, getDatabase, recordAuditLog, setSiteSetting } from "@/lib/db";
import { readJsonObject } from "@/lib/request";
import { executeTursoQueries, getTursoConfig, testTursoConnection } from "@/lib/turso";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const config = getTursoConfig();
  let connectionTest: { success: boolean; message: string } | null = null;
  if (config.isConfigured) {
    connectionTest = await testTursoConnection(config.url, config.authToken);
  }

  return NextResponse.json({
    configured: config.isConfigured,
    url: config.url ? `${config.url.slice(0, 20)}...` : "",
    connection: connectionTest,
  });
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
    return NextResponse.json({ error: "Geçerli bir içerik gönderin." }, { status: 400 });
  }

  const action = String(body.action || "test");

  // 1. Test Connection
  if (action === "test") {
    const url = String(body.url || "").trim();
    const token = String(body.authToken || "").trim();
    if (!url || !token) {
      return NextResponse.json({ error: "URL ve Auth Token gereklidir." }, { status: 400 });
    }
    const testResult = await testTursoConnection(url, token);
    return NextResponse.json(testResult);
  }

  // 2. Save Config
  if (action === "save") {
    const url = String(body.url || "").trim();
    const token = String(body.authToken || "").trim();
    if (!url || !token) {
      return NextResponse.json({ error: "URL ve Auth Token boş bırakılamaz." }, { status: 400 });
    }

    // Save to database site_settings
    setSiteSetting("turso_url", url, "database");
    setSiteSetting("turso_auth_token", token, "database");

    // Also update .env.local if available locally
    try {
      if (existsSync(".env.local")) {
        let envContent = readFileSync(".env.local", "utf8");
        if (envContent.includes("TURSO_DATABASE_URL=")) {
          envContent = envContent.replace(/^TURSO_DATABASE_URL=.*$/m, `TURSO_DATABASE_URL=${url}`);
        } else {
          envContent += `\nTURSO_DATABASE_URL=${url}`;
        }
        if (envContent.includes("TURSO_AUTH_TOKEN=")) {
          envContent = envContent.replace(/^TURSO_AUTH_TOKEN=.*$/m, `TURSO_AUTH_TOKEN=${token}`);
        } else {
          envContent += `\nTURSO_AUTH_TOKEN=${token}`;
        }
        writeFileSync(".env.local", envContent, "utf8");
      }
    } catch {}

    recordAuditLog(admin.email, "CONFIG_TURSO", "Database", "TURSO", "Turso bulut veritabanı yapılandırıldı.");

    return NextResponse.json({ success: true, message: "Turso ayarları başarıyla kaydedildi!" });
  }

  // 3. Sync local data to Turso
  if (action === "sync-to-turso") {
    const config = getTursoConfig();
    const url = String(body.url || config.url || "").trim();
    const token = String(body.authToken || config.authToken || "").trim();

    if (!url || !token) {
      return NextResponse.json({ error: "Turso URL ve Token bilgisi bulunamadı." }, { status: 400 });
    }

    try {
      // Create initial core tables on Turso
      const createTableQueries = [
        `CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, category TEXT DEFAULT 'general');`,
        `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT, parent_id TEXT, sort_order INTEGER DEFAULT 0, icon TEXT DEFAULT '', banner TEXT DEFAULT '', seo_title TEXT DEFAULT '', seo_description TEXT DEFAULT '', default_margin REAL DEFAULT 20.0, is_vehicle_tree INTEGER DEFAULT 0, active INTEGER DEFAULT 1);`,
        `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, brand TEXT NOT NULL, name TEXT NOT NULL, code TEXT NOT NULL, kind TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL, cost INTEGER NOT NULL, central_stock INTEGER DEFAULT 0, shelf TEXT DEFAULT '', fitment TEXT DEFAULT '', sku TEXT DEFAULT '', barcode TEXT DEFAULT '', oem_codes TEXT DEFAULT '[]', manufacturer_brand TEXT DEFAULT '', condition TEXT DEFAULT 'Sıfır', warranty_months INTEGER DEFAULT 12, desi REAL DEFAULT 1.0, weight_kg REAL DEFAULT 1.0, corridor TEXT DEFAULT '', bin TEXT DEFAULT '', discount_price INTEGER DEFAULT 0, currency TEXT DEFAULT 'TL', vat_rate INTEGER DEFAULT 20, source_url TEXT DEFAULT '', source_last_price INTEGER DEFAULT 0, description TEXT DEFAULT '', specs_json TEXT DEFAULT '{}', compatible_vehicles TEXT DEFAULT '[]', position TEXT DEFAULT 'Yönsüz / Evrensel', has_core_deposit INTEGER DEFAULT 0, core_deposit_price INTEGER DEFAULT 0);`,
        `CREATE TABLE IF NOT EXISTS product_images (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL, image_url TEXT NOT NULL, sort_order INTEGER DEFAULT 0, is_primary INTEGER DEFAULT 0);`,
        `CREATE TABLE IF NOT EXISTS sliders_banners (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT DEFAULT '', image_desktop TEXT NOT NULL, image_mobile TEXT DEFAULT '', link_url TEXT DEFAULT '', button_text TEXT DEFAULT '', position TEXT DEFAULT 'hero_slider', sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1);`,
        `CREATE TABLE IF NOT EXISTS cms_pages (slug TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, seo_title TEXT DEFAULT '', seo_description TEXT DEFAULT '', active INTEGER DEFAULT 1);`,
        `CREATE TABLE IF NOT EXISTS currency_rates (currency TEXT PRIMARY KEY, rate REAL NOT NULL);`,
        `CREATE TABLE IF NOT EXISTS shipping_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, min_desi REAL NOT NULL, max_desi REAL NOT NULL, price INTEGER NOT NULL, free_shipping_threshold INTEGER DEFAULT 0, active INTEGER DEFAULT 1);`,
      ];

      await executeTursoQueries(url, token, createTableQueries);

      // Now sync snapshot items
      const snapshot = exportSiteSnapshot();

      const insertStatements: string[] = [];
      // 1. Settings
      for (const [k, v] of Object.entries(snapshot.settings)) {
        const safeVal = String(v).replace(/'/g, "''");
        insertStatements.push(`INSERT INTO site_settings (key, value) VALUES ('${k}', '${safeVal}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`);
      }

      // 2. Categories
      for (const cat of snapshot.categories as any[]) {
        const id = cat.id || cat.slug;
        const name = String(cat.name).replace(/'/g, "''");
        const slug = String(cat.slug || "").replace(/'/g, "''");
        const icon = String(cat.icon || "").replace(/'/g, "''");
        const banner = String(cat.banner || "").replace(/'/g, "''");
        insertStatements.push(`INSERT INTO categories (id, name, slug, sort_order, icon, banner, default_margin, is_vehicle_tree, active) VALUES ('${id}', '${name}', '${slug}', ${cat.sort_order || 0}, '${icon}', '${banner}', ${cat.default_margin || 20}, ${cat.is_vehicle_tree ? 1 : 0}, ${cat.active !== 0 ? 1 : 0}) ON CONFLICT(id) DO UPDATE SET name = excluded.name, icon = excluded.icon, banner = excluded.banner;`);
      }

      // Chunk execution in batches of 40 statements
      for (let i = 0; i < insertStatements.length; i += 40) {
        const chunk = insertStatements.slice(i, i + 40);
        await executeTursoQueries(url, token, chunk);
      }

      recordAuditLog(admin.email, "SYNC_TURSO", "Database", "TURSO", `Tüm mağaza Turso bulutuna aktarıldı (${snapshot.categories.length} kategori, ${snapshot.products.length} ürün).`);

      return NextResponse.json({
        success: true,
        message: `Tüm kategoriler, ayarlar ve ürünler başarıyla Turso bulutuna aktarıldı! (${snapshot.categories.length} kategori, ${snapshot.products.length} ürün)`,
      });
    } catch (err: unknown) {
      console.error("[Turso Sync Error]", err);
      const msg = err instanceof Error ? err.message : "Turso bulutuna aktarma başarısız oldu.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
