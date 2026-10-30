import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import {
  getDashboardStats,
  listBrands,
  listCategories,
  listOrders,
  listProducts,
  listXmlSyncs,
} from "@/lib/db";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
  }
  return NextResponse.json({
    admin,
    stats: getDashboardStats(),
    brands: listBrands(),
    categories: listCategories({ includeHidden: true }),
    products: listProducts({
      includeCosts: true,
      includeHiddenBrands: true,
      includeHiddenCategories: true,
    }),
    orders: listOrders(),
    xmlSyncs: listXmlSyncs(),
  });
}
