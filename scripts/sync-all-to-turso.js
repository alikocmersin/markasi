const Database = require("better-sqlite3");
const fs = require("node:fs");

let envUrl = process.env.TURSO_DATABASE_URL || "";
let envToken = process.env.TURSO_AUTH_TOKEN || "";

if ((!envUrl || !envToken) && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    if (line.startsWith("TURSO_DATABASE_URL=")) {
      envUrl = line.split("=")[1].trim();
    }
    if (line.startsWith("TURSO_AUTH_TOKEN=")) {
      envToken = line.split("=")[1].trim();
    }
  }
}

let TURSO_URL = envUrl || "https://markasi-alikocmersin.aws-eu-central-1.turso.io/v2/pipeline";
if (TURSO_URL.startsWith("libsql://")) {
  TURSO_URL = TURSO_URL.replace("libsql://", "https://");
}
if (!TURSO_URL.endsWith("/v2/pipeline")) {
  TURSO_URL = `${TURSO_URL.replace(/\/+$/, "")}/v2/pipeline`;
}

const TURSO_TOKEN =
  envToken ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTM0Nzc1OTYsImlkIjoiMDFhMTkzOTctMzgwMS03YTFjLWFjMzQtZjExZDI5NmJjZTkxIiwia2lkIjoiV2FPN2J0emlfcGl6S0RZVkJmOVFWMWxJRVRGaUROSHI5Y2MzOEthTFhVayIsInJpZCI6IjY0OWFkZjlmLTQwNDEtNGNkNi1hNGRhLWY0NjJkNWI1Y2U1MSJ9._Tcw_AStlNrJlkYlApqo6Xv1yOtMG13Ao9nR2MmA-wCV7dlaK6pCdelGZPdnbhVosZMW0yEAMuMvb7-C1cFOAQ";

async function executeTursoPipeline(requests) {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Turso HTTP Error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  return data;
}

async function main() {
  console.log("1. Opening local SQLite...");
  const db = new Database("data/markasi.sqlite");

  console.log("2. Extracting schema...");
  const tables = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();

  console.log(`Found ${tables.length} tables in local SQLite.`);

  // 1. Create tables on Turso
  const createTableRequests = [];
  for (const t of tables) {
    if (t.sql) {
      // Clean up CREATE TABLE statement to include IF NOT EXISTS if not present
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

  console.log("Creating tables on Turso...");
  const tableResult = await executeTursoPipeline(createTableRequests);
  const errors = (tableResult.results || []).filter((r) => r.type === "error");
  if (errors.length > 0) {
    console.warn("Some create table warnings/errors:", JSON.stringify(errors, null, 2));
  } else {
    console.log("All tables created successfully on Turso!");
  }

  // 2. Dump and insert table contents
  const syncTables = [
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

  for (const tableName of syncTables) {
    const tableExists = tables.find((t) => t.name === tableName);
    if (!tableExists) continue;

    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) {
      console.log(`- Table ${tableName}: 0 rows (skipped)`);
      continue;
    }

    console.log(`- Syncing table ${tableName}: ${rows.length} rows...`);

    // Prepare batched insert requests
    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(", ");

    const batchSize = 40;
    for (let i = 0; i < rows.length; i += batchSize) {
      const slice = rows.slice(i, i + batchSize);
      const requests = slice.map((row) => {
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

      const res = await executeTursoPipeline(requests);
      const resErrors = (res.results || []).filter((r) => r.type === "error");
      if (resErrors.length > 0) {
        console.error(`Error in batch for ${tableName}:`, JSON.stringify(resErrors[0], null, 2));
      }
    }
  }

  // 3. Verification on Turso
  console.log("\n3. Verifying records in Turso...");
  const verifyRequests = syncTables.map((t) => ({
    type: "execute",
    stmt: { sql: `SELECT COUNT(*) as cnt FROM "${t}"` },
  }));
  verifyRequests.push({ type: "close" });

  const verifyRes = await executeTursoPipeline(verifyRequests);
  syncTables.forEach((t, idx) => {
    const result = verifyRes.results[idx];
    if (result && result.type === "ok" && result.response?.result?.rows?.[0]?.[0]) {
      console.log(`  ✓ ${t}: ${result.response.result.rows[0][0].value} rows in Turso`);
    } else {
      console.log(`  ? ${t}: could not verify`);
    }
  });

  console.log("\nDONE! All data is fully synchronized to Turso Cloud!");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
