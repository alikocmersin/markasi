import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { readJsonObject } from "@/lib/request";

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
const cacheDuration = 12 * 60 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; vehicle: DecodedVehicle }>();

type DecodedVehicle = {
  vin: string;
  make: string;
  model: string;
  modelYear: string;
  trim: string;
  bodyClass: string;
  engineModel: string;
  displacementL: string;
  engineCylinders: string;
  engineHP: string;
  engineKW: string;
  fuelType: string;
  manufacturer: string;
  plantCountry: string;
  errorText: string;
};

function field(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "İstek kaynağı doğrulanamadı." },
      { status: 403 },
    );
  }

  const body = await readJsonObject(request);
  const vin = field(body?.vin).toUpperCase();
  if (!vinPattern.test(vin)) {
    return NextResponse.json(
      { error: "17 karakterli geçerli bir VIN girin. I, O ve Q harfleri kullanılamaz." },
      { status: 400 },
    );
  }

  const now = Date.now();
  const cached = cache.get(vin);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({ vehicle: cached.vehicle, source: "NHTSA vPIC" });
  }
  if (cache.size > 1_000) {
    for (const [key, value] of cache) {
      if (value.expiresAt <= now) cache.delete(key);
    }
  }

  let response: Response;
  try {
    response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`,
      { cache: "no-store", signal: AbortSignal.timeout(10_000) },
    );
  } catch {
    return NextResponse.json(
      { error: "VIN doğrulama servisine şu anda ulaşılamıyor. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "VIN doğrulama servisi isteği tamamlayamadı. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }

  let result: { Results?: Record<string, unknown>[] };
  try {
    result = (await response.json()) as { Results?: Record<string, unknown>[] };
  } catch {
    return NextResponse.json(
      { error: "VIN doğrulama servisinden geçersiz yanıt alındı." },
      { status: 502 },
    );
  }

  const record = result.Results?.[0];
  if (!record) {
    return NextResponse.json(
      { error: "Bu VIN için araç bilgisi bulunamadı." },
      { status: 404 },
    );
  }

  const vehicle: DecodedVehicle = {
    vin,
    make: field(record.Make),
    model: field(record.Model),
    modelYear: field(record.ModelYear),
    trim: field(record.Trim),
    bodyClass: field(record.BodyClass),
    engineModel: field(record.EngineModel),
    displacementL: field(record.DisplacementL),
    engineCylinders: field(record.EngineCylinders),
    engineHP: field(record.EngineHP),
    engineKW: field(record.EngineKW),
    fuelType: field(record.FuelTypePrimary),
    manufacturer: field(record.Manufacturer),
    plantCountry: field(record.PlantCountry),
    errorText: field(record.ErrorText),
  };
  if (!vehicle.make && !vehicle.model && !vehicle.modelYear) {
    return NextResponse.json(
      {
        error:
          "VIN biçimi geçerli ancak NHTSA vPIC bu araç için çözümleyebileceği bilgi döndürmedi. Avrupa araçlarında veri kapsamı sınırlı olabilir.",
      },
      { status: 404 },
    );
  }

  cache.set(vin, { vehicle, expiresAt: now + cacheDuration });
  return NextResponse.json({ vehicle, source: "NHTSA vPIC" });
}
