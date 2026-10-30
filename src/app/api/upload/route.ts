import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const singleFile = formData.get("file") as File | null;

    const filesToProcess = files.length > 0 ? files : singleFile ? [singleFile] : [];
    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "Lütfen en az bir resim dosyası seçin." }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "products");
    mkdirSync(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      const mime = file.type.toLowerCase();
      if (!mime.startsWith("image/")) {
        return NextResponse.json({ error: "Yalnızca resim dosyaları yüklenebilir (JPG, PNG, WebP, GIF)." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Resim boyutu en fazla 10MB olabilir." }, { status: 400 });
      }

      let ext = extname(file.name).toLowerCase();
      if (!ext || ext.length > 5) {
        ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg";
      }

      const filename = `part_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
      const filePath = join(uploadDir, filename);

      writeFileSync(filePath, buffer);
      uploadedUrls.push(`/uploads/products/${filename}`);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0] || "",
      urls: uploadedUrls,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Resim yüklenirken hata oluştu." }, { status: 500 });
  }
}

