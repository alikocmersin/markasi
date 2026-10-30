import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { vehicleCatalog } from "@/data/vehicle-catalog";
import { getDatabase } from "@/lib/db";

const sourceUrl = "https://www.yedekparca.com.tr";
const sourceUserAgent = "Markasi-Authorized-Vehicle-Catalog/1.0";
const compatibilityId = "16";
const cacheDuration = 30 * 24 * 60 * 60 * 1000;
const sourcePageCacheDuration = 5 * 60 * 1000;
const stepLabels = ["Marka", "Model", "Kasa", "Yıl", "Motor", "Güç"];

type VehicleOption = { value: string; label: string };
type SourcePageData = {
  token: string;
  options: VehicleOption[];
  cookies: string;
};
type CachedOptions = {
  expiresAt: number;
  sequence: number;
  label: string;
  options: VehicleOption[];
};

declare global {
  var markasiVehicleSourcePage:
    | {
        expiresAt: number;
        value: Promise<SourcePageData>;
      }
    | undefined;
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function cacheKey(sequence: number, values: string[]) {
  const digest = createHash("sha256")
    .update(JSON.stringify([sequence, values]))
    .digest("hex");
  return `vehicle_fitment_yedekparca_${digest}`;
}

function getSavedOptions(key: string) {
  const saved = getDatabase()
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  if (!saved) return null;
  try {
    const data = JSON.parse(saved.value) as CachedOptions;
    if (
      data.expiresAt <= Date.now() ||
      !Array.isArray(data.options) ||
      !Number.isInteger(data.sequence)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveOptions(key: string, data: CachedOptions) {
  getDatabase()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, JSON.stringify(data));
}

async function getSourcePage() {
  const cached = globalThis.markasiVehicleSourcePage;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = (async (): Promise<SourcePageData> => {
    const response = await fetch(`${sourceUrl}/`, {
      cache: "no-store",
      headers: { "User-Agent": sourceUserAgent },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) throw new Error("Kaynak araç kataloğu açılamadı.");
    const html = await response.text();
    const token = html.match(/\btoken\s*:\s*['"]([^'"]+)['"]/)?.[1];
    if (!token) {
      throw new Error("Kaynak araç kataloğu güvenlik belirteci bulunamadı.");
    }

    const selector = html.match(
      /<select\b[^>]*name=["']specs\[1\]["'][^>]*>([\s\S]*?)<\/select>/i,
    )?.[1];
    if (!selector) throw new Error("Kaynak marka seçenekleri bulunamadı.");
    const options = Array.from(
      selector.matchAll(
        /<option\b[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi,
      ),
    )
      .map((match) => ({
        value: decodeHtml(match[1]),
        label: decodeHtml(match[2]),
      }))
      .filter((option) => option.value && option.label);

    const cookieHeader = response.headers.get("set-cookie") ?? "";
    const cookies = Array.from(
      cookieHeader.matchAll(/(?:^|,\s*)(_ecom_code|ecom_orcode)=([^;,]*)/g),
    )
      .map((match) => `${match[1]}=${match[2]}`)
      .join("; ");

    return { token, options, cookies };
  })();

  const entry = {
    expiresAt: Date.now() + sourcePageCacheDuration,
    value,
  };
  globalThis.markasiVehicleSourcePage = entry;
  try {
    return await value;
  } catch (error) {
    if (globalThis.markasiVehicleSourcePage === entry) {
      globalThis.markasiVehicleSourcePage = undefined;
    }
    throw error;
  }
}

function normalizeCatalogName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getLocalCatalogOptions(
  sequence: number,
  selectedValues: string[],
): VehicleOption[] {
  if (sequence === 1) {
    return vehicleCatalog.map((item) => ({
      value: item.label.replace(/\s+/g, "_"),
      label: item.label,
    }));
  }

  const brandNorm = normalizeCatalogName(selectedValues[0] ?? "");
  const foundBrand = vehicleCatalog.find((b) => {
    const norm = normalizeCatalogName(b.label);
    return (
      norm === brandNorm ||
      norm.startsWith(brandNorm) ||
      brandNorm.startsWith(norm)
    );
  });
  if (!foundBrand) return [];

  if (sequence === 2) {
    return foundBrand.models.map((m) => ({
      value: m.label.replace(/\s+/g, "_"),
      label: m.label,
    }));
  }

  const modelNorm = normalizeCatalogName(selectedValues[1] ?? "");
  const foundModel = foundBrand.models.find((m) => {
    const norm = normalizeCatalogName(m.label);
    return (
      norm === modelNorm ||
      norm.startsWith(modelNorm) ||
      modelNorm.startsWith(norm)
    );
  });
  if (!foundModel) return [];

  if (sequence === 3) {
    const bodies = Array.from(
      new Set(foundModel.generations.flatMap((g) => g.bodies)),
    );
    return bodies.map((body) => ({
      value: body.replace(/\s+/g, "_"),
      label: body,
    }));
  }

  const bodyNorm = normalizeCatalogName(selectedValues[2] ?? "");
  const matchingGens = foundModel.generations.filter(
    (g) =>
      !bodyNorm ||
      g.bodies.some((b) => normalizeCatalogName(b) === bodyNorm),
  );
  const targetGens =
    matchingGens.length > 0 ? matchingGens : foundModel.generations;

  if (sequence === 4) {
    return targetGens.map((g) => ({
      value: g.id,
      label: `${g.startYear} - ${g.endYear} (${g.label})`,
    }));
  }

  const genNorm = normalizeCatalogName(selectedValues[3] ?? "");
  const selectedYearNum = Number.parseInt(selectedValues[3] ?? "", 10);
  const foundGen =
    targetGens.find((g) => {
      const idNorm = normalizeCatalogName(g.id);
      const labelNorm = normalizeCatalogName(g.label);
      if (idNorm === genNorm || labelNorm.includes(genNorm) || genNorm.includes(idNorm)) {
        return true;
      }
      if (!Number.isNaN(selectedYearNum) && selectedYearNum >= g.startYear && selectedYearNum <= g.endYear) {
        return true;
      }
      return false;
    }) ?? targetGens[0];
  if (!foundGen) return [];

  if (sequence === 5) {
    return foundGen.engines.map((e) => ({
      value: e.label.replace(/\s+/g, "_"),
      label: e.label,
    }));
  }

  const engineNorm = normalizeCatalogName(selectedValues[4] ?? "");
  const foundEngine =
    foundGen.engines.find((e) => normalizeCatalogName(e.label) === engineNorm) ??
    foundGen.engines[0];
  if (!foundEngine) return [];

  if (sequence === 6) {
    return foundEngine.powerHp.map((hp) => ({
      value: `${hp}_HP`,
      label: `${hp} HP`,
    }));
  }

  return [];
}

async function getOptions(
  sequence: number,
  selectedValues: string[],
): Promise<VehicleOption[]> {
  const key = cacheKey(sequence, selectedValues);
  const cached = getSavedOptions(key);
  if (cached) return cached.options;

  const session = await getSourcePage();
  let options = session.options;

  if (sequence > 1) {
    const fields = new URLSearchParams();
    fields.set("compatibility_id", compatibilityId);
    for (let index = 0; index < sequence; index += 1) {
      fields.set(`specs[${index + 1}]`, selectedValues[index] ?? "");
    }
    fields.set("current_seq", String(sequence - 1));
    fields.set("next_seq", String(sequence));

    const headers: Record<string, string> = {
      "Accept-Content-Token": session.token,
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Origin: sourceUrl,
      Referer: `${sourceUrl}/`,
      "User-Agent": sourceUserAgent,
      "X-Requested-With": "XMLHttpRequest",
    };
    if (session.cookies) headers.Cookie = session.cookies;

    const response = await fetch(
      `${sourceUrl}/ajax.php?page=smart-theme&method=Visitor&action=compatibilityValues`,
      {
        method: "POST",
        headers,
        body: fields.toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(4_000),
      },
    );
    if (!response.ok) throw new Error("Kaynak araç uyumluluk servisi yanıt vermedi.");
    const result = (await response.json()) as {
      status?: string;
      uyumluluk?: {
        sira?: number;
        ozellik?: {
          liste?: Array<{ adi_alt?: unknown; adi?: unknown }>;
        };
      };
    };
    if (
      result.status !== "success" ||
      result.uyumluluk?.sira !== sequence ||
      !Array.isArray(result.uyumluluk.ozellik?.liste)
    ) {
      throw new Error("Kaynak araç uyumluluk servisi seçenekleri döndüremedi.");
    }
    options = result.uyumluluk.ozellik.liste.flatMap((item) => {
      const value =
        typeof item.adi_alt === "string" ? item.adi_alt.trim() : "";
      const label = typeof item.adi === "string" ? item.adi.trim() : "";
      return value && label ? [{ value, label }] : [];
    });
  }

  const data = {
    expiresAt: Date.now() + cacheDuration,
    sequence,
    label: stepLabels[sequence - 1],
    options,
  };
  saveOptions(key, data);
  return options;
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;

  // 1. Full Catalog Dump for client-side instant pre-caching
  if (search.get("all") === "1" || search.get("full") === "1") {
    return NextResponse.json(
      { catalog: vehicleCatalog },
      {
        headers: {
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
        },
      },
    );
  }

  if (search.get("warm") === "1") {
    return NextResponse.json(
      { ready: true, count: vehicleCatalog.length },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  }

  const sequence = Number(search.get("sequence") ?? "1");
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 6) {
    return NextResponse.json(
      { error: "Araç seçim aşaması 1 ile 6 arasında olmalıdır." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const selectedValues = Array.from({ length: sequence - 1 }, (_, index) =>
    (search.get(`specs[${index + 1}]`) ?? "").trim().slice(0, 120),
  );
  if (selectedValues.some((value) => !value)) {
    return NextResponse.json(
      { error: "Önceki araç seçimlerini sırasıyla tamamlayın." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 2. FAST LOCAL CATALOG FIRST (0.1ms, zero latency, zero timeouts)
  const localOptions = getLocalCatalogOptions(sequence, selectedValues);
  if (localOptions.length > 0) {
    return NextResponse.json(
      {
        sequence,
        label: stepLabels[sequence - 1],
        options: localOptions,
        source: "local-catalog",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  }

  // 3. REMOTE FALLBACK ONLY IF UNKNOWN BRAND IN LOCAL CATALOG
  try {
    const options = await getOptions(sequence, selectedValues);
    return NextResponse.json(
      {
        sequence,
        label: stepLabels[sequence - 1],
        options,
        source: "remote-service",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        sequence,
        label: stepLabels[sequence - 1],
        options: [],
        source: "empty",
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
