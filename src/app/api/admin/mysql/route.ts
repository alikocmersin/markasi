import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { recordAuditLog, setSiteSetting } from "@/lib/db";
import { readJsonObject } from "@/lib/request";
import {
  getMysqlConfig,
  testMysqlConnection,
  syncAllToMysql,
  pullAllFromMysql,
} from "@/lib/mysql";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const config = getMysqlConfig();
  let connectionTest: { success: boolean; version?: string; message: string } | null = null;
  if (config.isConfigured) {
    connectionTest = await testMysqlConnection(config);
  }

  return NextResponse.json({
    configured: config.isConfigured,
    host: config.host || "",
    port: config.port || 3306,
    user: config.user || "",
    database: config.database || "",
    ssl: config.ssl,
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
    const host = String(body.host || "").trim();
    const port = parseInt(String(body.port || "3306"), 10);
    const user = String(body.user || "").trim();
    const password = String(body.password || "");
    const database = String(body.database || "").trim();
    const ssl = Boolean(body.ssl);

    if (!host || !user || !database) {
      return NextResponse.json({ error: "Host, Kullanıcı Adı ve Veritabanı Adı zorunludur." }, { status: 400 });
    }

    const testResult = await testMysqlConnection({ host, port, user, password, database, ssl });
    return NextResponse.json(testResult);
  }

  // 2. Save Config
  if (action === "save") {
    const host = String(body.host || "").trim();
    const port = parseInt(String(body.port || "3306"), 10);
    const user = String(body.user || "").trim();
    const password = String(body.password || "");
    const database = String(body.database || "").trim();
    const ssl = Boolean(body.ssl);

    if (!host || !user || !database) {
      return NextResponse.json({ error: "Host, Kullanıcı ve Veritabanı boş bırakılamaz." }, { status: 400 });
    }

    // Save to database site_settings
    setSiteSetting("mysql_host", host, "database");
    setSiteSetting("mysql_port", String(port), "database");
    setSiteSetting("mysql_user", user, "database");
    setSiteSetting("mysql_password", password, "database");
    setSiteSetting("mysql_database", database, "database");
    setSiteSetting("mysql_ssl", ssl ? "1" : "0", "database");

    // Also update .env.local if available locally
    try {
      if (existsSync(".env.local")) {
        let envContent = readFileSync(".env.local", "utf8");
        const envVars = [
          { key: "MYSQL_HOST", val: host },
          { key: "MYSQL_PORT", val: String(port) },
          { key: "MYSQL_USER", val: user },
          { key: "MYSQL_PASSWORD", val: password },
          { key: "MYSQL_DATABASE", val: database },
          { key: "MYSQL_SSL", val: ssl ? "true" : "false" },
        ];

        for (const { key, val } of envVars) {
          const regex = new RegExp(`^${key}=.*$`, "m");
          if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        }
        writeFileSync(".env.local", envContent, "utf8");
      }
    } catch {}

    recordAuditLog(admin.email, "CONFIG_MYSQL", "Database", "MYSQL", "MySQL veritabanı ayarları kaydedildi.");

    return NextResponse.json({ success: true, message: "MySQL ayarları başarıyla kaydedildi!" });
  }

  // 3. Sync local data to MySQL
  if (action === "sync-to-mysql") {
    const config = getMysqlConfig();
    const host = String(body.host || config.host || "").trim();
    const port = parseInt(String(body.port || config.port || "3306"), 10);
    const user = String(body.user || config.user || "").trim();
    const password = String(body.password || config.password || "");
    const database = String(body.database || config.database || "").trim();
    const ssl = body.ssl !== undefined ? Boolean(body.ssl) : config.ssl;

    if (!host || !user || !database) {
      return NextResponse.json({ error: "MySQL bağlantı bilgileri eksik." }, { status: 400 });
    }

    try {
      const syncResult = await syncAllToMysql({ host, port, user, password, database, ssl });
      recordAuditLog(
        admin.email,
        "SYNC_MYSQL",
        "Database",
        "MYSQL",
        `Tüm mağaza MySQL'e aktarıldı (${JSON.stringify(syncResult.syncedCounts)})`
      );

      return NextResponse.json({
        success: true,
        message: syncResult.message,
        syncedCounts: syncResult.syncedCounts,
      });
    } catch (err: unknown) {
      console.error("[MySQL Sync Error]", err);
      const msg = err instanceof Error ? err.message : "MySQL veritabanına aktarma başarısız oldu.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // 4. Pull data from MySQL to local database
  if (action === "pull-from-mysql") {
    const config = getMysqlConfig();
    const host = String(body.host || config.host || "").trim();
    const port = parseInt(String(body.port || config.port || "3306"), 10);
    const user = String(body.user || config.user || "").trim();
    const password = String(body.password || config.password || "");
    const database = String(body.database || config.database || "").trim();
    const ssl = body.ssl !== undefined ? Boolean(body.ssl) : config.ssl;

    if (!host || !user || !database) {
      return NextResponse.json({ error: "MySQL bağlantı bilgileri eksik." }, { status: 400 });
    }

    try {
      const pullResult = await pullAllFromMysql({ host, port, user, password, database, ssl });
      recordAuditLog(
        admin.email,
        "PULL_MYSQL",
        "Database",
        "MYSQL",
        `MySQL'den yerel veritabanına veri çekildi (${JSON.stringify(pullResult.pulledCounts)})`
      );

      return NextResponse.json({
        success: true,
        message: pullResult.message,
        pulledCounts: pullResult.pulledCounts,
      });
    } catch (err: unknown) {
      console.error("[MySQL Pull Error]", err);
      const msg = err instanceof Error ? err.message : "MySQL'den veri çekme başarısız oldu.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
