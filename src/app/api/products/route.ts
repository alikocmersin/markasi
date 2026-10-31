import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import {
  listCategories,
  listProducts,
  normalizeProductSearch,
} from "@/lib/db";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const includeCost = search.get("cost") === "1";
  const admin = await getAdmin();
  if (includeCost && !admin) {
    return NextResponse.json(
      { error: "Alış maliyeti yalnızca yönetici oturumunda görüntülenebilir." },
      { status: 403 },
    );
  }
  const query = (search.get("q") ?? "").trim().slice(0, 100);
  const category = (search.get("category") ?? "").trim().slice(0, 80);
  const vehicleBrand = (search.get("brand") ?? "").trim().slice(0, 60);
  const vehicleModel = (search.get("model") ?? "").trim().slice(0, 60);
  const vehicleBody = (search.get("body") ?? "").trim().slice(0, 60);
  const vehicleYear = (search.get("year") ?? "").trim().slice(0, 30);
  const vehicleEngine = (search.get("engine") ?? "").trim().slice(0, 60);

  const products = listProducts({
    query,
    category,
    vehicleBrand,
    vehicleModel,
    vehicleBody,
    vehicleYear,
    vehicleEngine,
    includeCosts: includeCost && Boolean(admin),
  });

  const visibleProducts = products.map((product) => {
    const supplierTotal = Array.isArray(product.xmlStock)
      ? product.xmlStock.reduce((sum, s) => sum + (s.quantity || 0), 0)
      : 0;
    const totalStock = (product.centralStock || 0) + supplierTotal;
    const canPurchase = totalStock > 0;

    if (admin) {
      const { cost, ...visibleProduct } = product;
      return {
        ...visibleProduct,
        ...(includeCost ? { cost } : {}),
        totalStock,
        canPurchase,
        suppliers: product.xmlStock || [],
      };
    }

    return {
      id: product.id,
      brand: product.brand,
      name: product.name,
      code: product.code,
      kind: product.kind,
      category: product.category,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      images: product.images || [],
      description: product.description || "",
      centralStock: product.centralStock,
      totalStock,
      canPurchase,
      xmlStock: product.xmlStock || [],
      suppliers: product.xmlStock || [],
      fitment: product.fitment,
      compatibleVehicles: product.compatibleVehicles || [],
      position: product.position || "Yönsüz / Evrensel",
      hasCoreDeposit: Boolean(product.hasCoreDeposit),
      coreDepositPrice: product.coreDepositPrice || 0,
    };
  });
  return NextResponse.json({
    products: visibleProducts,
    categories: listCategories().filter((c) => !c.isVehicleTree).map((category) => category.name),
  });
}
