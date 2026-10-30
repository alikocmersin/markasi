import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  listAdmins,
  listAuditLogs,
  recordAuditLog,
  updateAdminRole,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Backup Database Download
  if (searchParams.get("action") === "backup") {
    try {
      const dbPath = join(process.cwd(), "data", "markasi.sqlite");
      const fileBuffer = readFileSync(dbPath);

      recordAuditLog(admin.email, "DOWNLOAD_BACKUP", "Security", "DATABASE", "Veritabanı yedeği indirildi.");

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="markasi-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite"`,
        },
      });
    } catch {
      return NextResponse.json({ error: "Veritabanı yedeği alınamadı." }, { status: 500 });
    }
  }

  const auditLogs = listAuditLogs(150);
  const admins = listAdmins();

  return NextResponse.json({ auditLogs, admins });
}

export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  if (!body || !body.email || !body.role) {
    return NextResponse.json({ error: "Yönetici e-posta ve rol zorunludur." }, { status: 400 });
  }

  const email = String(body.email);
  const role = String(body.role);
  const active = body.active !== false;

  updateAdminRole(email, role, active);
  recordAuditLog(admin.email, "UPDATE_ADMIN_ROLE", "Admin", email, `Rol: ${role}, Aktif: ${active}`);

  return NextResponse.json({ success: true });
}

