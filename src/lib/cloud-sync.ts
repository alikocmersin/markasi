import "server-only";
import { getMysqlConfig, syncAllToMysql, pushToMysql, ensureMysqlSynced } from "./mysql";
import { getTursoConfig, syncAllToTurso, pushToTurso, ensureTursoSynced } from "./turso";

/**
 * Trigger background full sync to active cloud databases (MySQL and/or Turso).
 */
export async function syncCloudDatabase(tables?: string[]): Promise<void> {
  const mysqlConfig = getMysqlConfig();
  const tursoConfig = getTursoConfig();

  const promises: Promise<any>[] = [];

  if (mysqlConfig.isConfigured) {
    promises.push(
      syncAllToMysql().catch((err) =>
        console.warn("[CloudSync MySQL Error]", err?.message || err)
      )
    );
  }

  if (tursoConfig.isConfigured) {
    promises.push(
      syncAllToTurso().catch((err) =>
        console.warn("[CloudSync Turso Error]", err?.message || err)
      )
    );
  }

  await Promise.all(promises);
}

/**
 * Mirror an individual query across active cloud databases.
 */
export function pushToCloudDatabase(
  mysqlSql: string,
  tursoSql: string,
  params: any[] = []
): void {
  try {
    const mysqlConfig = getMysqlConfig();
    if (mysqlConfig.isConfigured) {
      pushToMysql(mysqlSql, params);
    }
  } catch {}

  try {
    const tursoConfig = getTursoConfig();
    if (tursoConfig.isConfigured) {
      pushToTurso(tursoSql, params);
    }
  } catch {}
}

/**
 * Initialize / hydrate the active cloud database into local memory on cold start.
 * With a fast timeout so it never blocks page rendering.
 */
export async function ensureCloudDatabaseSynced(): Promise<void> {
  const promises: Promise<any>[] = [];

  try {
    const mysqlConfig = getMysqlConfig();
    if (mysqlConfig.isConfigured) {
      promises.push(ensureMysqlSynced());
    }
  } catch {}

  try {
    const tursoConfig = getTursoConfig();
    if (tursoConfig.isConfigured) {
      promises.push(ensureTursoSynced());
    }
  } catch {}

  if (promises.length === 0) return;

  // Enforce 3.5s timeout so SSR page response is never delayed
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3500));
  await Promise.race([Promise.all(promises), timeoutPromise]);
}

