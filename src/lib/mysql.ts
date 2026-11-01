import "server-only";
import mysql from "mysql2/promise";

export type MysqlConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  isConfigured: boolean;
};

export const MYSQL_SYNC_TABLES = [
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
  "product_bundles",
  "bundle_items",
  "returns",
  "supplier_recourses",
  "pay_links",
  "member_vehicles",
];

export function getMysqlConfig(): MysqlConfig {
  const envUrl = (process.env.MYSQL_URL || process.env.DATABASE_URL || "").trim();

  let host = (process.env.MYSQL_HOST || "").trim();
  let port = parseInt(process.env.MYSQL_PORT || "3306", 10);
  let user = (process.env.MYSQL_USER || "").trim();
  let password = (process.env.MYSQL_PASSWORD || "").trim();
  let database = (process.env.MYSQL_DATABASE || "").trim();
  let ssl = process.env.MYSQL_SSL === "true" || process.env.MYSQL_SSL === "1";

  // Parse MYSQL_URL if present
  if (envUrl.startsWith("mysql://") || envUrl.startsWith("mysqls://")) {
    try {
      const parsed = new URL(envUrl);
      host = parsed.hostname;
      port = parseInt(parsed.port || "3306", 10);
      user = decodeURIComponent(parsed.username);
      password = decodeURIComponent(parsed.password);
      database = parsed.pathname.replace(/^\//, "");
      if (parsed.searchParams.has("ssl") || parsed.protocol === "mysqls:") {
        ssl = true;
      }
    } catch {}
  }

  if (host && user && database) {
    return { host, port, user, password, database, ssl, isConfigured: true };
  }

  // Fallback to site_settings if configured via Admin Panel
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSiteSettings } = require("./db");
    const settings = getSiteSettings();
    if (settings.mysql_host && settings.mysql_user && settings.mysql_database) {
      return {
        host: settings.mysql_host.trim(),
        port: parseInt(settings.mysql_port || "3306", 10),
        user: settings.mysql_user.trim(),
        password: settings.mysql_password || "",
        database: settings.mysql_database.trim(),
        ssl: settings.mysql_ssl === "1" || settings.mysql_ssl === "true",
        isConfigured: true,
      };
    }
  } catch {}

  return { host, port, user, password, database, ssl, isConfigured: false };
}

export function createMysqlConnection(config: Omit<MysqlConfig, "isConfigured">) {
  return mysql.createConnection({
    host: config.host,
    port: config.port || 3306,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    connectTimeout: 15_000,
  });
}

export async function testMysqlConnection(
  config: Omit<MysqlConfig, "isConfigured">
): Promise<{ success: boolean; version?: string; message: string }> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await createMysqlConnection(config);
    const [rows] = await conn.query("SELECT VERSION() as version");
    const version = (rows as any)?.[0]?.version || "Bilinmiyor";
    return {
      success: true,
      version: String(version),
      message: `MySQL bağlantısı başarılı! (Sürüm: ${version})`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "MySQL sunucusuna bağlanılamadı.";
    return { success: false, message: msg };
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}

/**
 * Creates MySQL tables with correct utf8mb4 collation and primary keys.
 */
export async function initMysqlSchema(conn: mysql.Connection) {
  const tableDefinitions = [
    `CREATE TABLE IF NOT EXISTS site_settings (
      \`key\` VARCHAR(191) PRIMARY KEY,
      \`value\` LONGTEXT NOT NULL,
      \`category\` VARCHAR(100) DEFAULT 'general'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS categories (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(191) NOT NULL,
      \`slug\` VARCHAR(191) DEFAULT '',
      \`parent_id\` VARCHAR(191) DEFAULT NULL,
      \`sort_order\` INT DEFAULT 0,
      \`icon\` LONGTEXT,
      \`banner\` LONGTEXT,
      \`seo_title\` VARCHAR(255) DEFAULT '',
      \`seo_description\` TEXT,
      \`default_margin\` DECIMAL(5,2) DEFAULT 20.00,
      \`is_vehicle_tree\` TINYINT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_categories_parent\` (\`parent_id\`),
      INDEX \`idx_categories_vehicle\` (\`is_vehicle_tree\`),
      INDEX \`idx_categories_name\` (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS products (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`brand\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      \`code\` VARCHAR(191) NOT NULL UNIQUE,
      \`kind\` VARCHAR(50) NOT NULL,
      \`category\` VARCHAR(191) NOT NULL,
      \`price\` INT NOT NULL,
      \`cost\` INT NOT NULL,
      \`central_stock\` INT DEFAULT 0,
      \`shelf\` VARCHAR(100) DEFAULT '',
      \`fitment\` VARCHAR(255) DEFAULT '',
      \`sku\` VARCHAR(100) DEFAULT '',
      \`barcode\` VARCHAR(100) DEFAULT '',
      \`oem_codes\` LONGTEXT,
      \`manufacturer_brand\` VARCHAR(191) DEFAULT '',
      \`condition\` VARCHAR(50) DEFAULT 'Sıfır',
      \`warranty_months\` INT DEFAULT 12,
      \`desi\` DECIMAL(6,2) DEFAULT 1.00,
      \`weight_kg\` DECIMAL(6,2) DEFAULT 1.00,
      \`corridor\` VARCHAR(50) DEFAULT '',
      \`bin\` VARCHAR(50) DEFAULT '',
      \`discount_price\` INT DEFAULT 0,
      \`currency\` VARCHAR(10) DEFAULT 'TL',
      \`vat_rate\` INT DEFAULT 20,
      \`source_url\` TEXT,
      \`source_last_price\` INT DEFAULT 0,
      \`source_last_checked\` VARCHAR(50) DEFAULT '',
      \`description\` LONGTEXT,
      \`specs_json\` LONGTEXT,
      \`is_bundle\` TINYINT DEFAULT 0,
      \`status\` VARCHAR(50) DEFAULT 'published',
      \`seo_slug\` VARCHAR(191) DEFAULT '',
      \`seo_title\` VARCHAR(255) DEFAULT '',
      \`seo_description\` TEXT,
      \`tags\` LONGTEXT,
      \`compatible_vehicles\` LONGTEXT,
      \`position\` VARCHAR(100) DEFAULT 'Yönsüz / Evrensel',
      \`has_core_deposit\` TINYINT DEFAULT 0,
      \`core_deposit_price\` INT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS product_images (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`product_id\` VARCHAR(191) NOT NULL,
      \`image_url\` LONGTEXT NOT NULL,
      \`sort_order\` INT DEFAULT 0,
      \`is_primary\` TINYINT DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS supplier_stock (
      \`product_id\` VARCHAR(191) NOT NULL,
      \`supplier\` VARCHAR(191) NOT NULL,
      \`quantity\` INT NOT NULL DEFAULT 0,
      \`delivery\` VARCHAR(100) DEFAULT '',
      \`purchase_price\` INT DEFAULT 0,
      PRIMARY KEY (\`product_id\`, \`supplier\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS admins (
      \`email\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(191) NOT NULL,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`role\` VARCHAR(50) DEFAULT 'Super Admin',
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS members (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`google_subject\` VARCHAR(191) UNIQUE,
      \`password_hash\` VARCHAR(255) DEFAULT NULL,
      \`email\` VARCHAR(191) NOT NULL UNIQUE,
      \`name\` VARCHAR(191) NOT NULL,
      \`phone\` VARCHAR(50) DEFAULT '',
      \`active\` TINYINT DEFAULT 1,
      \`b2b_group_id\` VARCHAR(191) DEFAULT NULL,
      \`tax_number\` VARCHAR(50) DEFAULT '',
      \`tax_office\` VARCHAR(100) DEFAULT '',
      \`company_name\` VARCHAR(255) DEFAULT '',
      \`balance\` INT DEFAULT 0,
      \`credit_limit\` INT DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS sliders_banners (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`title\` VARCHAR(255) NOT NULL,
      \`subtitle\` VARCHAR(255) DEFAULT '',
      \`image_url\` LONGTEXT NOT NULL,
      \`target_url\` LONGTEXT DEFAULT '',
      \`button_text\` VARCHAR(100) DEFAULT '',
      \`type\` VARCHAR(50) DEFAULT 'slider',
      \`sort_order\` INT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS cms_pages (
      \`slug\` VARCHAR(191) PRIMARY KEY,
      \`title\` VARCHAR(255) NOT NULL,
      \`content\` LONGTEXT NOT NULL,
      \`seo_title\` VARCHAR(255) DEFAULT '',
      \`seo_description\` TEXT,
      \`active\` TINYINT DEFAULT 1,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS currency_rates (
      \`currency\` VARCHAR(10) PRIMARY KEY,
      \`rate_to_try\` DECIMAL(10,4) NOT NULL,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS shipping_rules (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`carrier_name\` VARCHAR(100) NOT NULL,
      \`base_cost\` INT NOT NULL,
      \`extra_per_desi\` INT DEFAULT 0,
      \`free_shipping_threshold\` INT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS pos_installments (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`bank_name\` VARCHAR(100) NOT NULL,
      \`installment_count\` INT NOT NULL,
      \`commission_rate\` DECIMAL(5,2) DEFAULT 0.00,
      \`active\` TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS b2b_groups (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(100) NOT NULL,
      \`discount_percent\` DECIMAL(5,2) DEFAULT 0.00,
      \`payment_term_days\` INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS coupons (
      \`code\` VARCHAR(191) PRIMARY KEY,
      \`discount_type\` VARCHAR(20) NOT NULL,
      \`discount_value\` DECIMAL(10,2) NOT NULL,
      \`min_basket_amount\` INT DEFAULT 0,
      \`max_discount_amount\` INT DEFAULT 0,
      \`valid_until\` VARCHAR(50) DEFAULT NULL,
      \`usage_limit\` INT DEFAULT 0,
      \`used_count\` INT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS orders (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`user_email\` VARCHAR(191) NOT NULL,
      \`total_amount\` INT NOT NULL,
      \`status\` VARCHAR(50) DEFAULT 'Hazırlanıyor',
      \`payment_method\` VARCHAR(50) DEFAULT 'CreditCard',
      \`shipping_address\` LONGTEXT,
      \`cargo_tracking_number\` VARCHAR(100) DEFAULT '',
      \`cargo_carrier\` VARCHAR(100) DEFAULT '',
      \`notes\` TEXT,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS order_items (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`order_id\` VARCHAR(191) NOT NULL,
      \`product_id\` VARCHAR(191) NOT NULL,
      \`quantity\` INT NOT NULL,
      \`unit_price\` INT NOT NULL,
      \`total_price\` INT NOT NULL,
      INDEX \`idx_order_items_order\` (\`order_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS product_bundles (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`title\` VARCHAR(255) NOT NULL,
      \`description\` TEXT,
      \`discount_percent\` DECIMAL(5,2) DEFAULT 0.00,
      \`active\` TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS bundle_items (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`bundle_id\` VARCHAR(191) NOT NULL,
      \`product_id\` VARCHAR(191) NOT NULL,
      \`quantity\` INT DEFAULT 1,
      INDEX \`idx_bundle_items_bundle\` (\`bundle_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS returns (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`order_id\` VARCHAR(191) NOT NULL,
      \`user_email\` VARCHAR(191) NOT NULL,
      \`reason\` TEXT,
      \`status\` VARCHAR(50) DEFAULT 'Talep Alındı',
      \`refund_amount\` INT DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS supplier_recourses (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`supplier\` VARCHAR(191) NOT NULL,
      \`reason\` TEXT,
      \`amount\` INT NOT NULL,
      \`status\` VARCHAR(50) DEFAULT 'Beklemede',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS pay_links (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`code\` VARCHAR(100) NOT NULL UNIQUE,
      \`amount\` INT NOT NULL,
      \`description\` VARCHAR(255) DEFAULT '',
      \`status\` VARCHAR(50) DEFAULT 'pending',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS member_vehicles (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`member_id\` VARCHAR(191) NOT NULL,
      \`plate\` VARCHAR(50) DEFAULT '',
      \`brand\` VARCHAR(100) NOT NULL,
      \`model\` VARCHAR(100) NOT NULL,
      \`year\` INT DEFAULT 0,
      \`engine\` VARCHAR(100) DEFAULT '',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_member_vehicles_member\` (\`member_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  for (const query of tableDefinitions) {
    try {
      await conn.query(query);
    } catch (err) {
      console.warn("[MySQL Schema Warning]", err);
    }
  }
}

/**
 * Synchronize local SQLite store data to MySQL.
 * High-performance bulk chunking with bidirectional deletion mirror.
 */
export async function syncAllToMysql(
  customConfig?: Omit<MysqlConfig, "isConfigured">,
  tablesToSync?: string[]
): Promise<{ success: boolean; syncedCounts: Record<string, number>; message: string }> {
  const config = customConfig || getMysqlConfig();
  if (!config.host || !config.user || !config.database) {
    throw new Error("MySQL bağlantı ayarları eksik.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./db").getDatabase();
  const conn = await createMysqlConnection(config);

  const syncedCounts: Record<string, number> = {};
  const targetTables =
    tablesToSync && tablesToSync.length > 0
      ? MYSQL_SYNC_TABLES.filter((t) => tablesToSync.includes(t))
      : MYSQL_SYNC_TABLES;

  try {
    // 1. Ensure MySQL Schema
    await initMysqlSchema(conn);

    // 2. Dump, mirror deletions, and bulk upsert tables
    for (const tableName of targetTables) {
      const rows = db.prepare(`SELECT * FROM "${tableName}"`).all() as any[];
      if (rows.length === 0) {
        // Empty table: purge MySQL mirror
        await conn.query(`DELETE FROM \`${tableName}\``).catch(() => {});
        syncedCounts[tableName] = 0;
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colList = columns.map((c) => `\`${c}\``).join(", ");
      const singlePlaceholders = `(${columns.map(() => "?").join(", ")})`;
      const updateClause = columns
        .filter((c) => c !== "id" && c !== "key" && c !== "code")
        .map((c) => `\`${c}\`=VALUES(\`${c}\`)`)
        .join(", ");

      // Mirror Deletions: Delete rows in MySQL that no longer exist in SQLite
      const idKey = rows[0].id !== undefined ? "id" : rows[0].key !== undefined ? "key" : rows[0].code !== undefined ? "code" : null;
      if (idKey) {
        try {
          const localIdSet = new Set(rows.map((r) => String(r[idKey])).filter(Boolean));
          const [remoteRows] = await conn.query(`SELECT \`${idKey}\` FROM \`${tableName}\``);
          const toDelete = (remoteRows as any[])
            .map((r) => String(r[idKey]))
            .filter((idVal) => !localIdSet.has(idVal));

          if (toDelete.length > 0) {
            const delChunk = 200;
            for (let d = 0; d < toDelete.length; d += delChunk) {
              const slice = toDelete.slice(d, d + delChunk);
              const inPlaceholders = slice.map(() => "?").join(", ");
              await conn.query(`DELETE FROM \`${tableName}\` WHERE \`${idKey}\` IN (${inPlaceholders})`, slice);
            }
          }
        } catch (delErr) {
          console.warn(`[MySQL Sync Mirror] Warning deleting stale rows from ${tableName}:`, delErr);
        }
      }

      // Fast Bulk Upsert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const bulkPlaceholders = batch.map(() => singlePlaceholders).join(", ");
        const bulkSql = updateClause
          ? `INSERT INTO \`${tableName}\` (${colList}) VALUES ${bulkPlaceholders} ON DUPLICATE KEY UPDATE ${updateClause}`
          : `INSERT IGNORE INTO \`${tableName}\` (${colList}) VALUES ${bulkPlaceholders}`;

        const bulkValues: any[] = [];
        for (const r of batch) {
          for (const c of columns) {
            const val = r[c];
            bulkValues.push(val === undefined || val === null ? null : val);
          }
        }
        await conn.query(bulkSql, bulkValues);
      }

      syncedCounts[tableName] = rows.length;
    }

    return {
      success: true,
      syncedCounts,
      message: "Veriler MySQL veritabanına başarıyla senkronize edildi!",
    };
  } finally {
    try {
      await conn.end();
    } catch {}
  }
}

/**
 * Pull store data from MySQL into local SQLite database.
 * Deletes rows locally that were removed in MySQL.
 */
export async function pullAllFromMysql(
  customConfig?: Omit<MysqlConfig, "isConfigured">,
  tablesToPull?: string[]
): Promise<{ success: boolean; pulledCounts: Record<string, number>; message: string }> {
  const config = customConfig || getMysqlConfig();
  if (!config.host || !config.user || !config.database) {
    throw new Error("MySQL bağlantı ayarları eksik.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./db").getDatabase();
  const conn = await createMysqlConnection(config);
  const pulledCounts: Record<string, number> = {};

  const targetTables =
    tablesToPull && tablesToPull.length > 0
      ? MYSQL_SYNC_TABLES.filter((t) => tablesToPull.includes(t))
      : MYSQL_SYNC_TABLES;

  try {
    for (const tableName of targetTables) {
      try {
        const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
        const list = rows as any[];
        if (!list || list.length === 0) {
          pulledCounts[tableName] = 0;
          continue;
        }

        const columns = Object.keys(list[0]);
        const colList = columns.map((c) => `"${c}"`).join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        const insertSql = `INSERT OR REPLACE INTO "${tableName}" (${colList}) VALUES (${placeholders})`;

        // If table has primary key, delete local rows that were removed in MySQL
        const idKey = list[0].id !== undefined ? "id" : list[0].key !== undefined ? "key" : list[0].code !== undefined ? "code" : null;

        db.transaction(() => {
          if (idKey) {
            const remoteIdSet = new Set(list.map((r) => String(r[idKey])).filter(Boolean));
            const localRows = db.prepare(`SELECT "${idKey}" FROM "${tableName}"`).all() as any[];
            const toDeleteLocal = localRows
              .map((r) => String(r[idKey]))
              .filter((idVal) => !remoteIdSet.has(idVal));

            if (toDeleteLocal.length > 0) {
              const delStmt = db.prepare(`DELETE FROM "${tableName}" WHERE "${idKey}" = ?`);
              for (const delId of toDeleteLocal) {
                delStmt.run(delId);
              }
            }
          }

          const stmt = db.prepare(insertSql);
          for (const row of list) {
            const values = columns.map((c) => {
              const val = row[c];
              if (val === null || val === undefined) return null;
              if (val instanceof Date) {
                return val.toISOString().replace("T", " ").replace(/\..*$/, "");
              }
              if (typeof val === "boolean") {
                return val ? 1 : 0;
              }
              if (typeof val === "object" && !Buffer.isBuffer(val)) {
                return JSON.stringify(val);
              }
              return val;
            });
            stmt.run(...values);
          }
        })();

        pulledCounts[tableName] = list.length;
      } catch (tableErr) {
        console.warn(`[MySQL Pull] Warning reading table ${tableName}:`, tableErr);
      }
    }

    return {
      success: true,
      pulledCounts,
      message: "MySQL bulut veritabanından tüm veriler başarıyla yerel sisteme indirildi!",
    };
  } finally {
    try {
      await conn.end();
    } catch {}
  }
}

/**
 * Background fire-and-forget sync to MySQL.
 */
export function pushToMysql(sql: string, params: any[] = []): void {
  const config = getMysqlConfig();
  if (!config.isConfigured) return;

  createMysqlConnection(config)
    .then(async (conn) => {
      try {
        await conn.query(sql, params);
      } finally {
        await conn.end().catch(() => {});
      }
    })
    .catch((err) => {
      console.warn("[MySQL Push Warning]", err?.message || err);
    });
}

// Global flag to ensure single initial pull per runtime instance
declare global {
  // eslint-disable-next-line no-var
  var markasiMysqlSynced: boolean | undefined;
}

/**
 * Ensure that this serverless instance has pulled the latest data from MySQL.
 */
export async function ensureMysqlSynced(): Promise<void> {
  if (globalThis.markasiMysqlSynced) return;
  const config = getMysqlConfig();
  if (!config.isConfigured) return;

  try {
    await pullAllFromMysql(config);
    globalThis.markasiMysqlSynced = true;
    console.log("[MySQL] Initial sync from MySQL completed successfully.");
  } catch (err) {
    console.warn("[MySQL] Initial sync failed, continuing with local SQLite:", err);
  }
}

