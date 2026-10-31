import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import {
  getCmsPage,
  getDatabase,
  getSiteSettings,
  listCmsPages,
  listSlidersBanners,
  recordAuditLog,
  saveCmsPage,
  setSiteSetting,
} from "@/lib/db";
import { readJsonObject } from "@/lib/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("page");

  if (slug) {
    const page = getCmsPage(slug);
    if (!page) return NextResponse.json({ error: "Sayfa bulunamadı." }, { status: 404 });
    return NextResponse.json({ page });
  }

  // Public settings endpoint (called by frontend or admin)
  const settings = getSiteSettings();
  const sliders = listSlidersBanners();
  const pages = listCmsPages();

  return NextResponse.json(
    { settings, sliders, pages },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
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
  if (!body) {
    return NextResponse.json({ error: "Geçersiz içerik." }, { status: 400 });
  }

  const section = String(body.section || "settings");

  // Section 1: Site Settings key-value pairs
  if (section === "settings" && body.settings && typeof body.settings === "object") {
    const settingsObj = body.settings as Record<string, string>;
    for (const [key, value] of Object.entries(settingsObj)) {
      if (typeof value === "string") {
        setSiteSetting(key, value.trim());
      }
    }
    recordAuditLog(admin.email, "UPDATE_SITE_SETTINGS", "CMS", "GENERAL", "Site ayarları güncellendi.");
    return NextResponse.json({ success: true });
  }

  // Section 2: CMS Page Content Update
  if (section === "page" && body.slug && body.title && body.content) {
    saveCmsPage({
      slug: String(body.slug).trim(),
      title: String(body.title).trim(),
      content: String(body.content),
      seoTitle: body.seoTitle ? String(body.seoTitle).trim() : undefined,
      seoDescription: body.seoDescription ? String(body.seoDescription).trim() : undefined,
    });
    recordAuditLog(admin.email, "UPDATE_CMS_PAGE", "CMS", String(body.slug), `${body.title} sayfası güncellendi.`);
    return NextResponse.json({ success: true });
  }

  // Section 3: Slider / Banner Add or Update
  if (section === "slider") {
    const id = body.id ? String(body.id) : `sl-${randomUUID().slice(0, 8)}`;
    const title = String(body.title || "").trim();
    const subtitle = String(body.subtitle || "").trim();
    const imageDesktop = String(body.imageDesktop || "").trim();
    const imageMobile = String(body.imageMobile || imageDesktop).trim();
    const linkUrl = String(body.linkUrl || "/").trim();
    const buttonText = String(body.buttonText || "İncele").trim();
    const position = ["hero_slider", "top_banner", "middle_banner", "bottom_banner"].includes(String(body.position))
      ? String(body.position)
      : "hero_slider";
    const sortOrder = Number(body.sortOrder || 0);
    const active = body.active !== false ? 1 : 0;

    if (!title || !imageDesktop) {
      return NextResponse.json({ error: "Başlık ve görsel zorunludur." }, { status: 400 });
    }

    getDatabase()
      .prepare(`
        INSERT INTO sliders_banners (id, title, subtitle, image_desktop, image_mobile, link_url, button_text, position, sort_order, active)
        VALUES (@id, @title, @subtitle, @imageDesktop, @imageMobile, @linkUrl, @buttonText, @position, @sortOrder, @active)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          subtitle = excluded.subtitle,
          image_desktop = excluded.image_desktop,
          image_mobile = excluded.image_mobile,
          link_url = excluded.link_url,
          button_text = excluded.button_text,
          position = excluded.position,
          sort_order = excluded.sort_order,
          active = excluded.active
      `)
      .run({ id, title, subtitle, imageDesktop, imageMobile, linkUrl, buttonText, position, sortOrder, active });

    recordAuditLog(admin.email, "UPSERT_SLIDER", "CMS", id, `Banner/Slider güncellendi: ${title}`);
    return NextResponse.json({ success: true, id });
  }

  // Section 4: Delete Slider
  if (section === "delete-slider" && body.id) {
    getDatabase().prepare("DELETE FROM sliders_banners WHERE id = ?").run(String(body.id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Bilinmeyen CMS işlemi." }, { status: 400 });
}

