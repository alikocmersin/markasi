import "server-only";

export type TursoConfig = {
  url: string;
  authToken: string;
  isConfigured: boolean;
};

export const SYNC_TABLES = [
  "categories",
  "site_settings",
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
];

export function getTursoConfig(): TursoConfig {
  const envUrl = (process.env.TURSO_DATABASE_URL || "").trim();
  const envToken = (process.env.TURSO_AUTH_TOKEN || "").trim();

  if (envUrl && envToken) {
    return { url: envUrl, authToken: envToken, isConfigured: true };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSiteSettings } = require("./db");
    const settings = getSiteSettings();
    const dbUrl = (settings?.turso_url || "").trim();
    const dbToken = (settings?.turso_auth_token || "").trim();
    if (dbUrl && dbToken) {
      return { url: dbUrl, authToken: dbToken, isConfigured: true };
    }
  } catch {}

  return { url: envUrl, authToken: envToken, isConfigured: false };
}

export function formatTursoHttpUrl(url: string): string {
  let clean = url.trim();
  if (clean.startsWith("libsql://")) {
    clean = clean.replace("libsql://", "https://");
  } else if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/+$/, "");
}

export async function testTursoConnection(
  url: string,
  authToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const httpUrl = formatTursoHttpUrl(url);
    const res = await fetch(`${httpUrl}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: "SELECT 1 as status" } },
          { type: "close" },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { success: false, message: `Turso bağlantı hatası (${res.status}): ${errText || res.statusText}` };
    }

    const data = await res.json();
    if (data.results && data.results[0]?.type === "ok") {
      return { success: true, message: "Turso bulut veritabanı bağlantısı başarılı!" };
    }
    return { success: false, message: "Turso yanıtı doğrulanamadı." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bağlantı kurulamadı.";
    return { success: false, message: msg };
  }
}

export async function executeTursoPipeline(
  url: string,
  authToken: string,
  requests: any[]
): Promise<any> {
  const httpUrl = formatTursoHttpUrl(url);
  const res = await fetch(`${httpUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Turso HTTP Error (${res.status}): ${errText || res.statusText}`);
  }

  return res.json();
}

export async function executeTursoQueries(
  url: string,
  authToken: string,
  sqlStatements: string[]
): Promise<any> {
  const requests: any[] = sqlStatements.map((sql) => ({
    type: "execute",
    stmt: { sql },
  }));
  requests.push({ type: "close" });
  return executeTursoPipeline(url, authToken, requests);
}

/**
 * Sync all local SQLite tables to Turso cloud.
 */
export async function syncAllToTurso(
  customUrl?: string,
  customToken?: string
): Promise<{ success: boolean; syncedCounts: Record<string, number>; message: string }> {
  const config = getTursoConfig();
  const url = customUrl || config.url;
  const token = customToken || config.authToken;

  if (!url || !token) {
    throw new Error("Turso URL ve Auth Token yapılandırılmamış.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./db").getDatabase();

  // 1. Ensure schema exists on Turso
  const localTables = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string; sql: string }>;

  const createTableRequests: any[] = [];
  for (const t of localTables) {
    if (t.sql) {
      let sql = t.sql.trim();
      if (!sql.toUpperCase().includes("CREATE TABLE IF NOT EXISTS")) {
        sql = sql.replace(/^CREATE TABLE/i, "CREATE TABLE IF NOT EXISTS");
      }
      createTableRequests.push({
        type: "execute",
        stmt: { sql },
      });
    }
  }
  createTableRequests.push({ type: "close" });
  await executeTursoPipeline(url, token, createTableRequests);

  // 2. Dump and upsert tables
  const syncedCounts: Record<string, number> = {};

  for (const tableName of SYNC_TABLES) {
    const tableExists = localTables.find((t) => t.name === tableName);
    if (!tableExists) continue;

    const rows = db.prepare(`SELECT * FROM "${tableName}"`).all() as any[];
    if (rows.length === 0) {
      syncedCounts[tableName] = 0;
      continue;
    }

    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(", ");
    const batchSize = 40;

    for (let i = 0; i < rows.length; i += batchSize) {
      const slice = rows.slice(i, i + batchSize);
      const requests: any[] = slice.map((row) => {
        const placeholders = columns.map((_, idx) => `?${idx + 1}`).join(", ");
        const args = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) {
            return { type: "null" };
          }
          if (typeof val === "number") {
            if (Number.isInteger(val)) {
              return { type: "integer", value: String(val) };
            }
            return { type: "float", value: val };
          }
          return { type: "text", value: String(val) };
        });

        return {
          type: "execute",
          stmt: {
            sql: `INSERT OR REPLACE INTO "${tableName}" (${colList}) VALUES (${placeholders})`,
            args,
          },
        };
      });

      requests.push({ type: "close" });
      await executeTursoPipeline(url, token, requests);
    }

    syncedCounts[tableName] = rows.length;
  }

  return {
    success: true,
    syncedCounts,
    message: "Tüm mağaza verileri (ürünler, kategoriler, ayarlar) Turso bulutuna başarıyla aktarıldı!",
  };
}

/**
 * Pull all data from Turso cloud into local SQLite database.
 */
export async function pullAllFromTurso(
  customUrl?: string,
  customToken?: string
): Promise<{ success: boolean; pulledCounts: Record<string, number>; message: string }> {
  const config = getTursoConfig();
  const url = customUrl || config.url;
  const token = customToken || config.authToken;

  if (!url || !token) {
    throw new Error("Turso URL ve Auth Token yapılandırılmamış.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./db").getDatabase();
  const pulledCounts: Record<string, number> = {};

  // Fetch all tables from Turso
  const requests: any[] = SYNC_TABLES.map((t) => ({
    type: "execute",
    stmt: { sql: `SELECT * FROM "${t}"` },
  }));
  requests.push({ type: "close" });

  const response = await executeTursoPipeline(url, token, requests);

  db.transaction(() => {
    for (let i = 0; i < SYNC_TABLES.length; i++) {
      const tableName = SYNC_TABLES[i];
      const resultBlock = response.results?.[i];
      if (!resultBlock || resultBlock.type !== "ok" || !resultBlock.response?.result) {
        continue;
      }

      const { cols, rows } = resultBlock.response.result;
      if (!cols || !rows || rows.length === 0) {
        pulledCounts[tableName] = 0;
        continue;
      }

      const colNames = cols.map((c: { name: string }) => `"${c.name}"`).join(", ");
      const placeholders = cols.map(() => "?").join(", ");
      const insertSql = `INSERT OR REPLACE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;

      try {
        const stmt = db.prepare(insertSql);
        for (const rawRow of rows) {
          const values = rawRow.map((cell: { type: string; value: any }) => {
            if (!cell || cell.type === "null") return null;
            if (cell.type === "integer") return parseInt(cell.value, 10);
            if (cell.type === "float") return Number(cell.value);
            return cell.value;
          });
          stmt.run(...values);
        }
        pulledCounts[tableName] = rows.length;
      } catch (tableErr) {
        console.warn(`[Turso Pull] Warning pulling table ${tableName}:`, tableErr);
      }
    }
  })();

  return {
    success: true,
    pulledCounts,
    message: "Turso bulut verileri yerel veritabanına başarıyla aktarıldı!",
  };
}

/**
 * Background fire-and-forget sync of a specific statement to Turso.
 */
export function pushToTurso(sql: string, args: any[] = []): void {
  const config = getTursoConfig();
  if (!config.isConfigured) return;

  const formattedArgs = args.map((val) => {
    if (val === null || val === undefined) return { type: "null" };
    if (typeof val === "number") {
      if (Number.isInteger(val)) return { type: "integer", value: String(val) };
      return { type: "float", value: val };
    }
    return { type: "text", value: String(val) };
  });

  const request = [
    {
      type: "execute",
      stmt: { sql, args: formattedArgs },
    },
    { type: "close" },
  ];

  executeTursoPipeline(config.url, config.authToken, request).catch((err) => {
    console.error("[Turso Push Error]", err?.message || err);
  });
}

// Global flag to ensure single initial pull per runtime instance
declare global {
  // eslint-disable-next-line no-var
  var markasiTursoSynced: boolean | undefined;
}

/**
 * Ensure that this serverless instance has pulled the latest data from Turso.
 */
export async function ensureTursoSynced(): Promise<void> {
  if (globalThis.markasiTursoSynced) return;
  const config = getTursoConfig();
  if (!config.isConfigured) return;

  try {
    globalThis.markasiTursoSynced = true;
    await pullAllFromTurso(config.url, config.authToken);
    console.log("[Turso] Initial sync from cloud completed successfully.");
  } catch (err) {
    console.warn("[Turso] Initial sync failed, continuing with local SQLite:", err);
  }
}
