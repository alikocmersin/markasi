import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { recordAuditLog, setSiteSetting } from "@/lib/db";
import { readJsonObject } from "@/lib/request";
import {
  getTursoConfig,
  testTursoConnection,
  syncAllToTurso,
  pullAllFromTurso,
} from "@/lib/turso";
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
    url: config.url || "",
    authToken: config.authToken || "",
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
      const syncResult = await syncAllToTurso(url, token);
      recordAuditLog(
        admin.email,
        "SYNC_TURSO",
        "Database",
        "TURSO",
        `Tüm mağaza Turso bulutuna aktarıldı (${JSON.stringify(syncResult.syncedCounts)})`
      );

      return NextResponse.json({
        success: true,
        message: syncResult.message,
        syncedCounts: syncResult.syncedCounts,
      });
    } catch (err: unknown) {
      console.error("[Turso Sync Error]", err);
      const msg = err instanceof Error ? err.message : "Turso bulutuna aktarma başarısız oldu.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // 4. Pull data from Turso to local database
  if (action === "pull-from-turso") {
    const config = getTursoConfig();
    const url = String(body.url || config.url || "").trim();
    const token = String(body.authToken || config.authToken || "").trim();

    if (!url || !token) {
      return NextResponse.json({ error: "Turso URL ve Token bilgisi bulunamadı." }, { status: 400 });
    }

    try {
      const pullResult = await pullAllFromTurso(url, token);
      recordAuditLog(
        admin.email,
        "PULL_TURSO",
        "Database",
        "TURSO",
        `Turso bulutundan yerel veritabanına veri çekildi (${JSON.stringify(pullResult.pulledCounts)})`
      );

      return NextResponse.json({
        success: true,
        message: pullResult.message,
        pulledCounts: pullResult.pulledCounts,
      });
    } catch (err: unknown) {
      console.error("[Turso Pull Error]", err);
      const msg = err instanceof Error ? err.message : "Turso bulutundan veri çekme başarısız oldu.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
