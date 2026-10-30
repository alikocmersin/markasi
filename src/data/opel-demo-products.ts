import { vehicleCatalog } from "@/data/vehicle-catalog";

const demoParts = [
  { name: "Yağ filtresi", category: "Filtreler" },
  { name: "Hava filtresi", category: "Filtreler" },
  { name: "Polen filtresi", category: "Filtreler" },
];

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createOpelDemoProducts() {
  const opel = vehicleCatalog.find((manufacturer) => manufacturer.label === "Opel");
  if (!opel) return [];

  const applications = opel.models.flatMap((model) =>
    model.generations.flatMap((generation) =>
      generation.engines.flatMap((engine, engineIndex) =>
        engine.powerHp.map((power) => ({
          model: model.label,
          generationId: generation.id,
          startYear: generation.startYear,
          endYear: generation.endYear,
          engine: engine.label,
          engineIndex,
          power,
        })),
      ),
    ),
  );
  const products = [];

  for (let index = 0; index < 100; index += 1) {
    const application = applications[index % applications.length];
    const part = demoParts[Math.floor(index / applications.length)];
    if (!application || !part) break;

    const modelSlug = slug(application.model);
    const generationSlug = slug(application.generationId);
    const engineSlug = slug(application.engine);
    const id = `opel-demo-${index + 1}`;
    products.push({
      id,
      brand: "Demo · Uyumluluk doğrulanmalı",
      name: `${part.name} · Opel ${application.model} ${application.generationId} (Demo)`,
      code: `DEMO-OPL-${modelSlug}-${generationSlug}-${engineSlug}-${application.power}-${index + 1}`,
      kind: "Eşdeğer",
      category: part.category,
      price: 0,
      cost: 0,
      centralStock: 0,
      shelf: "DOĞRULAMA",
      fitment:
        `Opel ${application.model} ${application.generationId} ` +
        `${application.startYear}-${application.endYear} · ` +
        `${application.engine} · ${application.power} HP · Demo, parça kodu doğrulanmalı`,
      suppliers: [],
    });
  }

  return products;
}
