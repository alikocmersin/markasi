import "server-only";

import Database from "better-sqlite3";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createOpelDemoProducts } from "@/data/opel-demo-products";
import { vehicleCatalog } from "@/data/vehicle-catalog";

export type SupplierStock = {
  supplier: string;
  quantity: number;
  delivery: string;
  purchasePrice?: number;
};

export type VehicleFitment = {
  brand: string;
  model: string;
  generation?: string;
  engine?: string;
  yearRange?: string;
};

export type Product = {
  id: string;
  brand: string;
  name: string;
  code: string;
  kind: "OEM" | "Eşdeğer";
  category: string;
  price: number;
  cost: number;
  centralStock: number;
  shelf: string;
  xmlStock: SupplierStock[];
  fitment: string;
  // Extended Enterprise Fields
  sku?: string;
  barcode?: string;
  oemCodes?: string[];
  manufacturerBrand?: string;
  condition?: "Sıfır" | "Çıkma" | "Yenilenmiş";
  warrantyMonths?: number;
  desi?: number;
  weightKg?: number;
  corridor?: string;
  bin?: string;
  discountPrice?: number;
  currency?: "TL" | "USD" | "EUR";
  vatRate?: number;
  sourceUrl?: string;
  sourceLastPrice?: number;
  sourceLastChecked?: string;
  description?: string;
  specsJson?: string;
  isBundle?: boolean;
  images?: string[];
  compatibleVehicles?: VehicleFitment[];
  position?: string;
  hasCoreDeposit?: boolean;
  coreDepositPrice?: number;
};

export type OrderStatus =
  | "Yeni"
  | "Hazırlanıyor"
  | "Kargoya verildi"
  | "Tamamlandı"
  | "İptal edildi";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  icon: string;
  banner: string;
  seoTitle: string;
  seoDescription: string;
  defaultMargin: number;
  isVehicleTree: boolean;
  active: boolean;
  productCount?: number;
  children?: CategoryItem[];
};

export type OrderDetail = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: Array<{
    id?: number;
    productId: string;
    name: string;
    code: string;
    quantity: number;
    unitPrice: number;
    shelf?: string;
    corridor?: string;
    bin?: string;
  }>;
  vinNumber: string;
  licensePlatePhoto: string;
  vinStatus: "Bekliyor" | "Uyumlu" | "Uyumsuz";
  courierCompany: string;
  trackingCode: string;
  shippingStatus: string;
  shippingCost: number;
  posCommission: number;
  purchaseCost: number;
  netProfit: number;
  invoiceStatus: "Kesilmedi" | "Kesildi" | "İptal";
  customerNotes: string;
  adminNotes: string;
};

export type ReturnItem = {
  id: string;
  orderId: string;
  productId: string;
  customerName: string;
  reason: string;
  customerNote: string;
  photoUrl: string;
  status: "Bekliyor" | "Onaylandı" | "Reddedildi" | "Tamamlandı";
  refundAmount: number;
  createdAt: string;
};

export type SupplierRecourse = {
  id: string;
  returnId?: string;
  productId: string;
  supplier: string;
  partCode: string;
  problemDescription: string;
  status: "Tedarikçiye Gönderildi" | "İncelemede" | "Kabul Edildi (İade/Değişim)" | "Reddedildi";
  resolutionNote: string;
  createdAt: string;
};

export type B2BGroup = {
  id: string;
  name: string;
  discountPercent: number;
  description: string;
  minOrderAmount: number;
  createdAt: string;
  memberCount?: number;
};

export type MemberDetail = {
  id: string;
  googleSubject?: string;
  email: string;
  name: string;
  phone: string;
  addressLine: string;
  district: string;
  city: string;
  postalCode: string;
  b2bGroupId: string | null;
  b2bGroupName?: string;
  b2bDiscountPercent?: number;
  companyTitle: string;
  taxOffice: string;
  taxNumber: string;
  creditBalance: number;
  isBanned: boolean;
  createdAt: string;
  vehicles?: MemberVehicle[];
  orderCount?: number;
};

export type MemberVehicle = {
  id: string;
  memberId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: string;
  vin: string;
  nextMaintenanceDate: string;
  lastMaintenanceDate: string;
  notes: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export type PayLink = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  partDescription: string;
  amount: number;
  status: "Ödenmedi" | "Ödendi" | "İptal";
  orderId?: string;
  createdBy: string;
  expiresAt?: string;
  createdAt: string;
};

export type AbandonedCart = {
  id: string;
  memberId?: string;
  email: string;
  phone: string;
  itemsJson: string;
  totalAmount: number;
  lastNotifiedAt?: string;
  createdAt: string;
};

export type CurrencyRate = {
  currency: string;
  rate: number;
  updatedAt: string;
};

export type PosInstallment = {
  id: number;
  bankName: string;
  cardProgram: string;
  installmentCount: number;
  commissionRate: number;
  active: boolean;
};

export type ShippingRule = {
  id: number;
  name: string;
  minDesi: number;
  maxDesi: number;
  price: number;
  freeShippingThreshold: number;
  active: boolean;
};

export type SliderBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageDesktop: string;
  imageMobile: string;
  linkUrl: string;
  buttonText: string;
  position: "hero_slider" | "top_banner" | "middle_banner" | "bottom_banner";
  sortOrder: number;
  active: boolean;
  createdAt: string;
};

export type CmsPage = {
  slug: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  active: boolean;
  updatedAt: string;
};

export type AuditLog = {
  id: number;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
};

declare global {
  var markasiDatabase: Database.Database | undefined;
  var markasiSearchFunctionRegistered: boolean | undefined;
}

export function normalizeProductSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]/g, "");
}

function addColumnIfNotExists(
  database: Database.Database,
  table: string,
  column: string,
  definition: string,
) {
  const columns = database
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (!columns.some((col) => col.name === column)) {
    try {
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (error) {
      console.warn(`Column ${column} could not be added to ${table}:`, error);
    }
  }
}

const seedProducts = [
  {
    id: "oil-filter-oem",
    brand: "MANN-FILTER",
    name: "Yağ Filtresi",
    code: "04E 115 561 H",
    kind: "OEM",
    category: "Filtreler",
    price: 38500,
    cost: 24800,
    centralStock: 18,
    shelf: "04",
    fitment: "Volkswagen Golf 7 · 1.4 TSI",
    suppliers: [
      ["Marmara Otomotiv", 42, "Bugün kargoda"],
      ["Anadolu Parça", 12, "1 iş günü"],
    ],
  },
  {
    id: "oil-filter-equivalent",
    brand: "BOSCH",
    name: "Yağ Filtresi",
    code: "F 026 407 157",
    kind: "Eşdeğer",
    category: "Filtreler",
    price: 21900,
    cost: 13200,
    centralStock: 31,
    shelf: "05",
    fitment: "Volkswagen Golf 7 · 1.4 TSI",
    suppliers: [
      ["Ege Yedek Parça", 26, "Bugün kargoda"],
      ["Marmara Otomotiv", 8, "1 iş günü"],
    ],
  },
  {
    id: "brake-pad-oem",
    brand: "ATE",
    name: "Ön Fren Balata Takımı",
    code: "5Q0 698 151 F",
    kind: "OEM",
    category: "Fren",
    price: 249000,
    cost: 176000,
    centralStock: 7,
    shelf: "02",
    fitment: "Volkswagen Golf 7 · 1.4 TSI",
    suppliers: [
      ["Anadolu Parça", 14, "Bugün kargoda"],
      ["Başkent Otomotiv", 4, "1 iş günü"],
    ],
  },
  {
    id: "brake-pad-equivalent",
    brand: "FERODO",
    name: "Ön Fren Balata Takımı",
    code: "FDB 4436",
    kind: "Eşdeğer",
    category: "Fren",
    price: 158000,
    cost: 102500,
    centralStock: 12,
    shelf: "03",
    fitment: "Volkswagen Golf 7 · 1.4 TSI",
    suppliers: [
      ["Marmara Otomotiv", 19, "Bugün kargoda"],
      ["Ege Yedek Parça", 6, "1 iş günü"],
    ],
  },
  ...createOpelDemoProducts(),
];

function openDatabase() {
  const filename =
    process.env.DATABASE_PATH ?? join(process.cwd(), "data", "markasi.sqlite");
  mkdirSync(dirname(filename), { recursive: true });

  const database = new Database(filename);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  // Core Base Tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL CHECK (kind IN ('OEM', 'Eşdeğer')),
      category TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      cost INTEGER NOT NULL CHECK (cost >= 0),
      central_stock INTEGER NOT NULL DEFAULT 0 CHECK (central_stock >= 0),
      shelf TEXT NOT NULL DEFAULT '',
      fitment TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS supplier_stock (
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      supplier TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      delivery TEXT NOT NULL,
      purchase_price INTEGER CHECK (purchase_price >= 0),
      PRIMARY KEY (product_id, supplier)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Yeni',
      total INTEGER NOT NULL CHECK (total >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      code TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
    );
    CREATE TABLE IF NOT EXISTS admins (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      google_subject TEXT UNIQUE,
      password_hash TEXT,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      tc_identity_encrypted TEXT NOT NULL DEFAULT '',
      address_line TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      postal_code TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hidden_brands (
      brand TEXT PRIMARY KEY COLLATE NOCASE,
      hidden_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS xml_syncs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT NOT NULL,
      filename TEXT NOT NULL,
      imported_count INTEGER NOT NULL,
      matched_count INTEGER NOT NULL,
      unmatched_codes TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS orders_created_at ON orders(created_at);
  `);

  // ==========================================
  // ENTERPRISE SCHEMA EXTENSIONS (Safe Migrations)
  // ==========================================

  // 1. Categories Schema Migration
  addColumnIfNotExists(database, "categories", "id", "TEXT");
  addColumnIfNotExists(database, "categories", "slug", "TEXT");
  addColumnIfNotExists(database, "categories", "parent_id", "TEXT");
  addColumnIfNotExists(database, "categories", "sort_order", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "categories", "icon", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "categories", "banner", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "categories", "seo_title", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "categories", "seo_description", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "categories", "default_margin", "REAL DEFAULT 20.0");
  addColumnIfNotExists(database, "categories", "is_vehicle_tree", "INTEGER DEFAULT 0");

  // Populate id & slug for existing categories if missing
  const categoriesWithoutId = database
    .prepare("SELECT name FROM categories WHERE id IS NULL OR id = ''")
    .all() as Array<{ name: string }>;
  for (const cat of categoriesWithoutId) {
    const slug = cat.name
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    database
      .prepare("UPDATE categories SET id = ?, slug = ? WHERE name = ?")
      .run(slug || `cat-${randomUUID().slice(0, 8)}`, slug || `cat-${randomUUID().slice(0, 8)}`, cat.name);
  }

  // 2. Products Schema Migration
  addColumnIfNotExists(database, "products", "sku", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "barcode", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "oem_codes", "TEXT DEFAULT '[]'");
  addColumnIfNotExists(database, "products", "manufacturer_brand", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "condition", "TEXT DEFAULT 'Sıfır'");
  addColumnIfNotExists(database, "products", "warranty_months", "INTEGER DEFAULT 12");
  addColumnIfNotExists(database, "products", "desi", "REAL DEFAULT 1.0");
  addColumnIfNotExists(database, "products", "weight_kg", "REAL DEFAULT 1.0");
  addColumnIfNotExists(database, "products", "corridor", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "bin", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "discount_price", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "products", "currency", "TEXT DEFAULT 'TL'");
  addColumnIfNotExists(database, "products", "vat_rate", "INTEGER DEFAULT 20");
  addColumnIfNotExists(database, "products", "source_url", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "source_last_price", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "products", "source_last_checked", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "description", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "specs_json", "TEXT DEFAULT '{}'");
  addColumnIfNotExists(database, "products", "is_bundle", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "products", "status", "TEXT DEFAULT 'published'");
  addColumnIfNotExists(database, "products", "seo_slug", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "seo_title", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "seo_description", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "products", "tags", "TEXT DEFAULT '[]'");
  addColumnIfNotExists(database, "products", "compatible_vehicles", "TEXT DEFAULT '[]'");
  addColumnIfNotExists(database, "products", "position", "TEXT DEFAULT 'Yönsüz / Evrensel'");
  addColumnIfNotExists(database, "products", "has_core_deposit", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "products", "core_deposit_price", "INTEGER DEFAULT 0");

  // 3. Orders Schema Migration
  addColumnIfNotExists(database, "orders", "vin_number", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "orders", "license_plate_photo", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "orders", "vin_status", "TEXT DEFAULT 'Bekliyor'");
  addColumnIfNotExists(database, "orders", "courier_company", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "orders", "tracking_code", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "orders", "shipping_status", "TEXT DEFAULT 'Hazırlanıyor'");
  addColumnIfNotExists(database, "orders", "shipping_cost", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "orders", "pos_commission", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "orders", "purchase_cost", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "orders", "net_profit", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "orders", "invoice_status", "TEXT DEFAULT 'Kesilmedi'");
  addColumnIfNotExists(database, "orders", "customer_notes", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "orders", "admin_notes", "TEXT DEFAULT ''");

  // 4. Members Schema Migration
  addColumnIfNotExists(database, "members", "b2b_group_id", "TEXT");
  addColumnIfNotExists(database, "members", "company_title", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "members", "tax_office", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "members", "tax_number", "TEXT DEFAULT ''");
  addColumnIfNotExists(database, "members", "credit_balance", "INTEGER DEFAULT 0");
  addColumnIfNotExists(database, "members", "is_banned", "INTEGER DEFAULT 0");

  // 5. Admins Schema Migration
  addColumnIfNotExists(database, "admins", "role", "TEXT DEFAULT 'Super Admin'");
  addColumnIfNotExists(database, "admins", "active", "INTEGER DEFAULT 1");

  // 6. New Enterprise Tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor','Onaylandı','Reddedildi')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL CHECK (movement_type IN ('IN','OUT','RESERVE','RELEASE','ADJUST')),
      quantity INTEGER NOT NULL,
      reference TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      related_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL DEFAULT 'cross_sell' CHECK (relation_type IN ('cross_sell','up_sell')),
      UNIQUE (product_id, related_product_id, relation_type)
    );

    CREATE TABLE IF NOT EXISTS product_bundles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      bundle_code TEXT UNIQUE,
      price INTEGER NOT NULL,
      discount_price INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bundle_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id TEXT NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      product_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      customer_note TEXT DEFAULT '',
      photo_url TEXT DEFAULT '',
      status TEXT DEFAULT 'Bekliyor',
      refund_amount INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplier_recourses (
      id TEXT PRIMARY KEY,
      return_id TEXT REFERENCES returns(id),
      product_id TEXT NOT NULL,
      supplier TEXT NOT NULL,
      part_code TEXT NOT NULL,
      problem_description TEXT NOT NULL,
      status TEXT DEFAULT 'Tedarikçiye Gönderildi',
      resolution_note TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS b2b_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      discount_percent REAL DEFAULT 0.0,
      description TEXT DEFAULT '',
      min_order_amount INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS member_vehicles (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      plate_number TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year TEXT NOT NULL,
      vin TEXT DEFAULT '',
      next_maintenance_date TEXT DEFAULT '',
      last_maintenance_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_order_amount INTEGER DEFAULT 0,
      usage_limit INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      expires_at TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pay_links (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      part_description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'Ödenmedi',
      order_id TEXT,
      created_by TEXT DEFAULT '',
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id TEXT PRIMARY KEY,
      member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      items_json TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      last_notified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS currency_rates (
      currency TEXT PRIMARY KEY,
      rate REAL NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pos_installments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      card_program TEXT NOT NULL,
      installment_count INTEGER NOT NULL,
      commission_rate REAL NOT NULL,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS shipping_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      min_desi REAL DEFAULT 0,
      max_desi REAL DEFAULT 9999,
      price INTEGER NOT NULL,
      free_shipping_threshold INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS sliders_banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      image_desktop TEXT NOT NULL,
      image_mobile TEXT DEFAULT '',
      link_url TEXT DEFAULT '',
      button_text TEXT DEFAULT '',
      position TEXT DEFAULT 'hero_slider',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS product_images_product_id ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS member_vehicles_member_id ON member_vehicles(member_id);
    CREATE INDEX IF NOT EXISTS audit_logs_created_at ON audit_logs(created_at);
  `);

  // Default Seed Data Insertion
  const insertProduct = database.prepare(`
    INSERT OR IGNORE INTO products
      (id, brand, name, code, kind, category, price, cost, central_stock, shelf, fitment)
    VALUES (@id, @brand, @name, @code, @kind, @category, @price, @cost, @centralStock, @shelf, @fitment)
  `);
  const insertSupplier = database.prepare(`
    INSERT OR IGNORE INTO supplier_stock (product_id, supplier, quantity, delivery)
    VALUES (?, ?, ?, ?)
  `);

  const seed = database.transaction(() => {
    for (const product of seedProducts) {
      insertProduct.run(product);
      for (const [supplier, quantity, delivery] of product.suppliers) {
        insertSupplier.run(product.id, supplier, quantity, delivery);
      }
    }
  });
  seed();

  // Populate Categories & Default Tree
  database
    .prepare(
      `INSERT OR IGNORE INTO categories (name, id, slug)
       SELECT DISTINCT category, lower(replace(category, ' ', '-')), lower(replace(category, ' ', '-'))
       FROM products WHERE trim(category) <> ''`,
    )
    .run();

  // Seed Currency Rates
  database
    .prepare("INSERT OR IGNORE INTO currency_rates (currency, rate) VALUES ('USD', 36.50), ('EUR', 38.20)")
    .run();

  // Seed B2B Groups
  database.prepare(`
    INSERT OR IGNORE INTO b2b_groups (id, name, discount_percent, description, min_order_amount)
    VALUES 
      ('b2b-usta', 'Oto Tamir & Servis Ustaları', 15.0, 'Kayıtlı tamirhane ve ustalara özel %15 iskonto', 100000),
      ('b2b-bayi', 'Toptan Yedek Parça Bayileri', 25.0, 'Toplu alım yapan yedek parçacılara özel %25 iskonto', 500000)
  `).run();

  // Seed Default Shipping Rules
  const shippingCount = database.prepare("SELECT count(*) as count FROM shipping_rules").get() as { count: number };
  if (shippingCount.count === 0) {
    database.prepare(`
      INSERT INTO shipping_rules (name, min_desi, max_desi, price, free_shipping_threshold)
      VALUES 
        ('Standart Kargo (0-5 Desi)', 0, 5, 8500, 150000),
        ('Orta Hacim Kargo (5-15 Desi)', 5, 15, 13500, 250000),
        ('Ağır Parça & Motor Bloğu (15+ Desi)', 15, 9999, 29000, 0)
    `).run();
  }

  // Seed POS Installments
  const posCount = database.prepare("SELECT count(*) as count FROM pos_installments").get() as { count: number };
  if (posCount.count === 0) {
    database.prepare(`
      INSERT INTO pos_installments (bank_name, card_program, installment_count, commission_rate)
      VALUES 
        ('Yapı Kredi', 'World', 1, 1.8),
        ('Yapı Kredi', 'World', 3, 4.5),
        ('Yapı Kredi', 'World', 6, 7.9),
        ('Yapı Kredi', 'World', 12, 14.2),
        ('İş Bankası', 'Maximum', 1, 1.8),
        ('İş Bankası', 'Maximum', 3, 4.5),
        ('İş Bankası', 'Maximum', 6, 7.9),
        ('Garanti BBVA', 'Bonus', 1, 1.8),
        ('Garanti BBVA', 'Bonus', 3, 4.5),
        ('Garanti BBVA', 'Bonus', 6, 7.9)
    `).run();
  }

  // Seed Site Settings
  const defaultSettings: Array<[string, string, string]> = [
    ["site_title", "Markasi Otomotiv | Orijinal & Eşdeğer Oto Yedek Parça", "general"],
    ["site_slogan", "Aradığınız Tüm Yedek Parçalar En Hızlı Depo ve Tedarikçi Ağıyla Kapınızda", "general"],
    ["site_top_announcement", "Saat 16:00'ya kadar verilen siparişler aynı gün kargoda! 1.500 TL üzeri ücretsiz kargo.", "general"],
    ["top_announcement_bg", "#102b42", "design"],
    ["top_announcement_text", "#ffffff", "design"],
    ["primary_color", "#f36b2b", "design"],
    ["header_logo", "/markasi-logo.svg", "design"],
    ["footer_logo", "/markasi-logo.svg", "design"],
    ["favicon", "/markasi-icon.svg", "design"],
    ["company_name", "Markasi Otomotiv Sanayi ve Ticaret A.Ş.", "contact"],
    ["tax_office", "Kadıköy V.D.", "contact"],
    ["tax_number", "6120894521", "contact"],
    ["address", "İçerenköy Mah. Oto Sanayi Sitesi A Blok No: 14 Ataşehir / İstanbul", "contact"],
    ["phone", "0216 444 88 99", "contact"],
    ["mobile_phone", "0532 584 43 01", "contact"],
    ["whatsapp_number", "905325844301", "contact"],
    ["vin_whatsapp_number", "905325844301", "contact"],
    ["email", "destek@markasi.com.tr", "contact"],
    ["working_hours", "Hafta içi: 08:30 - 18:30 | Cumartesi: 09:00 - 15:00", "contact"],
    ["google_maps_embed", "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12042.8!2d29.1!3d40.98!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDU4JzQ4LjAiTiAyOcKwMDYnMDAuMCJF!5e0!3m2!1str!2str!4v1", "contact"],
    ["social_instagram", "https://instagram.com/markasioto", "social"],
    ["social_facebook", "https://facebook.com/markasioto", "social"],
    ["social_youtube", "https://youtube.com/@markasioto", "social"],
    ["social_tiktok", "https://tiktok.com/@markasioto", "social"],
    ["badge_same_day", "Aynı Gün Kargo", "badges"],
    ["badge_original", "%100 Orijinal & Faturalı Parça", "badges"],
    ["badge_secure_payment", "256-bit SSL Güvenli Alışveriş", "badges"],
    ["badge_easy_return", "14 Gün Koşulsuz Kolay İade", "badges"],
    ["enable_featured_categories", "1", "homepage"],
    ["enable_bestsellers", "1", "homepage"],
    ["enable_deal_products", "1", "homepage"],
    ["enable_brand_slider", "1", "homepage"],
    ["google_analytics_id", "G-MARKASI123", "seo"],
    ["meta_pixel_id", "1234567890", "seo"]
  ];

  const insertSetting = database.prepare(`
    INSERT OR IGNORE INTO site_settings (key, value, category) VALUES (?, ?, ?)
  `);
  for (const [key, val, cat] of defaultSettings) {
    insertSetting.run(key, val, cat);
  }

  // Seed CMS Pages
  const defaultPages = [
    [
      "hakkimizda",
      "Hakkımızda",
      "Markasi Otomotiv, 20 yılı aşkın otomotiv yedek parça tecrübesiyle Türkiye genelindeki araç sahiplerine, oto tamir servislerine ve ustalara en güvenilir orijinal ve eşdeğer yedek parçaları en uygun fiyat ve anlık depo teslim avantajıyla sunmaktadır.",
      "Hakkımızda | Markasi Otomotiv",
      "Markasi Otomotiv kurumsal bilgileri, vizyonumuz ve otomotiv yedek parça tecrübemiz."
    ],
    [
      "iade-kosullari",
      "İade ve Değişim Şartları",
      "Satın aldığınız ürünleri, ambalajı bozulmamış ve montajı yapılmamış olmak kaydıyla 14 gün içinde koşulsuz olarak iade edebilir veya değiştirebilirsiniz. Kusurlu veya yanlış gelen ürünlerde kargo ücreti tarafımıza aittir.",
      "İade ve Değişim Koşulları | Markasi Otomotiv",
      "Kolay iade ve garanti süreçlerimiz hakkında detaylı bilgi."
    ],
    [
      "teslimat-bilgileri",
      "Kargo ve Teslimat Bilgileri",
      "Hafta içi saat 16:00'ya kadar oluşturduğunuz siparişleriniz aynı gün anlaşmalı kargo firmalarımızla (Yurtiçi Kargo, Aras Kargo) yola çıkmaktadır. 1.500 TL üzeri siparişlerde kargo ücretsizdir.",
      "Teslimat Bilgileri ve Kargo Takibi | Markasi Otomotiv",
      "Aynı gün kargo ve teslimat süreleri hakkında bilgi edinin."
    ],
    [
      "mesafeli-satis-sozlesmesi",
      "Mesafeli Satış Sözleşmesi",
      "İşbu sözleşme 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince düzenlenmiştir. Alıcı ve satıcı hakları kanunen güvence altındadır.",
      "Mesafeli Satış Sözleşmesi | Markasi Otomotiv",
      "Yasal satış sözleşmesi metni."
    ],
    [
      "gizlilik-politikasi",
      "Gizlilik ve KVKK Politikası",
      "Markasi Otomotiv olarak kişisel verilerinizin güvenliğine azami özen göstermekteyiz. TCKN ve ödeme bilgileri en üst düzey 256-bit AES-GCM şifreleme ile korunmaktadır.",
      "Gizlilik ve KVKK Sözleşmesi | Markasi Otomotiv",
      "Kişisel verilerin işlenmesi ve korunması politikamız."
    ],
    [
      "sss",
      "Sıkça Sorulan Sorular (SSS)",
      "S: Siparişim ne zaman kargoya verilir?\nC: Saat 16:00'ya kadar olan siparişler aynı gün kargolanır.\n\nS: Şasi numaramla sorgulama yapabilir miyim?\nC: Evet, uzman ekibimiz ruhsat ve şasi numaranız üzerinden parçanın uyumunu %100 teyit eder.\n\nS: Toptan veya usta indirimi var mı?\nC: B2B Usta/Bayi programımıza başvurarak özel iskonto ve cari imkanlardan faydalanabilirsiniz.",
      "Sıkça Sorulan Sorular | Markasi Otomotiv",
      "Yedek parça siparişleri ve teslimatla ilgili merak edilenler."
    ]
  ];

  const insertPage = database.prepare(`
    INSERT OR IGNORE INTO cms_pages (slug, title, content, seo_title, seo_description)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const [slug, title, content, seoTitle, seoDesc] of defaultPages) {
    insertPage.run(slug, title, content, seoTitle, seoDesc);
  }

  // Seed Sliders & Banners
  const sliderCount = database.prepare("SELECT count(*) as count FROM sliders_banners").get() as { count: number };
  if (sliderCount.count === 0) {
    database.prepare(`
      INSERT INTO sliders_banners (id, title, subtitle, image_desktop, image_mobile, link_url, button_text, position, sort_order)
      VALUES 
        ('slider-1', 'Tüm Filtre ve Bakım Setlerinde %20 İndirim', 'Golf 7, Astra H, Focus ve Megane için periyodik bakım paketleri hazır', '/markasi-otomotiv-banner.svg', '/markasi-otomotiv-banner.svg', '/#products-heading', 'İncele & Satın Al', 'bottom_banner', 1),
        ('banner-1', 'Oto Servis & Ustalara Özel Toptan İskonto', 'B2B Bayilik kaydınızı hemen yapın, cari ve özel indirim fırsatlarından yararlanın.', '/categories/fren-sistemi.svg', '', '/account', 'B2B Başvuru', 'middle_banner', 1)
    `).run();
  }

  // Seed Sample Coupons
  database.prepare(`
    INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, min_order_amount, usage_limit, used_count)
    VALUES 
      ('cp-hosgeldin', 'HOSGELDIN50', 'fixed', 5000, 50000, 1000, 12),
      ('cp-bakim10', 'BAKIM10', 'percentage', 10.0, 100000, 500, 34)
  `).run();

  database
    .prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)")
    .run("development_session_secret", randomBytes(32).toString("base64url"));

  // Seed Vehicle Tree from catalog if empty
  const vtCount = database.prepare("SELECT count(*) as c FROM categories WHERE is_vehicle_tree = 1").get() as { c: number };
  if (vtCount.c === 0) {
    const insert = database.prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, parent_id, sort_order, default_margin, is_vehicle_tree, active)
      VALUES (?, ?, ?, ?, ?, 20.0, 1, 1)
    `);
    let sortOrder = 0;
    for (const brand of vehicleCatalog) {
      const brandId = `vt-${brand.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      insert.run(brandId, brand.label, brandId, null, sortOrder++);
      let childOrder = 0;
      for (const model of brand.models) {
        const modelId = `${brandId}-${model.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        insert.run(modelId, model.label, modelId, brandId, childOrder++);
      }
    }
  }

  return database;
}
export function getDatabase() {
  if (!globalThis.markasiDatabase || !globalThis.markasiDatabase.open) {
    globalThis.markasiDatabase = openDatabase();
    globalThis.markasiSearchFunctionRegistered = false;
  }
  if (!globalThis.markasiSearchFunctionRegistered) {
    globalThis.markasiDatabase.function(
      "normalize_product_search",
      { deterministic: true },
      normalizeProductSearch,
    );
    globalThis.markasiSearchFunctionRegistered = true;
  }
  return globalThis.markasiDatabase;
}

// =========================================================================
// AUDIT LOG HELPER
// =========================================================================

export function recordAuditLog(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  details = "",
  ipAddress = "",
) {
  try {
    getDatabase()
      .prepare(
        `INSERT INTO audit_logs (admin_email, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(adminEmail || "Sistem", action, entityType, entityId, details, ipAddress);
  } catch (error) {
    console.error("Audit log record failed:", error);
  }
}

// =========================================================================
// CATEGORY & VEHICLE TREE METHODS
// =========================================================================

export function listCategoryTree(options?: { isVehicleTree?: boolean; includeHidden?: boolean }): CategoryItem[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `SELECT categories.id, categories.name, coalesce(categories.slug, categories.id) AS slug,
              categories.parent_id AS parentId, categories.sort_order AS sortOrder,
              coalesce(categories.icon, '') AS icon, coalesce(categories.banner, '') AS banner,
              coalesce(categories.seo_title, '') AS seoTitle, coalesce(categories.seo_description, '') AS seoDescription,
              coalesce(categories.default_margin, 20.0) AS defaultMargin,
              coalesce(categories.is_vehicle_tree, 0) AS isVehicleTree,
              coalesce(categories.active, 1) AS active,
              count(products.id) AS productCount
       FROM categories
       LEFT JOIN products ON (products.category = categories.name COLLATE NOCASE AND products.active = 1)
       WHERE (@includeHidden = 1 OR categories.active = 1)
         AND (@isVehicleTree IS NULL OR categories.is_vehicle_tree = @isVehicleTree)
       GROUP BY categories.id, categories.name
       ORDER BY categories.sort_order ASC, categories.name ASC`,
    )
    .all({
      includeHidden: options?.includeHidden ? 1 : 0,
      isVehicleTree: options?.isVehicleTree !== undefined ? (options.isVehicleTree ? 1 : 0) : null,
    }) as Array<{
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      sortOrder: number;
      icon: string;
      banner: string;
      seoTitle: string;
      seoDescription: string;
      defaultMargin: number;
      isVehicleTree: number;
      active: number;
      productCount: number;
    }>;

  const items: CategoryItem[] = rows.map((row) => ({
    ...row,
    isVehicleTree: row.isVehicleTree === 1,
    active: row.active === 1,
  }));

  // Build recursive tree
  const idMap = new Map<string, CategoryItem>();
  for (const item of items) {
    idMap.set(item.id, { ...item, children: [] });
  }

  const rootItems: CategoryItem[] = [];
  for (const item of items) {
    const node = idMap.get(item.id)!;
    if (item.parentId && idMap.has(item.parentId)) {
      idMap.get(item.parentId)!.children!.push(node);
    } else {
      rootItems.push(node);
    }
  }

  return rootItems;
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function upsertCategory(data: {
  id?: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  icon?: string;
  banner?: string;
  seoTitle?: string;
  seoDescription?: string;
  defaultMargin?: number;
  isVehicleTree?: boolean;
  active?: boolean;
}) {
  const database = getDatabase();
  const id = data.id || (data.slug ? slugify(data.slug) : slugify(data.name)) || randomUUID();
  const slug = data.slug ? slugify(data.slug) : slugify(data.name) || id;

  const existing = database
    .prepare("SELECT id, name FROM categories WHERE id = ? OR slug = ? OR name = ? COLLATE NOCASE OR normalize_product_search(name) = normalize_product_search(?)")
    .get(id, slug, data.name, data.name) as { id: string; name: string } | undefined;

  if (existing) {
    database
      .prepare(`
        UPDATE categories SET
          name = @name,
          slug = @slug,
          parent_id = @parentId,
          sort_order = @sortOrder,
          icon = @icon,
          banner = @banner,
          seo_title = @seoTitle,
          seo_description = @seoDescription,
          default_margin = @defaultMargin,
          is_vehicle_tree = @isVehicleTree,
          active = @active
        WHERE id = @id OR name = @existingName COLLATE NOCASE
      `)
      .run({
        id: existing.id || id,
        existingName: existing.name,
        name: data.name,
        slug,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder ?? 0,
        icon: data.icon ?? "",
        banner: data.banner ?? "",
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
        defaultMargin: data.defaultMargin ?? 20.0,
        isVehicleTree: data.isVehicleTree ? 1 : 0,
        active: data.active !== false ? 1 : 0,
      });

    // Update products if name changed or was normalized
    if (existing.name !== data.name) {
      database
        .prepare("UPDATE products SET category = ? WHERE category = ? COLLATE NOCASE OR normalize_product_search(category) = normalize_product_search(?)")
        .run(data.name, existing.name, existing.name);
    }
    return { id: existing.id || id, created: false };
  } else {
    database
      .prepare(`
        INSERT INTO categories (id, name, slug, parent_id, sort_order, icon, banner, seo_title, seo_description, default_margin, is_vehicle_tree, active)
        VALUES (@id, @name, @slug, @parentId, @sortOrder, @icon, @banner, @seoTitle, @seoDescription, @defaultMargin, @isVehicleTree, @active)
      `)
      .run({
        id,
        name: data.name,
        slug,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder ?? 0,
        icon: data.icon ?? "",
        banner: data.banner ?? "",
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
        defaultMargin: data.defaultMargin ?? 20.0,
        isVehicleTree: data.isVehicleTree ? 1 : 0,
        active: data.active !== false ? 1 : 0,
      });
    return { id, created: true };
  }
}

export function deleteCategory(idOrName: string, reassignToIdOrName?: string) {
  const database = getDatabase();
  return database.transaction(() => {
    const cat = database.prepare("SELECT id, name FROM categories WHERE id = ? OR name = ? COLLATE NOCASE").get(idOrName, idOrName) as { id: string; name: string } | undefined;
    if (!cat) return false;

    if (reassignToIdOrName) {
      const target = database.prepare("SELECT id, name FROM categories WHERE id = ? OR name = ? COLLATE NOCASE").get(reassignToIdOrName, reassignToIdOrName) as { id: string; name: string } | undefined;
      if (target) {
        database.prepare("UPDATE products SET category = ? WHERE category = ? COLLATE NOCASE").run(target.name, cat.name);
        database.prepare("UPDATE categories SET parent_id = ? WHERE parent_id = ?").run(target.id, cat.id);
      }
    } else {
      database.prepare("UPDATE categories SET parent_id = NULL WHERE parent_id = ?").run(cat.id);
    }

    database.prepare("DELETE FROM categories WHERE id = ? OR name = ? COLLATE NOCASE").run(cat.id, cat.name);
    return true;
  }).immediate();
}

// =========================================================================
// PRODUCT & WMS INVENTORY METHODS
// =========================================================================

export function duplicateProduct(id: string): string | null {
  const database = getDatabase();
  const source = database.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
  if (!source) return null;
  const newId = randomUUID();
  const newCode = `${source.code}-KOPYA`;
  database.prepare(`
    INSERT INTO products (id, brand, name, code, kind, category, price, cost, central_stock, shelf, fitment,
      sku, barcode, oem_codes, manufacturer_brand, condition, warranty_months, desi, weight_kg, corridor, bin,
      discount_price, currency, vat_rate, source_url, source_last_price, source_last_checked, description, specs_json,
      is_bundle, active, status, seo_slug, seo_title, seo_description, tags)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    newId, source.brand, `${source.name} (Kopya)`, newCode, source.kind, source.category, source.price, source.cost,
    0, source.shelf, source.fitment, source.sku, source.barcode, source.oem_codes, source.manufacturer_brand,
    source.condition, source.warranty_months, source.desi, source.weight_kg, source.corridor, source.bin,
    source.discount_price, source.currency, source.vat_rate, source.source_url, source.source_last_price,
    source.source_last_checked, source.description, source.specs_json, source.is_bundle, 0, "draft",
    source.seo_slug, source.seo_title, source.seo_description, source.tags
  );
  // copy images
  const imgs = database.prepare("SELECT image_url, sort_order, is_primary FROM product_images WHERE product_id = ?").all(id) as any[];
  const ins = database.prepare("INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?,?,?,?)");
  for (const img of imgs) ins.run(newId, img.image_url, img.sort_order, img.is_primary);
  return newId;
}

export function updateProduct(
  id: string,
  data: {
    name?: string;
    brand?: string;
    code?: string;
    kind?: "OEM" | "Eşdeğer";
    category?: string;
    price?: number;
    cost?: number;
    centralStock?: number;
    shelf?: string;
    corridor?: string;
    bin?: string;
    fitment?: string;
    sku?: string;
    barcode?: string;
    oemCodes?: string[];
    manufacturerBrand?: string;
    condition?: "Sıfır" | "Çıkma" | "Yenilenmiş";
    warrantyMonths?: number;
    desi?: number;
    weightKg?: number;
    discountPrice?: number;
    currency?: "TL" | "USD" | "EUR";
    vatRate?: number;
    description?: string;
    specsJson?: string;
    images?: string[];
    compatibleVehicles?: VehicleFitment[];
    position?: string;
    hasCoreDeposit?: boolean;
    coreDepositPrice?: number;
  },
): boolean {
  const database = getDatabase();
  const existing = database.prepare("SELECT id FROM products WHERE id = ?").get(id);
  if (!existing) return false;

  return database.transaction(() => {
    const sets: string[] = [];
    const params: Record<string, any> = { id };

    if (data.name !== undefined) {
      sets.push("name = @name");
      params.name = data.name.trim();
    }
    if (data.brand !== undefined) {
      sets.push("brand = @brand");
      params.brand = data.brand.trim();
    }
    if (data.code !== undefined) {
      sets.push("code = @code");
      params.code = data.code.trim();
    }
    if (data.kind !== undefined) {
      sets.push("kind = @kind");
      params.kind = data.kind === "OEM" ? "OEM" : "Eşdeğer";
    }
    if (data.category !== undefined) {
      sets.push("category = @category");
      params.category = data.category.trim();
      // Ensure category exists in categories table
      if (params.category) {
        upsertCategory({ name: params.category, active: true });
      }
    }
    if (data.price !== undefined) {
      sets.push("price = @price");
      params.price = Math.max(0, Math.round(data.price));
    }
    if (data.cost !== undefined) {
      sets.push("cost = @cost");
      params.cost = Math.max(0, Math.round(data.cost));
    }
    if (data.centralStock !== undefined) {
      sets.push("central_stock = @centralStock");
      params.centralStock = Math.max(0, Math.floor(data.centralStock));
    }
    if (data.shelf !== undefined) {
      sets.push("shelf = @shelf");
      params.shelf = data.shelf.trim();
    }
    if (data.corridor !== undefined) {
      sets.push("corridor = @corridor");
      params.corridor = data.corridor.trim();
    }
    if (data.bin !== undefined) {
      sets.push("bin = @bin");
      params.bin = data.bin.trim();
    }
    if (data.fitment !== undefined) {
      sets.push("fitment = @fitment");
      params.fitment = data.fitment.trim();
    }
    if (data.sku !== undefined) {
      sets.push("sku = @sku");
      params.sku = data.sku.trim();
    }
    if (data.barcode !== undefined) {
      sets.push("barcode = @barcode");
      params.barcode = data.barcode.trim();
    }
    if (data.oemCodes !== undefined) {
      sets.push("oem_codes = @oemCodes");
      params.oemCodes = JSON.stringify(data.oemCodes);
    }
    if (data.manufacturerBrand !== undefined) {
      sets.push("manufacturer_brand = @manufacturerBrand");
      params.manufacturerBrand = data.manufacturerBrand.trim();
    }
    if (data.condition !== undefined) {
      sets.push("condition = @condition");
      params.condition = data.condition;
    }
    if (data.warrantyMonths !== undefined) {
      sets.push("warranty_months = @warrantyMonths");
      params.warrantyMonths = data.warrantyMonths;
    }
    if (data.desi !== undefined) {
      sets.push("desi = @desi");
      params.desi = data.desi;
    }
    if (data.weightKg !== undefined) {
      sets.push("weight_kg = @weightKg");
      params.weightKg = data.weightKg;
    }
    if (data.discountPrice !== undefined) {
      sets.push("discount_price = @discountPrice");
      params.discountPrice = Math.max(0, Math.round(data.discountPrice));
    }
    if (data.currency !== undefined) {
      sets.push("currency = @currency");
      params.currency = data.currency;
    }
    if (data.vatRate !== undefined) {
      sets.push("vat_rate = @vatRate");
      params.vatRate = data.vatRate;
    }
    if (data.description !== undefined) {
      sets.push("description = @description");
      params.description = data.description.trim();
    }
    if (data.specsJson !== undefined) {
      sets.push("specs_json = @specsJson");
      params.specsJson = data.specsJson;
    }
    if (data.compatibleVehicles !== undefined) {
      sets.push("compatible_vehicles = @compatibleVehicles");
      params.compatibleVehicles = JSON.stringify(data.compatibleVehicles);
    }
    if (data.position !== undefined) {
      sets.push("position = @position");
      params.position = data.position.trim();
    }
    if (data.hasCoreDeposit !== undefined) {
      sets.push("has_core_deposit = @hasCoreDeposit");
      params.hasCoreDeposit = data.hasCoreDeposit ? 1 : 0;
    }
    if (data.coreDepositPrice !== undefined) {
      sets.push("core_deposit_price = @coreDepositPrice");
      params.coreDepositPrice = Math.max(0, Math.round(data.coreDepositPrice));
    }

    if (sets.length > 0) {
      database.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = @id`).run(params);
    }

    if (Array.isArray(data.images)) {
      database.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
      const insImg = database.prepare(
        "INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)",
      );
      data.images.forEach((url, idx) => {
        if (typeof url === "string" && url.trim()) {
          insImg.run(id, url.trim(), idx, idx === 0 ? 1 : 0);
        }
      });
    }

    return true;
  }).immediate();
}

export function bulkImportProducts(
  items: Array<{
    code: string;
    name: string;
    brand?: string;
    category?: string;
    price: number;
    cost?: number;
    stock?: number;
    shelf?: string;
    corridor?: string;
    bin?: string;
    desi?: number;
    barcode?: string;
    oemCodes?: string[] | string;
    currency?: "TL" | "USD" | "EUR";
    condition?: "Sıfır" | "Çıkma" | "Yenilenmiş";
    fitment?: string;
    image?: string;
  }>,
  autoCreateCategory = true,
): { total: number; inserted: number; updated: number; errors: string[] } {
  const database = getDatabase();
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  const existingCodesMap = new Map<string, string>();
  const allExisting = database.prepare("SELECT id, code FROM products").all() as Array<{ id: string; code: string }>;
  for (const p of allExisting) {
    existingCodesMap.set(p.code.trim().toUpperCase(), p.id);
  }

  const existingCategories = new Set<string>();
  const allCats = database.prepare("SELECT name FROM categories").all() as Array<{ name: string }>;
  for (const c of allCats) {
    existingCategories.add(c.name.trim().toLowerCase());
  }

  database.transaction(() => {
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const code = String(row.code || "").trim();
      const name = String(row.name || "").trim();
      const brand = String(row.brand || "Genel").trim();
      const category = String(row.category || "Filtreler").trim();

      if (!code || !name) {
        errors.push(`Satır ${i + 1}: Kod veya Ürün Adı boş.`);
        continue;
      }

      // Auto create category if not exists
      if (autoCreateCategory && category && !existingCategories.has(category.toLowerCase())) {
        upsertCategory({
          name: category,
          active: true,
          defaultMargin: 20,
        });
        existingCategories.add(category.toLowerCase());
      }

      const price = typeof row.price === "number" ? (row.price > 1000 ? Math.round(row.price) : Math.round(row.price * 100)) : 0;
      const cost = typeof row.cost === "number" ? (row.cost > 1000 ? Math.round(row.cost) : Math.round(row.cost * 100)) : Math.round(price * 0.7);
      const stock = typeof row.stock === "number" ? Math.max(0, Math.floor(row.stock)) : 10;
      const shelf = String(row.shelf || "").trim();
      const corridor = String(row.corridor || "").trim();
      const bin = String(row.bin || "").trim();
      const desi = typeof row.desi === "number" ? row.desi : 1.0;
      const barcode = String(row.barcode || "").trim();
      const fitment = String(row.fitment || "").trim();
      const condition = ["Sıfır", "Çıkma", "Yenilenmiş"].includes(String(row.condition)) ? (row.condition as any) : "Sıfır";
      const currency = ["TL", "USD", "EUR"].includes(String(row.currency)) ? (row.currency as any) : "TL";

      let oemList: string[] = [];
      if (Array.isArray(row.oemCodes)) {
        oemList = row.oemCodes;
      } else if (typeof row.oemCodes === "string" && row.oemCodes.trim()) {
        oemList = row.oemCodes.split(/[,;\s]+/).filter(Boolean);
      } else {
        oemList = [code];
      }

      const normalizedCode = code.toUpperCase();
      const existingId = existingCodesMap.get(normalizedCode);

      if (existingId) {
        // Update existing product
        updateProduct(existingId, {
          name,
          brand,
          category,
          price,
          cost,
          centralStock: stock,
          shelf: shelf || undefined,
          corridor: corridor || undefined,
          bin: bin || undefined,
          barcode: barcode || undefined,
          fitment: fitment || undefined,
          condition,
          currency,
          desi,
          oemCodes: oemList,
          images: row.image ? [row.image] : undefined,
        });
        updated++;
      } else {
        // Insert new product
        const newId = `prod-${randomUUID().slice(0, 12)}`;
        database
          .prepare(`
            INSERT INTO products (
              id, brand, name, code, kind, category, price, cost, central_stock,
              shelf, fitment, sku, barcode, oem_codes, manufacturer_brand,
              condition, warranty_months, desi, weight_kg, corridor, bin,
              discount_price, currency, vat_rate, source_url, source_last_price,
              description, specs_json
            ) VALUES (
              @id, @brand, @name, @code, @kind, @category, @price, @cost, @centralStock,
              @shelf, @fitment, @sku, @barcode, @oemCodes, @manufacturerBrand,
              @condition, @warrantyMonths, @desi, @weightKg, @corridor, @bin,
              @discountPrice, @currency, @vatRate, '', @cost, '', '{}'
            )
          `)
          .run({
            id: newId,
            brand,
            name,
            code,
            kind: "OEM",
            category,
            price,
            cost,
            centralStock: stock,
            shelf,
            fitment,
            sku: code,
            barcode,
            oemCodes: JSON.stringify(oemList),
            manufacturerBrand: brand,
            condition,
            warrantyMonths: 12,
            desi,
            weightKg: desi,
            corridor,
            bin,
            discountPrice: 0,
            currency,
            vatRate: 20,
          });

        if (row.image && typeof row.image === "string" && row.image.trim()) {
          database
            .prepare("INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, 0, 1)")
            .run(newId, row.image.trim());
        }

        existingCodesMap.set(normalizedCode, newId);
        inserted++;
      }
    }
  })();

  return { total: items.length, inserted, updated, errors };
}

export function listProducts(options?: {
  query?: string;
  category?: string;
  includeCosts?: boolean;
  includeHiddenBrands?: boolean;
  includeHiddenCategories?: boolean;
  criticalOnly?: boolean;
  shelf?: string;
  corridor?: string;
  limit?: number;
  offset?: number;
}): Product[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `SELECT products.id, products.brand, products.name, products.code, products.kind, products.category,
              products.price, products.cost, products.central_stock AS centralStock, products.shelf,
              products.fitment, products.sku, products.barcode, products.oem_codes AS oemCodes,
              products.manufacturer_brand AS manufacturerBrand, products.condition,
              products.warranty_months AS warrantyMonths, products.desi, products.weight_kg AS weightKg,
              products.corridor, products.bin, products.discount_price AS discountPrice,
              products.currency, products.vat_rate AS vatRate, products.source_url AS sourceUrl,
              products.source_last_price AS sourceLastPrice, products.source_last_checked AS sourceLastChecked,
              products.description, products.specs_json AS specsJson, products.is_bundle AS isBundle,
              products.compatible_vehicles AS compatibleVehicles, products.position,
              products.has_core_deposit AS hasCoreDeposit, products.core_deposit_price AS coreDepositPrice
       FROM products
       WHERE products.active = 1
         AND (@includeHiddenBrands = 1 OR NOT EXISTS (
           SELECT 1 FROM hidden_brands
           WHERE hidden_brands.brand = products.brand COLLATE NOCASE
         ))
         AND (@includeHiddenCategories = 1 OR NOT EXISTS (
           SELECT 1 FROM categories
           WHERE categories.name = products.category COLLATE NOCASE
             AND categories.active = 0
         ))
         AND (
           @category = ''
           OR products.category = @category COLLATE NOCASE
           OR normalize_product_search(products.category) = normalize_product_search(@category)
           OR products.category IN (
             WITH RECURSIVE cat_tree(id, name) AS (
               SELECT id, name FROM categories WHERE name = @category COLLATE NOCASE OR slug = @category COLLATE NOCASE OR normalize_product_search(name) = normalize_product_search(@category)
               UNION ALL
               SELECT c.id, c.name FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id
             )
             SELECT name FROM cat_tree
           )
         )
         AND (@criticalOnly = 0 OR products.central_stock <= 5)
         AND (@shelf = '' OR products.shelf = @shelf)
         AND (@corridor = '' OR products.corridor = @corridor)
         AND (@query = '' OR
           instr(normalize_product_search(products.code), @query) > 0 OR
           instr(normalize_product_search(coalesce(products.sku, '')), @query) > 0 OR
           instr(normalize_product_search(coalesce(products.barcode, '')), @query) > 0 OR
           instr(normalize_product_search(coalesce(products.oem_codes, '')), @query) > 0 OR
           instr(normalize_product_search(products.brand || products.name || products.fitment), @query) > 0)
       ORDER BY products.name, products.kind
       LIMIT @limit OFFSET @offset`,
    )
    .all({
      category: options?.category ?? "",
      query: options?.query ? normalizeProductSearch(options.query) : "",
      includeHiddenBrands: options?.includeHiddenBrands ? 1 : 0,
      includeHiddenCategories: options?.includeHiddenCategories ? 1 : 0,
      criticalOnly: options?.criticalOnly ? 1 : 0,
      shelf: options?.shelf ?? "",
      corridor: options?.corridor ?? "",
      limit: options?.limit ?? 500,
      offset: options?.offset ?? 0,
    }) as any[];

  const supplierQuery = database.prepare(
    `SELECT supplier, quantity, delivery${options?.includeCosts ? ", purchase_price AS purchasePrice" : ""}
     FROM supplier_stock WHERE product_id = ? ORDER BY supplier`,
  );

  const imagesQuery = database.prepare(
    `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC`,
  );

  return rows.map((row) => ({
    ...row,
    kind: row.kind as Product["kind"],
    oemCodes: row.oemCodes ? JSON.parse(row.oemCodes) : [],
    isBundle: row.isBundle === 1,
    compatibleVehicles: row.compatibleVehicles ? JSON.parse(row.compatibleVehicles) : [],
    position: row.position || "Yönsüz / Evrensel",
    hasCoreDeposit: row.hasCoreDeposit === 1,
    coreDepositPrice: row.coreDepositPrice || 0,
    xmlStock: supplierQuery.all(row.id) as SupplierStock[],
    images: (imagesQuery.all(row.id) as Array<{ image_url: string }>).map((img) => img.image_url),
  }));
}

export function updateProductInline(
  productId: string,
  fields: {
    centralStock?: number;
    price?: number;
    cost?: number;
    shelf?: string;
    corridor?: string;
    bin?: string;
    fitment?: string;
  },
) {
  const database = getDatabase();
  const updates: string[] = [];
  const params: Record<string, any> = { productId };

  if (fields.centralStock !== undefined) {
    updates.push("central_stock = @centralStock");
    params.centralStock = Math.max(0, fields.centralStock);
  }
  if (fields.price !== undefined) {
    updates.push("price = @price");
    params.price = Math.max(0, fields.price);
  }
  if (fields.cost !== undefined) {
    updates.push("cost = @cost");
    params.cost = Math.max(0, fields.cost);
  }
  if (fields.shelf !== undefined) {
    updates.push("shelf = @shelf");
    params.shelf = fields.shelf.trim();
  }
  if (fields.corridor !== undefined) {
    updates.push("corridor = @corridor");
    params.corridor = fields.corridor.trim();
  }
  if (fields.bin !== undefined) {
    updates.push("bin = @bin");
    params.bin = fields.bin.trim();
  }
  if (fields.fitment !== undefined) {
    updates.push("fitment = @fitment");
    params.fitment = fields.fitment.trim();
  }

  if (updates.length === 0) return false;

  const result = database
    .prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = @productId`)
    .run(params);
  return result.changes > 0;
}

export function bulkUpdatePrices(options: {
  category?: string;
  brand?: string;
  percentageChange: number; // e.g. +10 for %10 zam, -5 for %5 indirim
  applyTo: "price" | "cost" | "both";
}) {
  const database = getDatabase();
  const multiplier = 1 + options.percentageChange / 100;
  return database.transaction(() => {
    const params: (string | number)[] = [];
    let query = "UPDATE products SET ";
    const clauses: string[] = [];
    if (options.applyTo === "price" || options.applyTo === "both") {
      clauses.push(`price = CAST(round(price * ${multiplier}) AS INTEGER)`);
    }
    if (options.applyTo === "cost" || options.applyTo === "both") {
      clauses.push(`cost = CAST(round(cost * ${multiplier}) AS INTEGER)`);
    }
    query += clauses.join(", ");
    query += " WHERE active = 1";
    if (options.category) {
      query += " AND category = ?";
      params.push(options.category);
    }
    if (options.brand) {
      query += " AND brand = ?";
      params.push(options.brand);
    }

    const res = database.prepare(query).run(...params);
    return res.changes;
  }).immediate();
}

export function findCrossOemEquivalents(oemCode: string, excludeProductId?: string): Product[] {
  const database = getDatabase();
  const norm = normalizeProductSearch(oemCode);
  if (!norm) return [];

  const rows = database
    .prepare(`
      SELECT id, brand, name, code, kind, category, price, cost, central_stock AS centralStock, shelf, fitment
      FROM products
      WHERE active = 1
        AND id != @excludeProductId
        AND (
          instr(normalize_product_search(code), @norm) > 0 OR
          instr(normalize_product_search(coalesce(oem_codes, '')), @norm) > 0
        )
      LIMIT 10
    `)
    .all({ norm, excludeProductId: excludeProductId || "" }) as any[];

  return rows.map((r) => ({ ...r, xmlStock: [] }));
}

// Bundles
export function listBundles() {
  const database = getDatabase();
  const bundles = database
    .prepare("SELECT * FROM product_bundles WHERE active = 1 ORDER BY created_at DESC")
    .all() as any[];

  const itemQuery = database.prepare(`
    SELECT bundle_items.quantity, products.id, products.name, products.code, products.price, products.brand
    FROM bundle_items
    JOIN products ON products.id = bundle_items.product_id
    WHERE bundle_items.bundle_id = ?
  `);

  return bundles.map((b) => ({
    ...b,
    items: itemQuery.all(b.id),
  }));
}

export function createBundle(data: {
  name: string;
  price: number;
  discountPrice?: number;
  description?: string;
  items: Array<{ productId: string; quantity: number }>;
}) {
  const database = getDatabase();
  return database.transaction(() => {
    const bundleId = `BND-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + bundleId.toLowerCase();

    database
      .prepare(`
        INSERT INTO product_bundles (id, name, slug, bundle_code, price, discount_price, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(bundleId, data.name, slug, bundleId, data.price, data.discountPrice || 0, data.description || "");

    const insertItem = database.prepare(`
      INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES (?, ?, ?)
    `);

    for (const item of data.items) {
      insertItem.run(bundleId, item.productId, Math.max(1, item.quantity));
    }

    return bundleId;
  }).immediate();
}

// =========================================================================
// ORDERS, VIN VERIFICATION & DESK METHODS
// =========================================================================

export function listOrders(options?: {
  status?: string;
  vinStatus?: string;
  query?: string;
  limit?: number;
}) {
  const database = getDatabase();
  const limit = options?.limit ?? 150;
  const orders = database
    .prepare(
      `SELECT id, customer_name AS customerName, email, phone, address,
              payment_method AS paymentMethod, status, total, created_at AS createdAt,
              vin_number AS vinNumber, license_plate_photo AS licensePlatePhoto,
              vin_status AS vinStatus, courier_company AS courierCompany,
              tracking_code AS trackingCode, shipping_status AS shippingStatus,
              shipping_cost AS shippingCost, pos_commission AS posCommission,
              purchase_cost AS purchaseCost, net_profit AS netProfit,
              invoice_status AS invoiceStatus, customer_notes AS customerNotes,
              admin_notes AS adminNotes
       FROM orders
       WHERE (@status = '' OR status = @status)
         AND (@vinStatus = '' OR vin_status = @vinStatus)
         AND (@query = '' OR
           instr(id, @query) > 0 OR
           instr(lower(customer_name), lower(@query)) > 0 OR
           instr(phone, @query) > 0 OR
           instr(coalesce(vin_number, ''), @query) > 0)
       ORDER BY created_at DESC LIMIT @limit`,
    )
    .all({
      status: options?.status ?? "",
      vinStatus: options?.vinStatus ?? "",
      query: options?.query ? options.query.trim() : "",
      limit,
    }) as any[];

  const getItems = database.prepare(
    `SELECT order_items.id, order_items.product_id AS productId, order_items.product_name AS name,
            order_items.code, order_items.quantity, order_items.unit_price AS unitPrice,
            coalesce(products.shelf, '') AS shelf, coalesce(products.corridor, '') AS corridor,
            coalesce(products.bin, '') AS bin, coalesce(products.cost, 0) AS cost
     FROM order_items
     LEFT JOIN products ON products.id = order_items.product_id
     WHERE order_items.order_id = ?`,
  );

  return orders.map((order) => {
    const items = getItems.all(order.id) as any[];
    // Auto calculate net profit if 0
    let purchaseCost = order.purchaseCost;
    if (!purchaseCost) {
      purchaseCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
    }
    const netProfit = order.netProfit || Math.max(0, order.total - purchaseCost - order.shippingCost - order.posCommission);

    return {
      ...order,
      purchaseCost,
      netProfit,
      items,
    };
  });
}

export function updateOrderVin(orderId: string, vinStatus: "Bekliyor" | "Uyumlu" | "Uyumsuz", adminNotes?: string) {
  const database = getDatabase();
  database
    .prepare("UPDATE orders SET vin_status = ?, admin_notes = coalesce(?, admin_notes) WHERE id = ?")
    .run(vinStatus, adminNotes || null, orderId);
  return true;
}

export function updateOrderShipping(
  orderId: string,
  courierCompany: string,
  trackingCode: string,
  shippingStatus: string,
) {
  const database = getDatabase();
  database
    .prepare(`
      UPDATE orders SET
        courier_company = ?,
        tracking_code = ?,
        shipping_status = ?,
        status = CASE WHEN ? = 'Kargoya Verildi' THEN 'Kargoya verildi' ELSE status END
      WHERE id = ?
    `)
    .run(courierCompany, trackingCode, shippingStatus, shippingStatus, orderId);
  return true;
}

// =========================================================================
// RETURNS (RMA) & SUPPLIER RECOURSE
// =========================================================================

export function listReturns() {
  const database = getDatabase();
  return database
    .prepare(`
      SELECT returns.id, returns.order_id AS orderId, returns.product_id AS productId,
             returns.customer_name AS customerName, returns.reason, returns.customer_note AS customerNote,
             returns.photo_url AS photoUrl, returns.status, returns.refund_amount AS refundAmount,
             returns.created_at AS createdAt, products.name AS productName, products.code AS productCode
      FROM returns
      LEFT JOIN products ON products.id = returns.product_id
      ORDER BY returns.created_at DESC
    `)
    .all() as any[];
}

export function createReturnRequest(data: {
  orderId: string;
  productId?: string;
  customerName?: string;
  reason: string;
  customerNote?: string;
  photoUrl?: string;
}) {
  const database = getDatabase();
  const id = `rma-${randomUUID().slice(0, 10)}`;

  let prodId = data.productId;
  let custName = data.customerName;

  // Resolve product and customer from order if not provided
  if (!prodId) {
    const item = database.prepare("SELECT product_id FROM order_items WHERE order_id = ? LIMIT 1").get(data.orderId) as { product_id: string } | undefined;
    if (item) prodId = item.product_id;
  }
  if (!prodId) {
    const anyProd = database.prepare("SELECT id FROM products LIMIT 1").get() as { id: string } | undefined;
    prodId = anyProd?.id || "general";
  }

  if (!custName) {
    const orderRow = database.prepare("SELECT customer_name FROM orders WHERE id = ?").get(data.orderId) as { customer_name: string } | undefined;
    custName = orderRow?.customer_name || "Müşteri";
  }

  database
    .prepare(`
      INSERT INTO returns (id, order_id, product_id, customer_name, reason, customer_note, photo_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'İnceleniyor')
    `)
    .run(
      id,
      data.orderId,
      prodId,
      custName,
      data.reason,
      data.customerNote || "",
      data.photoUrl || "",
    );
  return id;
}

export function updateReturnStatus(returnId: string, status: string, refundAmount?: number) {
  const database = getDatabase();
  database
    .prepare("UPDATE returns SET status = ?, refund_amount = coalesce(?, refund_amount) WHERE id = ?")
    .run(status, refundAmount !== undefined ? refundAmount : null, returnId);
  return true;
}

export function listSupplierRecourses() {
  const database = getDatabase();
  return database
    .prepare(`
      SELECT supplier_recourses.id, supplier_recourses.return_id AS returnId,
             supplier_recourses.product_id AS productId, supplier_recourses.supplier,
             supplier_recourses.part_code AS partCode, supplier_recourses.problem_description AS problemDescription,
             supplier_recourses.status, supplier_recourses.resolution_note AS resolutionNote,
             supplier_recourses.created_at AS createdAt
      FROM supplier_recourses
      ORDER BY supplier_recourses.created_at DESC
    `)
    .all() as any[];
}

export function createSupplierRecourse(data: {
  returnId?: string;
  productId: string;
  supplier: string;
  partCode: string;
  problemDescription: string;
}) {
  const id = `RMA-SUP-${Date.now().toString(36).toUpperCase()}`;
  getDatabase()
    .prepare(`
      INSERT INTO supplier_recourses (id, return_id, product_id, supplier, part_code, problem_description)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(id, data.returnId || null, data.productId, data.supplier, data.partCode, data.problemDescription);
  return id;
}

// =========================================================================
// B2B BAYİ & MÜŞTERİ DİJİTAL GARAJI
// =========================================================================

export function listB2BGroups(): B2BGroup[] {
  const database = getDatabase();
  const groups = database
    .prepare(`
      SELECT b2b_groups.id, b2b_groups.name, b2b_groups.discount_percent AS discountPercent,
             b2b_groups.description, b2b_groups.min_order_amount AS minOrderAmount,
             b2b_groups.created_at AS createdAt,
             count(members.id) AS memberCount
      FROM b2b_groups
      LEFT JOIN members ON members.b2b_group_id = b2b_groups.id
      GROUP BY b2b_groups.id
      ORDER BY b2b_groups.discount_percent ASC
    `)
    .all() as any[];
  return groups;
}

export function listMembersFull(): MemberDetail[] {
  const database = getDatabase();
  const members = database
    .prepare(`
      SELECT members.id, members.google_subject AS googleSubject, members.email, members.name,
             members.phone, members.address_line AS addressLine, members.district, members.city,
             members.postal_code AS postalCode, members.b2b_group_id AS b2bGroupId,
             b2b_groups.name AS b2bGroupName, b2b_groups.discount_percent AS b2bDiscountPercent,
             members.company_title AS companyTitle, members.tax_office AS taxOffice,
             members.tax_number AS taxNumber, members.credit_balance AS creditBalance,
             members.is_banned AS isBanned, members.created_at AS createdAt,
             count(orders.id) AS orderCount
      FROM members
      LEFT JOIN b2b_groups ON b2b_groups.id = members.b2b_group_id
      LEFT JOIN orders ON orders.email = members.email COLLATE NOCASE
      GROUP BY members.id
      ORDER BY members.created_at DESC
    `)
    .all() as any[];

  const vehicleQuery = database.prepare(`
    SELECT id, member_id AS memberId, plate_number AS plateNumber, brand, model, year, vin,
           next_maintenance_date AS nextMaintenanceDate, last_maintenance_date AS lastMaintenanceDate,
           notes, created_at AS createdAt
    FROM member_vehicles WHERE member_id = ?
  `);

  return members.map((m) => ({
    ...m,
    isBanned: m.isBanned === 1,
    vehicles: vehicleQuery.all(m.id) as MemberVehicle[],
  }));
}

export function updateMemberB2B(
  memberId: string,
  data: {
    b2bGroupId?: string | null;
    companyTitle?: string;
    taxOffice?: string;
    taxNumber?: string;
    creditBalanceDelta?: number;
    isBanned?: boolean;
  },
) {
  const database = getDatabase();
  const updates: string[] = [];
  const params: Record<string, any> = { memberId };

  if (data.b2bGroupId !== undefined) {
    updates.push("b2b_group_id = @b2bGroupId");
    params.b2bGroupId = data.b2bGroupId;
  }
  if (data.companyTitle !== undefined) {
    updates.push("company_title = @companyTitle");
    params.companyTitle = data.companyTitle;
  }
  if (data.taxOffice !== undefined) {
    updates.push("tax_office = @taxOffice");
    params.taxOffice = data.taxOffice;
  }
  if (data.taxNumber !== undefined) {
    updates.push("tax_number = @taxNumber");
    params.taxNumber = data.taxNumber;
  }
  if (data.creditBalanceDelta !== undefined) {
    updates.push("credit_balance = credit_balance + @delta");
    params.delta = data.creditBalanceDelta;
  }
  if (data.isBanned !== undefined) {
    updates.push("is_banned = @isBanned");
    params.isBanned = data.isBanned ? 1 : 0;
  }

  if (updates.length === 0) return false;
  database.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = @memberId`).run(params);
  return true;
}

// =========================================================================
// MARKETING: PAYLINKS, ABANDONED CARTS, COUPONS
// =========================================================================

export function createPayLink(data: {
  customerName: string;
  phone: string;
  email?: string;
  partDescription: string;
  amount: number;
  createdBy?: string;
}) {
  const id = `PAY-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  getDatabase()
    .prepare(`
      INSERT INTO pay_links (id, customer_name, phone, email, part_description, amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, data.customerName, data.phone, data.email || "", data.partDescription, data.amount, data.createdBy || "Admin");
  return id;
}

export function listPayLinks(): PayLink[] {
  return getDatabase()
    .prepare(`
      SELECT id, customer_name AS customerName, phone, email, part_description AS partDescription,
             amount, status, order_id AS orderId, created_by AS createdBy, expires_at AS expiresAt,
             created_at AS createdAt
      FROM pay_links ORDER BY created_at DESC LIMIT 50
    `)
    .all() as any[];
}

export function listAbandonedCarts(): AbandonedCart[] {
  return getDatabase()
    .prepare(`
      SELECT id, member_id AS memberId, email, phone, items_json AS itemsJson,
             total_amount AS totalAmount, last_notified_at AS lastNotifiedAt,
             created_at AS createdAt
      FROM abandoned_carts ORDER BY created_at DESC LIMIT 50
    `)
    .all() as any[];
}

export function listCoupons(): Coupon[] {
  const rows = getDatabase()
    .prepare(`
      SELECT id, code, discount_type AS discountType, discount_value AS discountValue,
             min_order_amount AS minOrderAmount, usage_limit AS usageLimit, used_count AS usedCount,
             expires_at AS expiresAt, active, created_at AS createdAt
      FROM coupons ORDER BY created_at DESC
    `)
    .all() as any[];
  return rows.map((r) => ({ ...r, active: r.active === 1 }));
}

export function upsertCoupon(coupon: {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  usageLimit?: number;
}) {
  const id = `CP-${coupon.code.toUpperCase()}`;
  getDatabase()
    .prepare(`
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, usage_limit)
      VALUES (@id, @code, @discountType, @discountValue, @minOrderAmount, @usageLimit)
      ON CONFLICT(code) DO UPDATE SET
        discount_type = excluded.discount_type,
        discount_value = excluded.discount_value,
        min_order_amount = excluded.min_order_amount,
        usage_limit = excluded.usage_limit
    `)
    .run({
      id,
      code: coupon.code.toUpperCase(),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      usageLimit: coupon.usageLimit || 100,
    });
  return id;
}

// =========================================================================
// FINANCE: CURRENCIES, POS, SHIPPING RULES
// =========================================================================

export function getCurrencyRates(): CurrencyRate[] {
  return getDatabase().prepare("SELECT currency, rate, updated_at AS updatedAt FROM currency_rates").all() as any[];
}

export function updateCurrencyRate(currency: string, rate: number) {
  const database = getDatabase();
  database
    .prepare(`
      INSERT INTO currency_rates (currency, rate, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(currency) DO UPDATE SET rate = excluded.rate, updated_at = CURRENT_TIMESTAMP
    `)
    .run(currency.toUpperCase(), rate);

  // Auto-recalculate prices for products with this currency
  database.prepare(`
    UPDATE products
    SET price = CAST(round(cost * ? * 1.25) AS INTEGER)
    WHERE currency = ? AND cost > 0
  `).run(rate, currency.toUpperCase());

  return true;
}

export function listPosInstallments(): PosInstallment[] {
  const rows = getDatabase().prepare("SELECT * FROM pos_installments WHERE active = 1 ORDER BY bank_name, installment_count").all() as any[];
  return rows.map((r) => ({ ...r, active: r.active === 1 }));
}

export function listShippingRules(): ShippingRule[] {
  const rows = getDatabase().prepare("SELECT * FROM shipping_rules WHERE active = 1 ORDER BY min_desi ASC").all() as any[];
  return rows.map((r) => ({ ...r, active: r.active === 1 }));
}

// =========================================================================
// CMS & SITE DESIGN SETTINGS
// =========================================================================

export function getSiteSettings(): Record<string, string> {
  const rows = getDatabase().prepare("SELECT key, value FROM site_settings").all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export function setSiteSetting(key: string, value: string, category = "general") {
  getDatabase()
    .prepare(`
      INSERT INTO site_settings (key, value, category) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, value, category);
  return true;
}

export function listSlidersBanners(): SliderBanner[] {
  const rows = getDatabase().prepare("SELECT * FROM sliders_banners ORDER BY sort_order ASC, created_at DESC").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    imageDesktop: r.image_desktop,
    imageMobile: r.image_mobile,
    linkUrl: r.link_url,
    buttonText: r.button_text,
    position: r.position,
    sortOrder: r.sort_order,
    active: r.active === 1,
    createdAt: r.created_at,
  }));
}

export function listCmsPages(): CmsPage[] {
  const rows = getDatabase().prepare("SELECT * FROM cms_pages WHERE active = 1").all() as any[];
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    content: r.content,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    active: r.active === 1,
    updatedAt: r.updated_at,
  }));
}

export function getCmsPage(slug: string): CmsPage | null {
  const row = getDatabase().prepare("SELECT * FROM cms_pages WHERE slug = ?").get(slug) as any;
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    content: row.content,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    active: row.active === 1,
    updatedAt: row.updated_at,
  };
}

export function saveCmsPage(page: { slug: string; title: string; content: string; seoTitle?: string; seoDescription?: string }) {
  getDatabase()
    .prepare(`
      INSERT INTO cms_pages (slug, title, content, seo_title, seo_description, updated_at)
      VALUES (@slug, @title, @content, @seoTitle, @seoDescription, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        updated_at = CURRENT_TIMESTAMP
    `)
    .run({
      slug: page.slug,
      title: page.title,
      content: page.content,
      seoTitle: page.seoTitle || page.title,
      seoDescription: page.seoDescription || "",
    });
  return true;
}

// =========================================================================
// SECURITY & AUDIT LOGS
// =========================================================================

export function listAuditLogs(limit = 100): AuditLog[] {
  return getDatabase()
    .prepare(`
      SELECT id, admin_email AS adminEmail, action, entity_type AS entityType,
             entity_id AS entityId, details, ip_address AS ipAddress, created_at AS createdAt
      FROM audit_logs ORDER BY created_at DESC LIMIT ?
    `)
    .all(limit) as any[];
}

export function listAdmins(): Array<{ email: string; name: string; role: string; active: boolean; createdAt: string }> {
  const rows = getDatabase().prepare("SELECT email, name, role, active, created_at AS createdAt FROM admins").all() as any[];
  return rows.map((r) => ({ ...r, active: r.active === 1 }));
}

export function updateAdminRole(email: string, role: string, active: boolean) {
  getDatabase()
    .prepare("UPDATE admins SET role = ?, active = ? WHERE email = ?")
    .run(role, active ? 1 : 0, email);
  return true;
}

// Legacy Category & Brand lists for backwards compatibility
export function listBrands() {
  const rows = getDatabase()
    .prepare(
      `SELECT brands.brand, count(products.id) AS productCount,
              CASE WHEN hidden_brands.brand IS NULL THEN 1 ELSE 0 END AS visible
       FROM (
         SELECT brand FROM products WHERE active = 1
         UNION
         SELECT brand FROM hidden_brands
       ) AS brands
       LEFT JOIN products
         ON products.brand = brands.brand COLLATE NOCASE AND products.active = 1
       LEFT JOIN hidden_brands
         ON hidden_brands.brand = brands.brand COLLATE NOCASE
       GROUP BY brands.brand, hidden_brands.brand
       ORDER BY brands.brand COLLATE NOCASE`,
    )
    .all() as Array<{ brand: string; productCount: number; visible: number }>;
  return rows.map((row) => ({ ...row, visible: row.visible === 1 }));
}

export function setBrandVisibility(brand: string, visible: boolean) {
  const database = getDatabase();
  const exists = database
    .prepare(
      `SELECT 1 FROM products WHERE active = 1 AND brand = ? COLLATE NOCASE
       UNION
       SELECT 1 FROM hidden_brands WHERE brand = ? COLLATE NOCASE
       LIMIT 1`,
    )
    .get(brand, brand);
  if (!exists) return false;

  if (visible) {
    database
      .prepare("DELETE FROM hidden_brands WHERE brand = ? COLLATE NOCASE")
      .run(brand);
  } else {
    database
      .prepare("INSERT OR IGNORE INTO hidden_brands (brand) VALUES (?)")
      .run(brand);
  }
  return true;
}

export function listCategories(options?: { includeHidden?: boolean }) {
  const rows = getDatabase()
    .prepare(
      `SELECT catalog.name, count(products.id) AS productCount,
              coalesce(categories.active, 1) AS active,
              coalesce(categories.is_vehicle_tree, 0) AS isVehicleTree
       FROM (
         SELECT category COLLATE NOCASE AS name
         FROM products WHERE active = 1
         UNION
         SELECT name COLLATE NOCASE FROM categories
       ) AS catalog
       LEFT JOIN products
         ON products.category = catalog.name COLLATE NOCASE
         AND products.active = 1
       LEFT JOIN categories
         ON categories.name = catalog.name COLLATE NOCASE
       WHERE (@includeHidden = 1 OR categories.active IS NULL OR categories.active = 1)
       GROUP BY catalog.name COLLATE NOCASE, categories.active, categories.is_vehicle_tree
       ORDER BY catalog.name COLLATE NOCASE`,
    )
    .all({ includeHidden: options?.includeHidden ? 1 : 0 }) as Array<{
    name: string;
    productCount: number;
    active: number;
    isVehicleTree: number;
  }>;
  return rows.map((row) => ({
    name: row.name,
    productCount: row.productCount,
    visible: row.active === 1,
    isVehicleTree: row.isVehicleTree === 1,
  }));
}

export function addCategory(name: string) {
  try {
    getDatabase()
      .prepare("INSERT INTO categories (name, id, slug) VALUES (?, lower(replace(?, ' ', '-')), lower(replace(?, ' ', '-')))")
      .run(name, name, name);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed: categories.name")
    ) {
      return false;
    }
    throw error;
  }
}

export function renameCategory(currentName: string, nextName: string) {
  const database = getDatabase();
  const rename = database.transaction(() => {
    database
      .prepare("UPDATE categories SET name = ? WHERE name = ? COLLATE NOCASE")
      .run(nextName, currentName);
    database
      .prepare("UPDATE products SET category = ? WHERE category = ? COLLATE NOCASE")
      .run(nextName, currentName);
    return "renamed";
  });
  return rename.immediate();
}

export function setCategoryVisibility(name: string, visible: boolean) {
  const database = getDatabase();
  database
    .prepare(`
      INSERT INTO categories (name, active) VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET active = excluded.active
    `)
    .run(name, visible ? 1 : 0);
  return true;
}

export function listXmlSyncs() {
  return getDatabase()
    .prepare(
      `SELECT id, supplier, filename, imported_count AS importedCount,
              matched_count AS matchedCount, unmatched_codes AS unmatchedCodes,
              created_at AS createdAt
       FROM xml_syncs ORDER BY id DESC LIMIT 20`,
    )
    .all()
    .map((row: any) => ({
      ...row,
      unmatchedCodes: JSON.parse(row.unmatchedCodes) as string[],
    }));
}

// Enterprise Dashboard Stats
export function getDashboardStats() {
  const database = getDatabase();
  const productStats = database
    .prepare(
      `SELECT count(*) AS productCount,
              coalesce(sum(central_stock), 0) AS unitCount,
              coalesce(sum(CASE WHEN central_stock <= 5 THEN 1 ELSE 0 END), 0) AS lowStockCount
       FROM products
       WHERE active = 1
         AND code NOT LIKE 'DEMO-%' COLLATE NOCASE
         AND NOT EXISTS (
           SELECT 1 FROM hidden_brands
           WHERE hidden_brands.brand = products.brand COLLATE NOCASE
         )
         AND NOT EXISTS (
           SELECT 1 FROM categories
           WHERE categories.name = products.category COLLATE NOCASE
             AND categories.active = 0
         )`,
    )
    .get() as {
    productCount: number;
    unitCount: number;
    lowStockCount: number;
  };

  const orderStats = database
    .prepare(
      `SELECT count(*) AS orderCount,
              coalesce(sum(CASE WHEN status = 'Yeni' THEN 1 ELSE 0 END), 0) AS newOrderCount,
              coalesce(sum(CASE WHEN vin_status = 'Bekliyor' THEN 1 ELSE 0 END), 0) AS pendingVinCount,
              coalesce(sum(CASE
                WHEN date(created_at, 'localtime') = date('now', 'localtime')
                  AND status != 'İptal edildi'
                THEN total ELSE 0
              END), 0) AS todayRevenue,
              coalesce(sum(CASE
                WHEN date(created_at, 'localtime') = date('now', 'localtime')
                  AND status != 'İptal edildi'
                THEN net_profit ELSE 0
              END), 0) AS todayProfit
       FROM orders`,
    )
    .get() as {
      orderCount: number;
      newOrderCount: number;
      pendingVinCount: number;
      todayRevenue: number;
      todayProfit: number;
    };

  const memberStats = database
    .prepare("SELECT count(*) as memberCount FROM members")
    .get() as { memberCount: number };

  const rmaStats = database
    .prepare("SELECT count(*) as pendingRmaCount FROM returns WHERE status = 'Bekliyor'")
    .get() as { pendingRmaCount: number };

  const currencyRates = getCurrencyRates();

  return {
    ...productStats,
    ...orderStats,
    ...memberStats,
    ...rmaStats,
    currencyRates,
  };
}
