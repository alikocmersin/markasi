import { mkdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
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
    let isFileSystemWritable = true;
    try {
      mkdirSync(uploadDir, { recursive: true });
    } catch {
      // In serverless environments like Vercel Lambda, filesystem is read-only
      isFileSystemWritable = false;
    }

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      const mime = (file.type || "image/jpeg").toLowerCase();
      if (!mime.startsWith("image/") && !mime.includes("svg")) {
        return NextResponse.json(
          { error: "Yalnızca resim dosyaları yüklenebilir (JPG, PNG, WebP, GIF, SVG)." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Resim boyutu en fazla 10MB olabilir." }, { status: 400 });
      }

      let ext = extname(file.name).toLowerCase();
      if (!ext || ext.length > 5) {
        ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : mime.includes("svg") ? ".svg" : ".jpg";
      }

      // If local filesystem is writable, write to disk
      if (isFileSystemWritable) {
        try {
          const filename = `part_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
          const filePath = join(uploadDir, filename);
          writeFileSync(filePath, buffer);
          uploadedUrls.push(`/uploads/products/${filename}`);
          continue;
        } catch {
          // If write fails, fall through to Base64 Data URL
        }
      }

      // Serverless (Vercel) fallback: generate clean, self-contained Base64 Data URL
      const base64Data = buffer.toString("base64");
      const dataUrl = `data:${mime};base64,${base64Data}`;
      uploadedUrls.push(dataUrl);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0] || "",
      urls: uploadedUrls,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Resim yüklenirken hata oluştu.";
    console.error("Upload error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
