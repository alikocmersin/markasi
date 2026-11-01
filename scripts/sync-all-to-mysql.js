const Database = require("better-sqlite3");
const mysql = require("mysql2/promise");
const fs = require("node:fs");

const MYSQL_CONFIG = {
  host: "gateway01.eu-central-1.prod.aws.tidbcloud.com",
  port: 4000,
  user: "2tZRUTFQPNsQRjD.root",
  password: "C8P5UsZ8P7xaxaEO",
  database: "markasi",
  ssl: { rejectUnauthorized: true },
};

const SYNC_TABLES = [
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

async function main() {
  console.log("1. Connecting to TiDB Cloud MySQL...");
  // First ensure markasi database exists
  const initialConn = await mysql.createConnection({
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    password: MYSQL_CONFIG.password,
    ssl: MYSQL_CONFIG.ssl,
  });
  await initialConn.query(
    "CREATE DATABASE IF NOT EXISTS `markasi` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
  );
  await initialConn.end();

  const conn = await mysql.createConnection(MYSQL_CONFIG);
  console.log("Connected to database `markasi` on TiDB!");

  console.log("2. Creating MySQL tables...");
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
  console.log("All tables created successfully!");

  console.log("3. Syncing data from local SQLite to MySQL...");
  const db = new Database("data/markasi.sqlite");

  for (const tableName of SYNC_TABLES) {
    const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
    if (rows.length === 0) {
      console.log(`- ${tableName}: 0 rows (skipped)`);
      continue;
    }

    console.log(`- Syncing ${tableName} (${rows.length} rows)...`);
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
  }

  // 4. Verify in MySQL
  console.log("\n4. Verifying records in MySQL...");
  for (const t of SYNC_TABLES) {
    const [res] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    console.log(`  ✓ ${t}: ${(res)[0].cnt} rows in MySQL`);
  }

  await conn.end();

  // 5. Save credentials to local SQLite site_settings and .env.local
  console.log("\n5. Saving MySQL credentials to site settings & .env.local...");
  const setSettingStmt = db.prepare(`
    INSERT INTO site_settings (key, value, category) VALUES (?, ?, 'database')
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  setSettingStmt.run("mysql_host", MYSQL_CONFIG.host);
  setSettingStmt.run("mysql_port", String(MYSQL_CONFIG.port));
  setSettingStmt.run("mysql_user", MYSQL_CONFIG.user);
  setSettingStmt.run("mysql_password", MYSQL_CONFIG.password);
  setSettingStmt.run("mysql_database", MYSQL_CONFIG.database);
  setSettingStmt.run("mysql_ssl", "1");

  if (fs.existsSync(".env.local")) {
    let env = fs.readFileSync(".env.local", "utf8");
    const vars = [
      { key: "MYSQL_HOST", val: MYSQL_CONFIG.host },
      { key: "MYSQL_PORT", val: String(MYSQL_CONFIG.port) },
      { key: "MYSQL_USER", val: MYSQL_CONFIG.user },
      { key: "MYSQL_PASSWORD", val: MYSQL_CONFIG.password },
      { key: "MYSQL_DATABASE", val: MYSQL_CONFIG.database },
      { key: "MYSQL_SSL", val: "true" },
    ];
    for (const { key, val } of vars) {
      const reg = new RegExp(`^${key}=.*$`, "m");
      if (env.match(reg)) {
        env = env.replace(reg, `${key}=${val}`);
      } else {
        env += `\n${key}=${val}`;
      }
    }
    fs.writeFileSync(".env.local", env, "utf8");
  }

  console.log("\nDONE! All store data is 100% synchronized to TiDB Cloud MySQL!");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
