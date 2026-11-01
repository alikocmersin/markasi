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
      \`name\` VARCHAR(191) NOT NULL UNIQUE,
      \`slug\` VARCHAR(191) DEFAULT '',
      \`parent_id\` VARCHAR(191) DEFAULT NULL,
      \`sort_order\` INT DEFAULT 0,
      \`icon\` TEXT,
      \`banner\` TEXT,
      \`seo_title\` VARCHAR(255) DEFAULT '',
      \`seo_description\` TEXT,
      \`default_margin\` DECIMAL(5,2) DEFAULT 20.00,
      \`is_vehicle_tree\` TINYINT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      \`image_url\` TEXT NOT NULL,
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
      \`tc_identity_encrypted\` TEXT,
      \`address_line\` TEXT,
      \`district\` VARCHAR(100) DEFAULT '',
      \`city\` VARCHAR(100) DEFAULT '',
      \`postal_code\` VARCHAR(20) DEFAULT '',
      \`b2b_group_id\` VARCHAR(191) DEFAULT NULL,
      \`company_title\` VARCHAR(255) DEFAULT '',
      \`tax_office\` VARCHAR(100) DEFAULT '',
      \`tax_number\` VARCHAR(50) DEFAULT '',
      \`credit_balance\` INT DEFAULT 0,
      \`is_banned\` TINYINT DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS sliders_banners (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`title\` VARCHAR(255) NOT NULL,
      \`subtitle\` VARCHAR(255) DEFAULT '',
      \`image_desktop\` TEXT NOT NULL,
      \`image_mobile\` TEXT,
      \`link_url\` TEXT,
      \`button_text\` VARCHAR(100) DEFAULT '',
      \`position\` VARCHAR(100) DEFAULT 'hero_slider',
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
      \`rate\` DECIMAL(10,4) NOT NULL,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS shipping_rules (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(191) NOT NULL,
      \`min_desi\` DECIMAL(6,2) DEFAULT 0.00,
      \`max_desi\` DECIMAL(6,2) DEFAULT 9999.00,
      \`price\` INT NOT NULL,
      \`free_shipping_threshold\` INT DEFAULT 0,
      \`active\` TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS pos_installments (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`bank_name\` VARCHAR(191) NOT NULL,
      \`card_program\` VARCHAR(191) NOT NULL,
      \`installment_count\` INT NOT NULL,
      \`commission_rate\` DECIMAL(5,2) NOT NULL,
      \`active\` TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS b2b_groups (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(191) NOT NULL,
      \`discount_percent\` DECIMAL(5,2) DEFAULT 0.00,
      \`description\` TEXT,
      \`min_order_amount\` INT DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS coupons (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`code\` VARCHAR(191) NOT NULL UNIQUE,
      \`discount_type\` VARCHAR(20) NOT NULL,
      \`discount_value\` DECIMAL(10,2) NOT NULL,
      \`min_order_amount\` INT DEFAULT 0,
      \`usage_limit\` INT DEFAULT 100,
      \`used_count\` INT DEFAULT 0,
      \`expires_at\` VARCHAR(50) DEFAULT NULL,
      \`active\` TINYINT DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS orders (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`customer_name\` VARCHAR(191) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`phone\` VARCHAR(50) NOT NULL,
      \`address\` TEXT NOT NULL,
      \`payment_method\` VARCHAR(100) NOT NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'Yeni',
      \`total\` INT NOT NULL,
      \`vin_number\` VARCHAR(100) DEFAULT '',
      \`license_plate_photo\` TEXT,
      \`vin_status\` VARCHAR(50) DEFAULT 'Bekliyor',
      \`courier_company\` VARCHAR(100) DEFAULT '',
      \`tracking_code\` VARCHAR(100) DEFAULT '',
      \`shipping_status\` VARCHAR(50) DEFAULT 'Hazırlanıyor',
      \`shipping_cost\` INT DEFAULT 0,
      \`pos_commission\` INT DEFAULT 0,
      \`purchase_cost\` INT DEFAULT 0,
      \`net_profit\` INT DEFAULT 0,
      \`invoice_status\` VARCHAR(50) DEFAULT 'Kesilmedi',
      \`customer_notes\` TEXT,
      \`admin_notes\` TEXT,
      \`member_id\` VARCHAR(191) DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS order_items (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`order_id\` VARCHAR(191) NOT NULL,
      \`product_id\` VARCHAR(191) NOT NULL,
      \`product_name\` VARCHAR(255) NOT NULL,
      \`code\` VARCHAR(191) NOT NULL,
      \`quantity\` INT NOT NULL,
      \`unit_price\` INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  for (const sql of tableDefinitions) {
    await conn.query(sql);
  }
}

/**
 * Synchronize all local SQLite store data to MySQL.
 */
export async function syncAllToMysql(
  customConfig?: Omit<MysqlConfig, "isConfigured">
): Promise<{ success: boolean; syncedCounts: Record<string, number>; message: string }> {
  const config = customConfig || getMysqlConfig();
  if (!config.host || !config.user || !config.database) {
    throw new Error("MySQL bağlantı ayarları eksik.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./db").getDatabase();
  const conn = await createMysqlConnection(config);

  const syncedCounts: Record<string, number> = {};

  try {
    // 1. Ensure MySQL Schema
    await initMysqlSchema(conn);

    // 2. Dump and upsert tables
    for (const tableName of MYSQL_SYNC_TABLES) {
      const rows = db.prepare(`SELECT * FROM "${tableName}"`).all() as any[];
      if (rows.length === 0) {
        syncedCounts[tableName] = 0;
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colList = columns.map((c) => `\`${c}\``).join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      const updateClause = columns
        .filter((c) => c !== "id" && c !== "key" && c !== "code")
        .map((c) => `\`${c}\`=VALUES(\`${c}\`)`)
        .join(", ");

      const sql = updateClause
        ? `INSERT INTO \`${tableName}\` (${colList}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`
        : `INSERT IGNORE INTO \`${tableName}\` (${colList}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return null;
          return val;
        });
        await conn.query(sql, values);
      }

      syncedCounts[tableName] = rows.length;
    }

    return {
      success: true,
      syncedCounts,
      message: "Tüm mağaza verileri (ürünler, kategoriler, ayarlar) MySQL veritabanına başarıyla aktarıldı!",
    };
  } finally {
    try {
      await conn.end();
    } catch {}
  }
}

/**
 * Pull all store data from MySQL into local SQLite database.
 */
export async function pullAllFromMysql(
  customConfig?: Omit<MysqlConfig, "isConfigured">
): Promise<{ success: boolean; pulledCounts: Record<string, number>; message: string }> {
  const config = customConfig || getMysqlConfig();
  if (!config.host || !config.user || !config.database) {
    throw new Error("MySQL bağlantı ayarları eksik.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./db").getDatabase();
  const conn = await createMysqlConnection(config);
  const pulledCounts: Record<string, number> = {};

  try {
    for (const tableName of MYSQL_SYNC_TABLES) {
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

        db.transaction(() => {
          const stmt = db.prepare(insertSql);
          for (const row of list) {
            const values = columns.map((c) => row[c] ?? null);
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
    globalThis.markasiMysqlSynced = true;
    await pullAllFromMysql(config);
    console.log("[MySQL] Initial sync from MySQL completed successfully.");
  } catch (err) {
    console.warn("[MySQL] Initial sync failed, continuing with local SQLite:", err);
  }
}

