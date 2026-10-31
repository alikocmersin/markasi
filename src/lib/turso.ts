import { getDatabase, getSiteSettings } from "./db";

export type TursoConfig = {
  url: string;
  authToken: string;
  isConfigured: boolean;
};

export function getTursoConfig(): TursoConfig {
  const envUrl = (process.env.TURSO_DATABASE_URL || "").trim();
  const envToken = (process.env.TURSO_AUTH_TOKEN || "").trim();

  if (envUrl && envToken) {
    return { url: envUrl, authToken: envToken, isConfigured: true };
  }

  try {
    const settings = getSiteSettings();
    const dbUrl = (settings.turso_url || "").trim();
    const dbToken = (settings.turso_auth_token || "").trim();
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

export async function testTursoConnection(url: string, authToken: string): Promise<{ success: boolean; message: string }> {
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

export async function executeTursoQueries(url: string, authToken: string, sqlStatements: string[]): Promise<any> {
  const httpUrl = formatTursoHttpUrl(url);
  const requests = sqlStatements.map((sql) => ({
    type: "execute",
    stmt: { sql },
  }));
  requests.push({ type: "close" } as any);

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
    throw new Error(`Turso sorgu yürütme hatası (${res.status}): ${errText}`);
  }

  return res.json();
}
