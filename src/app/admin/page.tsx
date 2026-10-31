"use client";

import {
  AlertTriangle,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BadgeAlert,
  BarChart3,
  Bell,
  Box,
  Boxes,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  FolderTree,
  Globe,
  HardDriveDownload,
  HelpCircle,
  History,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LayoutDashboard,
  Link2,
  ListFilter,
  ListPlus,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Package,
  PackageCheck,
  PackagePlus,
  Percent,
  Phone,
  Plus,
  Printer,
  QrCode,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Sparkles,
  Tag,
  Tags,
  Trash2,
  Truck,
  Upload,
  UserCheck,
  Users,
  Warehouse,
  Wrench,
  X,
  XCircle,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { vehicleCatalog } from "@/data/vehicle-catalog";

// =========================================================================
// TYPES
// =========================================================================

type TabType =
  | "overview"
  | "categories"
  | "scraper"
  | "products"
  | "orders"
  | "returns"
  | "members"
  | "marketing"
  | "finance"
  | "cms"
  | "security";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  icon: string;
  banner: string;
  seoTitle: string;
  seoDescription: string;
  defaultMargin: number;
  isVehicleTree: boolean;
  active: boolean;
  productCount?: number;
  children?: CategoryItem[];
};

type VehicleFitment = {
  brand: string;
  model: string;
  generation?: string;
  engine?: string;
  yearRange?: string;
};

type Product = {
  id: string;
  brand: string;
  name: string;
  code: string;
  kind: "OEM" | "Eşdeğer";
  category: string;
  price: number;
  cost: number;
  centralStock: number;
  shelf: string;
  corridor?: string;
  bin?: string;
  fitment: string;
  sku?: string;
  barcode?: string;
  oemCodes?: string[];
  manufacturerBrand?: string;
  condition?: "Sıfır" | "Çıkma" | "Yenilenmiş";
  warrantyMonths?: number;
  desi?: number;
  weightKg?: number;
  discountPrice?: number;
  currency?: "TL" | "USD" | "EUR";
  vatRate?: number;
  sourceUrl?: string;
  sourceLastPrice?: number;
  sourceLastChecked?: string;
  description?: string;
  specsJson?: string;
  isBundle?: boolean;
  images?: string[];
  xmlStock?: Array<{ supplier: string; quantity: number; delivery: string; purchasePrice?: number }>;
  compatibleVehicles?: VehicleFitment[];
  position?: string;
  hasCoreDeposit?: boolean;
  coreDepositPrice?: number;
};

type Order = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  status: "Yeni" | "Hazırlanıyor" | "Kargoya verildi" | "Tamamlandı" | "İptal edildi";
  total: number;
  createdAt: string;
  items: Array<{
    id?: number;
    productId: string;
    name: string;
    code: string;
    quantity: number;
    unitPrice: number;
    shelf?: string;
    corridor?: string;
    bin?: string;
  }>;
  vinNumber?: string;
  licensePlatePhoto?: string;
  vinStatus?: "Bekliyor" | "Uyumlu" | "Uyumsuz";
  courierCompany?: string;
  trackingCode?: string;
  shippingStatus?: string;
  shippingCost?: number;
  posCommission?: number;
  purchaseCost?: number;
  netProfit?: number;
  invoiceStatus?: "Kesilmedi" | "Kesildi" | "İptal";
  customerNotes?: string;
  adminNotes?: string;
};

type ReturnItem = {
  id: string;
  orderId: string;
  productId: string;
  customerName: string;
  reason: string;
  customerNote: string;
  photoUrl: string;
  status: "Bekliyor" | "Onaylandı" | "Reddedildi" | "Tamamlandı";
  refundAmount: number;
  createdAt: string;
  productName?: string;
  productCode?: string;
};

type SupplierRecourse = {
  id: string;
  returnId?: string;
  productId: string;
  supplier: string;
  partCode: string;
  problemDescription: string;
  status: "Tedarikçiye Gönderildi" | "İncelemede" | "Kabul Edildi (İade/Değişim)" | "Reddedildi";
  resolutionNote: string;
  createdAt: string;
};

type MemberDetail = {
  id: string;
  email: string;
  name: string;
  phone: string;
  addressLine: string;
  district: string;
  city: string;
  postalCode: string;
  b2bGroupId: string | null;
  b2bGroupName?: string;
  b2bDiscountPercent?: number;
  companyTitle: string;
  taxOffice: string;
  taxNumber: string;
  creditBalance: number;
  isBanned: boolean;
  createdAt: string;
  vehicles?: Array<{
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: string;
    vin: string;
    nextMaintenanceDate: string;
    lastMaintenanceDate: string;
    notes: string;
  }>;
  orderCount?: number;
};

type B2BGroup = {
  id: string;
  name: string;
  discountPercent: number;
  description: string;
  minOrderAmount: number;
  memberCount?: number;
};

type PayLink = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  partDescription: string;
  amount: number;
  status: "Ödenmedi" | "Ödendi" | "İptal";
  orderId?: string;
  createdBy: string;
  createdAt: string;
};

type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

type CurrencyRate = {
  currency: string;
  rate: number;
  updatedAt: string;
};

type AuditLog = {
  id: number;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
};

type CmsPage = {
  slug: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  active: boolean;
  updatedAt: string;
};

type SliderBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageDesktop: string;
  imageMobile: string;
  linkUrl: string;
  buttonText: string;
  position: "hero_slider" | "top_banner" | "middle_banner" | "bottom_banner";
  sortOrder: number;
  active: boolean;
};

export default function EnterpriseAdminSuite() {
  const [admin, setAdmin] = useState<{ email: string; name: string; role?: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState("alikocmersin@gmail.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Currency Shield live rates
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ USD: 36.5, EUR: 38.2 });
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  // Overview stats
  const [stats, setStats] = useState<any>({});

  // 1. Categories Split-View State
  const [categoriesTree, setCategoriesTree] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [isVehicleTreeMode, setIsVehicleTreeMode] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // 2. Universal Scraper State
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any | null>(null);
  const [scraperMarkupType, setScraperMarkupType] = useState<"percent" | "amount">("percent");
  const [scraperMarkupValue, setScraperMarkupValue] = useState<number>(25);
  const [syncStatusReport, setSyncStatusReport] = useState<string>("");

  // 3. Products & WMS State
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productCriticalFilter, setProductCriticalFilter] = useState(false);
  const [productCorridorFilter, setProductCorridorFilter] = useState("");

  // Product Add / Edit Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    code: "",
    sku: "",
    barcode: "",
    brand: "",
    kind: "OEM" as "OEM" | "Eşdeğer",
    category: "",
    price: "",
    cost: "",
    discountPrice: "",
    currency: "TL" as "TL" | "USD" | "EUR",
    vatRate: 20,
    centralStock: "10",
    corridor: "A",
    shelf: "01",
    bin: "01",
    desi: "1.0",
    weightKg: "1.0",
    condition: "Sıfır" as "Sıfır" | "Çıkma" | "Yenilenmiş",
    warrantyMonths: 12,
    fitment: "",
    oemCodes: "",
    images: "",
    description: "",
    compatibleVehicles: [] as VehicleFitment[],
    position: "Yönsüz / Evrensel",
    hasCoreDeposit: false,
    coreDepositPrice: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Bulk Import State
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<{ total: number; inserted: number; updated: number; errors: string[] } | null>(null);
  const [bulkImportAutoCategory, setBulkImportAutoCategory] = useState(true);

  // Responsive Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scraper Category Selector
  const [scraperSelectedCategory, setScraperSelectedCategory] = useState("Filtreler");
  // Category Scraper & Staging Queue States
  const [categoryScrapeUrl, setCategoryScrapeUrl] = useState("");
  const [categoryScraping, setCategoryScraping] = useState(false);
  const [scrapedCategoryItems, setScrapedCategoryItems] = useState<any[]>([]);
  const [bulkImportMode, setBulkImportMode] = useState<"category-url" | "excel">("category-url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatImg, setUploadingCatImg] = useState<"icon" | "banner" | null>(null);
  const [bulkMarkupOpen, setBulkMarkupOpen] = useState(false);
  // Fitment Selector & Automotive States
  const [fitmentBrand, setFitmentBrand] = useState("");
  const [fitmentModel, setFitmentModel] = useState("");
  const [fitmentGeneration, setFitmentGeneration] = useState("");
  const [fitmentEngine, setFitmentEngine] = useState("");
  const [hasMultiFitment, setHasMultiFitment] = useState(false);
  const [quickOemModalOpen, setQuickOemModalOpen] = useState(false);
  const [quickOemText, setQuickOemText] = useState("");
  const [quickOemResults, setQuickOemResults] = useState<Product[]>([]);
  const [bulkPercent, setBulkPercent] = useState<number>(10);
  const [bulkApplyTo, setBulkApplyTo] = useState<"price" | "cost" | "both">("price");
  const [inlineEditingCell, setInlineEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>("");
  const [bundleWizardOpen, setBundleWizardOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleSelectedProducts, setBundleSelectedProducts] = useState<Array<{ id: string; name: string; qty: number }>>([]);

  // 4. Orders & VIN Verification Desk State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderVinFilter, setOrderVinFilter] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [vinInspectionModal, setVinInspectionModal] = useState<Order | null>(null);
  const [printingSlip, setPrintingSlip] = useState<{ order: Order; type: "picking" | "shipping" } | null>(null);

  // 5. Returns (RMA) & Recourse
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [recourses, setRecourses] = useState<SupplierRecourse[]>([]);

  // 6. Members & B2B Bayi
  const [members, setMembers] = useState<MemberDetail[]>([]);
  const [b2bGroups, setB2bGroups] = useState<B2BGroup[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [cariBalanceDelta, setCariBalanceDelta] = useState<string>("");

  // 7. Marketing (PayLink, Abandoned, Coupons)
  const [payLinks, setPayLinks] = useState<PayLink[]>([]);
  const [payLinkModal, setPayLinkModal] = useState(false);
  const [payLinkName, setPayLinkName] = useState("");
  const [payLinkPhone, setPayLinkPhone] = useState("");
  const [payLinkPart, setPayLinkPart] = useState("");
  const [payLinkAmount, setPayLinkAmount] = useState("");
  const [generatedPayUrl, setGeneratedPayUrl] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);

  // 8. Finance (POS & Shipping Rules)
  const [installments, setInstallments] = useState<any[]>([]);
  const [shippingRules, setShippingRules] = useState<any[]>([]);

  // 9. CMS & Web Design
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [cmsPages, setCmsPages] = useState<CmsPage[]>([]);
  const [selectedCmsPage, setSelectedCmsPage] = useState<CmsPage | null>(null);
  const [sliders, setSliders] = useState<SliderBanner[]>([]);
  const [savingCmsSettings, setSavingCmsSettings] = useState(false);

  // 10. Security & RBAC & Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Helper for toasts
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  const flatCategories = useMemo(() => {
    const list: Array<{ id: string; name: string; isVehicleTree?: boolean }> = [];
    function walk(items: CategoryItem[]) {
      for (const it of items) {
        list.push({ id: it.id, name: it.name, isVehicleTree: it.isVehicleTree });
        if (it.children && it.children.length > 0) {
          walk(it.children);
        }
      }
    }
    walk(categoriesTree);
    return list;
  }, [categoriesTree]);

    // Vehicle Fitment Cascading Data
  const currentBrandObj = useMemo(() => {
    return vehicleCatalog.find((b) => b.label === fitmentBrand);
  }, [fitmentBrand]);

  const currentModels = useMemo(() => {
    return currentBrandObj ? currentBrandObj.models : [];
  }, [currentBrandObj]);

  const currentModelObj = useMemo(() => {
    return currentModels.find((m) => m.label === fitmentModel);
  }, [currentModels, fitmentModel]);

  const currentGenerations = useMemo(() => {
    return currentModelObj ? currentModelObj.generations : [];
  }, [currentModelObj]);

  const currentGenObj = useMemo(() => {
    return currentGenerations.find((g) => g.id === fitmentGeneration || g.label === fitmentGeneration);
  }, [currentGenerations, fitmentGeneration]);

  const currentEngines = useMemo(() => {
    return currentGenObj ? currentGenObj.engines : [];
  }, [currentGenObj]);

  const handleAddFitmentVehicle = () => {
    if (!fitmentBrand || !fitmentModel) {
      showToast("Lütfen en azından Marka ve Model seçiniz.", "error");
      return;
    }

    const genLabel = currentGenObj ? currentGenObj.label : (fitmentGeneration || undefined);
    const yearText = currentGenObj ? `(${currentGenObj.startYear}-${currentGenObj.endYear || "Günümüz"})` : undefined;
    const engineText = fitmentEngine && fitmentEngine !== "Tüm Motorlar" ? fitmentEngine : undefined;

    const newVehicle: VehicleFitment = {
      brand: fitmentBrand,
      model: fitmentModel,
      generation: genLabel,
      engine: engineText,
      yearRange: yearText,
    };

    const currentList = productForm.compatibleVehicles || [];
    const isDup = currentList.some(
      (v) => v.brand === newVehicle.brand && v.model === newVehicle.model && v.generation === newVehicle.generation && v.engine === newVehicle.engine
    );
    if (isDup) {
      showToast("Bu araç uyumu zaten listenizde mevcut.", "error");
      return;
    }

    const updatedList = [...currentList, newVehicle];
    const generatedFitmentString = updatedList.map((v) => {
      const parts = [v.brand, v.model];
      if (v.generation) parts.push(v.generation);
      if (v.yearRange) parts.push(v.yearRange);
      if (v.engine) parts.push(v.engine);
      return parts.join(" ");
    }).join(", ");

    setProductForm({
      ...productForm,
      compatibleVehicles: updatedList,
      fitment: generatedFitmentString,
    });

    if (hasMultiFitment) {
      setFitmentModel("");
      setFitmentGeneration("");
      setFitmentEngine("");
      showToast(`"${newVehicle.brand} ${newVehicle.model}" eklendi! Başka araç eklemeye devam edebilirsiniz.`);
    } else {
      showToast(`"${newVehicle.brand} ${newVehicle.model}" araç uyumluluğu eklendi.`);
    }
  };

  const handleRemoveFitmentVehicle = (index: number) => {
    const updatedList = (productForm.compatibleVehicles || []).filter((_, i) => i !== index);
    const generatedFitmentString = updatedList.map((v) => {
      const parts = [v.brand, v.model];
      if (v.generation) parts.push(v.generation);
      if (v.yearRange) parts.push(v.yearRange);
      if (v.engine) parts.push(v.engine);
      return parts.join(" ");
    }).join(", ");

    setProductForm({
      ...productForm,
      compatibleVehicles: updatedList,
      fitment: generatedFitmentString,
    });
  };

  const handleQuickOemSearch = () => {
    if (!quickOemText.trim()) return;
    const codes = quickOemText.split(/[,;\n]+/).map((s) => s.trim().toUpperCase().replace(/\s+/g, '')).filter(Boolean);
    if (codes.length === 0) return;

    const matched = products.filter((p) => {
      const pCode = (p.code || "").toUpperCase().replace(/\s+/g, '');
      const pSku = (p.sku || "").toUpperCase().replace(/\s+/g, '');
      const pOems = (p.oemCodes || []).map((o) => o.toUpperCase().replace(/\s+/g, ''));
      return codes.some((c) => pCode.includes(c) || pSku.includes(c) || pOems.some((o) => o.includes(c)));
    });

    setQuickOemResults(matched);
    showToast(`${matched.length} uyumlu parça bulundu!`);
  };

  // Handlers for Product Add & Edit
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name || "",
        code: prod.code || "",
        sku: prod.sku || prod.code || "",
        barcode: prod.barcode || "",
        brand: prod.brand || "",
        kind: prod.kind || "OEM",
        category: prod.category || (flatCategories[0]?.name || "Filtreler"),
        price: ((prod.price || 0) / 100).toString(),
        cost: ((prod.cost || 0) / 100).toString(),
        discountPrice: prod.discountPrice ? (prod.discountPrice / 100).toString() : "",
        currency: prod.currency || "TL",
        vatRate: prod.vatRate ?? 20,
        centralStock: (prod.centralStock ?? 0).toString(),
        corridor: prod.corridor || "A",
        shelf: prod.shelf || "01",
        bin: prod.bin || "01",
        desi: (prod.desi ?? 1.0).toString(),
        weightKg: (prod.weightKg ?? 1.0).toString(),
        condition: prod.condition || "Sıfır",
        warrantyMonths: prod.warrantyMonths ?? 12,
        fitment: prod.fitment || "",
        oemCodes: (prod.oemCodes || []).join(", "),
        images: (prod.images || []).join("\n"),
        description: prod.description || "",
        compatibleVehicles: prod.compatibleVehicles || [],
        position: prod.position || "Yönsüz / Evrensel",
        hasCoreDeposit: Boolean(prod.hasCoreDeposit),
        coreDepositPrice: prod.coreDepositPrice ? (prod.coreDepositPrice / 100).toString() : "",
      });
    } else {
      setEditingProduct(null);
      const defaultCat = flatCategories.find((c) => !c.isVehicleTree)?.name || "Filtreler";
      setProductForm({
        name: "",
        code: "",
        sku: "",
        barcode: "",
        brand: "Genel",
        kind: "OEM",
        category: defaultCat,
        price: "",
        cost: "",
        discountPrice: "",
        currency: "TL",
        vatRate: 20,
        centralStock: "10",
        corridor: "A",
        shelf: "01",
        bin: "01",
        desi: "1.0",
        weightKg: "1.0",
        condition: "Sıfır",
        warrantyMonths: 12,
        fitment: "",
        oemCodes: "",
        images: "",
        description: "",
        compatibleVehicles: [],
        position: "Yönsüz / Evrensel",
        hasCoreDeposit: false,
        coreDepositPrice: "",
      });
      setFitmentBrand("");
      setFitmentModel("");
      setFitmentGeneration("");
      setFitmentEngine("");
      setHasMultiFitment(false);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const priceNum = parseFloat(productForm.price) || 0;
      const costNum = parseFloat(productForm.cost) || 0;
      const discountNum = productForm.discountPrice ? parseFloat(productForm.discountPrice) || 0 : 0;
      const oemArray = productForm.oemCodes.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
      const imgArray = productForm.images.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

      const payload = {
        name: productForm.name.trim(),
        code: productForm.code.trim(),
        sku: productForm.sku.trim() || productForm.code.trim(),
        barcode: productForm.barcode.trim(),
        brand: productForm.brand.trim() || "Genel",
        kind: productForm.kind,
        category: productForm.category.trim() || "Filtreler",
        price: priceNum,
        cost: costNum,
        discountPrice: discountNum,
        currency: productForm.currency,
        vatRate: Number(productForm.vatRate) || 20,
        centralStock: parseInt(productForm.centralStock) || 0,
        corridor: productForm.corridor.trim(),
        shelf: productForm.shelf.trim(),
        bin: productForm.bin.trim(),
        desi: parseFloat(productForm.desi) || 1.0,
        weightKg: parseFloat(productForm.weightKg) || 1.0,
        condition: productForm.condition,
        warrantyMonths: Number(productForm.warrantyMonths) || 12,
        fitment: productForm.fitment.trim(),
        oemCodes: oemArray,
        images: imgArray,
        description: productForm.description.trim(),
        compatibleVehicles: productForm.compatibleVehicles || [],
        position: productForm.position || "Yönsüz / Evrensel",
        hasCoreDeposit: productForm.hasCoreDeposit,
        coreDepositPrice: productForm.hasCoreDeposit ? (parseFloat(productForm.coreDepositPrice) || 0) : 0,
      };

      if (editingProduct) {
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "full_update",
            id: editingProduct.id,
            ...payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ürün güncellenemedi.");
        showToast("Ürün başarıyla güncellendi!");
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ürün eklenemedi.");
        showToast("Yeni ürün başarıyla eklendi!");
      }
      setProductModalOpen(false);
      void loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleBulkImportSubmit = async () => {
    if (!bulkImportText.trim()) {
      showToast("Lütfen içe aktarılacak CSV veya Excel metnini yapıştırın.", "error");
      return;
    }
    setBulkImportLoading(true);
    setBulkImportResult(null);
    try {
      const lines = bulkImportText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error("Veri bulunamadı.");

      const firstLine = lines[0];
      let sep = ";";
      if (firstLine.includes("\t")) sep = "\t";
      else if (firstLine.includes(";") && !firstLine.includes(",")) sep = ";";
      else if (firstLine.includes(",")) sep = ",";

      let startIdx = 0;
      const lowerFirst = firstLine.toLowerCase();
      if (lowerFirst.includes("stok") || lowerFirst.includes("kod") || lowerFirst.includes("ad") || lowerFirst.includes("fiyat") || lowerFirst.includes("sku")) {
        startIdx = 1;
      }

      const items: any[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(sep).map((p) => p.trim().replace(/^[\"\']|[\"\']$/g, ""));
        if (parts.length < 2) continue;
        const code = parts[0];
        const name = parts[1];
        const brand = parts[2] || "Genel";
        const category = parts[3] || "Filtreler";
        const price = parseFloat(parts[4]?.replace(",", ".")) || 0;
        const cost = parseFloat(parts[5]?.replace(",", ".")) || Math.round(price * 0.7);
        const stock = parseInt(parts[6]) || 10;
        const shelf = parts[7] || "A-01-01";
        const desi = parseFloat(parts[8]?.replace(",", ".")) || 1.0;
        const barcode = parts[9] || "";
        const oem = parts[10] || code;

        items.push({
          code,
          name,
          brand,
          category,
          price,
          cost,
          stock,
          shelf,
          desi,
          barcode,
          oemCodes: oem,
        });
      }

      if (items.length === 0) {
        throw new Error("Geçerli ürün satırı ayrıştırılamadı. Lütfen sütunları kontrol edin.");
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_import",
          items,
          autoCreateCategory: bulkImportAutoCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Toplu içe aktarma başarısız oldu.");

      setBulkImportResult(data);
      showToast(`${data.inserted} yeni ürün eklendi, ${data.updated} ürün güncellendi!`);
      void loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setBulkImportLoading(false);
    }
  };

    // Category Scraper Action
  const handleCategoryScrape = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!categoryScrapeUrl.trim()) {
      showToast("Lütfen taranacak kategori bağlantısını girin.", "error");
      return;
    }
    setCategoryScraping(true);
    setScrapedCategoryItems([]);
    try {
      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scrape-category",
          url: categoryScrapeUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kategori ürünleri çekilemedi.");
      if (!data.items || data.items.length === 0) {
        throw new Error("Bu linkte ürün bulunamadı. Lütfen geçerli bir ürün listeleme linki girin.");
      }
      const defaultCategory = flatCategories.find((c) => !c.isVehicleTree)?.name || "Filtreler";
      const mapped = data.items.map((it: any, idx: number) => ({
        id: "queue-" + (idx + 1),
        name: it.name || "Ürün",
        code: it.code || `PAR-${Date.now().toString(36).toUpperCase()}-${idx + 1}`,
        brand: it.brand || "Genel",
        category: defaultCategory,
        price: (it.price || 0) / 100,
        cost: Math.round(((it.price || 0) / 100) * 0.7),
        stock: 10,
        image: it.image || "",
        description: it.description || "",
      }));
      setScrapedCategoryItems(mapped);
      showToast(`${mapped.length} ürün başarıyla çekildi! Aşağıdan inceleyip düzenleyebilirsiniz.`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setCategoryScraping(false);
    }
  };

  const handleSaveQueueToCatalog = async () => {
    if (scrapedCategoryItems.length === 0) return;
    setBulkImportLoading(true);
    try {
      const items = scrapedCategoryItems.map((it) => ({
        code: it.code,
        name: it.name,
        brand: it.brand,
        category: it.category,
        price: it.price,
        cost: it.cost,
        stock: it.stock,
        image: it.image,
        description: it.description,
      }));

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_import",
          items,
          autoCreateCategory: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kataloğa kaydedilemedi.");
      showToast(`${data.inserted} yeni ürün kataloğa eklendi, ${data.updated} ürün güncellendi!`);
      setScrapedCategoryItems([]);
      setBulkImportOpen(false);
      void loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setBulkImportLoading(false);
    }
  };


async function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type.includes("svg")) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxWidth && height <= maxHeight && file.size < 150 * 1024) {
          return resolve(file);
        }
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
            } else {
              resolve(file);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

  const handleCategoryUpload = async (type: "icon" | "banner", file: File) => {
    if (!selectedCategory) return;
    setUploadingCatImg(type);
    try {
      const optimized = await compressImageFile(file, type === "icon" ? 512 : 1200, type === "icon" ? 512 : 600, 0.9);
      const formData = new FormData();
      formData.append("file", optimized);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel yüklenemedi.");
      const url = data.urls?.[0] || data.url;
      if (url) {
        const updatedCat = { ...selectedCategory, [type]: url };
        setSelectedCategory(updatedCat);

        // Dual-Sync to localStorage for permanent persistence across Vercel cold starts
        try {
          const currentMap = JSON.parse(localStorage.getItem("markasi_category_images") || "{}");
          currentMap[updatedCat.name] = url;
          if (updatedCat.slug) currentMap[updatedCat.slug] = url;
          localStorage.setItem("markasi_category_images", JSON.stringify(currentMap));
          window.dispatchEvent(new Event("markasi_categories_updated"));
        } catch {}

        // Auto-save immediately to database
        const saveRes = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upsert",
            ...updatedCat,
          }),
        });

        if (saveRes.ok) {
          showToast(`${type === "icon" ? "İkon" : "Görsel"} başarıyla yüklendi ve anında kaydedildi!`);
          void loadCategories();
        } else {
          showToast(`${type === "icon" ? "İkon" : "Görsel"} yüklendi ve tarayıcıya sabitlendi.`);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Yükleme hatası.", "error");
    } finally {
      setUploadingCatImg(null);
    }
  };

  // Image Upload Handler
  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const optimized = await compressImageFile(files[i], 1200, 1200, 0.85);
        formData.append("file", optimized);
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resim yüklenemedi.");
      const current = productForm.images ? productForm.images.split("\n").map(s => s.trim()).filter(Boolean) : [];
      const newUrls = data.urls || (data.url ? [data.url] : []);
      setProductForm({
        ...productForm,
        images: [...current, ...newUrls].join("\n"),
      });
      showToast(`${newUrls.length} resim başarıyla yüklendi!`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDuplicateProduct = async (prodId: string) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id: prodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kopyalanamadı.");
      showToast("Ürün başarıyla kopyalandı!");
      void loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format((val || 0) / 100);

  // Authentication check & initial load
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch("/api/admin");
      if (authRes.status === 401) {
        setAdmin(null);
        return;
      }
      const authData = await authRes.json();
      setAdmin(authData.admin);
      setStats(authData.stats || {});

      // Load Currencies
      const finRes = await fetch("/api/admin/finance");
      if (finRes.ok) {
        const finData = await finRes.json();
        const rateMap: Record<string, number> = {};
        for (const c of finData.currencies || []) {
          rateMap[c.currency] = c.rate;
        }
        setCurrencyRates(rateMap);
        setInstallments(finData.installments || []);
        setShippingRules(finData.shippingRules || []);
      }
    } catch {
      showToast("Yönetici paneli verileri yüklenirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadInitialData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadInitialData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Giriş başarısız.");
      }
      showToast("Giriş başarılı! Yönetim paneli açılıyor...");
      await loadInitialData();
    } catch (err: any) {
      setLoginError(err.message || "Giriş yapılamadı.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // ignore
    }
    setAdmin(null);
    showToast("Oturum kapatıldı.");
  };

  // Tab specific data loaders
  const loadCategories = useCallback(async () => {
    let localSaved: Record<string, string> = {};
    try {
      const stored = localStorage.getItem("markasi_category_images");
      if (stored) localSaved = JSON.parse(stored) || {};
    } catch {}

    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = await res.json();
      let cats: CategoryItem[] = data.categories || [];
      if (Object.keys(localSaved).length > 0) {
        cats = cats.map((cat) => {
          const customImg = localSaved[cat.name] || localSaved[cat.slug];
          if (customImg) {
            return {
              ...cat,
              icon: cat.icon || customImg,
              banner: cat.banner || customImg,
            };
          }
          return cat;
        });
      }
      setCategoriesTree(cats);
      if (!selectedCategory && cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
    }
  }, [selectedCategory]);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (productSearch) params.set("q", productSearch);
    if (productCategoryFilter) params.set("category", productCategoryFilter);
    if (productCriticalFilter) params.set("critical", "1");
    if (productCorridorFilter) params.set("corridor", productCorridorFilter);

    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
    }
  }, [productSearch, productCategoryFilter, productCriticalFilter, productCorridorFilter]);

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (orderStatusFilter) params.set("status", orderStatusFilter);
    if (orderVinFilter) params.set("vinStatus", orderVinFilter);
    if (orderSearchQuery) params.set("q", orderSearchQuery);

    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders || []);
    }
  }, [orderStatusFilter, orderVinFilter, orderSearchQuery]);

  const loadReturns = useCallback(async () => {
    const res = await fetch("/api/admin/returns");
    if (res.ok) {
      const data = await res.json();
      setReturns(data.returns || []);
      setRecourses(data.recourses || []);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    const res = await fetch("/api/admin/members");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
      setB2bGroups(data.b2bGroups || []);
    }
  }, []);

  const loadMarketing = useCallback(async () => {
    const res = await fetch("/api/admin/marketing");
    if (res.ok) {
      const data = await res.json();
      setPayLinks(data.payLinks || []);
      setAbandonedCarts(data.abandonedCarts || []);
      setCoupons(data.coupons || []);
    }
  }, []);

  const handleSaveCmsSettings = async () => {
    setSavingCmsSettings(true);
    try {
      // 1. Save to browser localStorage so settings NEVER get lost on Vercel cold starts
      try {
        localStorage.setItem("markasi_site_settings", JSON.stringify(siteSettings));
      } catch {}

      // 2. Persist to server API
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "settings", settings: siteSettings }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Ayarlar kaydedilemedi.", "error");
        return;
      }
      showToast("Kurumsal bilgiler, vergi dairesi ve kayan yazı ayarları başarıyla kaydedildi!");
    } catch {
      showToast("Bağlantı hatası oluştu.", "error");
    } finally {
      setSavingCmsSettings(false);
    }
  };

  const loadCms = useCallback(async () => {
    // 1. Immediately restore from localStorage if exists
    let localSaved: Record<string, string> | null = null;
    try {
      const stored = localStorage.getItem("markasi_site_settings");
      if (stored) {
        localSaved = JSON.parse(stored);
        if (localSaved && typeof localSaved === "object") {
          setSiteSettings((prev) => ({ ...prev, ...localSaved }));
        }
      }
    } catch {}

    // 2. Fetch fresh from server (bypassing any browser/edge cache)
    try {
      const res = await fetch(`/api/admin/cms?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const serverSettings = data.settings || {};
        // Merge server settings with local saved settings
        const mergedSettings = localSaved ? { ...serverSettings, ...localSaved } : serverSettings;
        setSiteSettings(mergedSettings);
        setSliders(data.sliders || []);
        setCmsPages(data.pages || []);
        if (!selectedCmsPage && data.pages?.length > 0) {
          setSelectedCmsPage(data.pages[0]);
        }
        // If local settings had custom edits (e.g. tax_office, phone, marquee) that server lacks, re-sync to server
        if (
          localSaved &&
          ((localSaved.tax_office && localSaved.tax_office !== serverSettings.tax_office) ||
           (localSaved.marquee_text && localSaved.marquee_text !== serverSettings.marquee_text))
        ) {
          fetch("/api/admin/cms", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section: "settings", settings: mergedSettings }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("loadCms fetch error:", e);
    }
  }, [selectedCmsPage]);

  const loadSecurity = useCallback(async () => {
    const res = await fetch("/api/admin/security");
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data.auditLogs || []);
      setAdminUsers(data.admins || []);
    }
  }, []);

  // Fetch when tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "categories") void loadCategories();
      if (activeTab === "products") void loadProducts();
      if (activeTab === "orders") void loadOrders();
      if (activeTab === "returns") void loadReturns();
      if (activeTab === "members") void loadMembers();
      if (activeTab === "marketing") void loadMarketing();
      if (activeTab === "cms") void loadCms();
      if (activeTab === "security") void loadSecurity();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, loadCategories, loadProducts, loadOrders, loadReturns, loadMembers, loadMarketing, loadCms, loadSecurity]);

  // Currency update action
  const handleCurrencyUpdate = async (currency: "USD" | "EUR", rate: number) => {
    setUpdatingCurrency(true);
    try {
      const res = await fetch("/api/admin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "currency", currency, rate }),
      });
      if (res.ok) {
        setCurrencyRates((prev) => ({ ...prev, [currency]: rate }));
        showToast(`${currency} kuru ${rate} TL olarak güncellendi ve ürün fiyatları senkronize edildi!`);
        if (activeTab === "products") void loadProducts();
      } else {
        showToast("Kur güncellenemedi.", "error");
      }
    } catch {
      showToast("Bağlantı hatası.", "error");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  // Scraper action
  const handleScrape = async (e: FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setSyncStatusReport("");
    try {
      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: scrapeUrl.trim(),
          markupPercent: scraperMarkupType === "percent" ? scraperMarkupValue : 0,
          markupAmount: scraperMarkupType === "amount" ? scraperMarkupValue * 100 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ürün çekilemedi.");
      setScrapedData(data);
      showToast("Ürün bilgileri, görseller ve teknik detaylar başarıyla çekildi!");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setScraping(false);
    }
  };

  // Save scraped product to database
  const handleSaveScrapedProduct = async () => {
    if (!scrapedData) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scrapedData.name,
          brand: scrapedData.brand || "Genel",
          code: scrapedData.sku || `PAR-${Date.now().toString(36).toUpperCase()}`,
          kind: "OEM",
          category: scraperSelectedCategory || selectedCategory?.name || "Filtreler",
          price: (scrapedData.calculatedPrice || scrapedData.price) / 100,
          cost: scrapedData.price / 100,
          centralStock: 10,
          shelf: "01",
          corridor: "A",
          bin: "01",
          sku: scrapedData.sku,
          oemCodes: scrapedData.oemCodes,
          images: scrapedData.images,
          sourceUrl: scrapedData.url,
          sourceLastPrice: scrapedData.price,
          description: scrapedData.description,
          specs: scrapedData.specs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ürün kaydedilemedi.");
      showToast("Çekilen ürün başarıyla kataloğa eklendi!");
      setScrapedData(null);
      setScrapeUrl("");
      if (activeTab === "products") void loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Inline table edit commit
  const commitInlineEdit = async (productId: string, field: string) => {
    const payload: any = { productId };
    if (field === "centralStock") payload.centralStock = parseInt(inlineEditValue) || 0;
    if (field === "price") payload.price = parseFloat(inlineEditValue) || 0;
    if (field === "cost") payload.cost = parseFloat(inlineEditValue) || 0;
    if (field === "shelf") payload.shelf = inlineEditValue.trim();
    if (field === "corridor") payload.corridor = inlineEditValue.trim();
    if (field === "bin") payload.bin = inlineEditValue.trim();

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                ...(field === "centralStock" ? { centralStock: payload.centralStock } : {}),
                ...(field === "price" ? { price: Math.round(payload.price * 100) } : {}),
                ...(field === "cost" ? { cost: Math.round(payload.cost * 100) } : {}),
                ...(field === "shelf" ? { shelf: payload.shelf } : {}),
                ...(field === "corridor" ? { corridor: payload.corridor } : {}),
                ...(field === "bin" ? { bin: payload.bin } : {}),
              };
            }
            return p;
          }),
        );
        showToast("Güncellendi.");
      }
    } catch {
      showToast("Hata oluştu.", "error");
    } finally {
      setInlineEditingCell(null);
    }
  };

  // Bulk price markup
  const handleBulkMarkup = async () => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentageChange: bulkPercent,
          applyTo: bulkApplyTo,
          category: productCategoryFilter || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${data.affectedCount} ürünün fiyatları %${bulkPercent} güncellendi!`);
        setBulkMarkupOpen(false);
        void loadProducts();
      }
    } catch {
      showToast("Toplu fiyat güncelleme başarısız.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1e2e] text-white">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle size={36} className="animate-spin text-[#f36b2b]" />
          <p className="text-sm font-bold tracking-wide text-slate-300">Enterprise Admin Suite Yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1826] p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md">
          {/* Brand & Suite header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[#102b42] border border-orange-500/20 shadow-xl mb-4">
              <BrandMark className="size-11" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              MARKASİ OTOMOTİV
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#f36b2b]">
              Enterprise Suite Yönetim Portalı
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#0f2336]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Lock size={18} className="text-[#f36b2b]" /> Yönetici Girişi
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Lütfen yetkili yönetici kimlik bilgilerinizi giriniz.
              </p>
            </div>

            {loginError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/50 p-3.5 text-xs font-semibold text-rose-300">
                <AlertTriangle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Yönetici E-posta Adresi
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@markasi.com.tr"
                    className="h-11 w-full rounded-xl border border-slate-700 bg-[#0a1826] pl-10 pr-3.5 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Yönetici Şifresi
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-11 w-full rounded-xl border border-slate-700 bg-[#0a1826] pl-10 pr-3.5 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginSubmitting}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f36b2b] text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#df5b20] disabled:opacity-60 shadow-lg shadow-orange-950/40"
              >
                {loginSubmitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                Panele Giriş Yap
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <Link href="/" className="hover:text-white transition flex items-center gap-1">
                ← Mağazaya Dön
              </Link>
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldCheck size={13} className="text-emerald-500" /> 256-bit Güvenli Oturum
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 antialiased flex flex-col lg:flex-row font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-2xl transition-all ${
            toastMessage.type === "success"
              ? "bg-[#102b42] text-white border border-emerald-500/30"
              : "bg-rose-900 text-white border border-rose-500/30"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR (SOLA DAYALI KURUMSAL MENÜ) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 lg:w-64 xl:w-72 bg-[#0a1826] text-slate-300 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}>
        {/* BRAND HEADER */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80 bg-[#081522]">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <BrandMark />
            <div>
              <span className="block text-sm font-black tracking-tight text-white leading-none">MARKASİ</span>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#f36b2b]">Enterprise Suite</span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
              v2.8
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 text-xs font-semibold">
          {/* GRUP 1: GENEL */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Genel</p>
            <button
              onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "overview"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <LayoutDashboard size={17} />
              <span>Genel Bakış</span>
            </button>
          </div>

          {/* GRUP 2: KATALOG & ÜRÜNLER */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Katalog & Ürünler</p>
            <button
              onClick={() => { setActiveTab("categories"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "categories"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <FolderTree size={17} />
              <span>Kategori & Araç Ağacı</span>
            </button>

            <button
              onClick={() => { setActiveTab("products"); setSidebarOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                activeTab === "products"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Warehouse size={17} />
                <span>Ürün & Depo (WMS)</span>
              </div>
              <span className="rounded-md bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                {products.length || stats.productCount || 0}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("products");
                setBulkImportOpen(true);
                setSidebarOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-800/70 text-slate-300 hover:text-white group"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={17} className="text-emerald-400 group-hover:scale-110 transition" />
                <span>Toplu Ürün Ekle</span>
              </div>
              <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                Excel / CSV
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("scraper"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "scraper"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <Sparkles size={17} />
              <span>Otomatik Ürün Çekici</span>
            </button>
          </div>

          {/* GRUP 3: SATIŞ & OPERASYON */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Satış & Operasyon</p>
            <button
              onClick={() => { setActiveTab("orders"); setSidebarOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                activeTab === "orders"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Truck size={17} />
                <span>Sipariş & Şasi (VIN)</span>
              </div>
              {stats.newOrderCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                  {stats.newOrderCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("returns"); setSidebarOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                activeTab === "returns"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <RotateCcw size={17} />
                <span>İade (RMA) & Rücu</span>
              </div>
              {stats.pendingRmaCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                  {stats.pendingRmaCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("members"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "members"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <Users size={17} />
              <span>Üye & B2B Bayi</span>
            </button>
          </div>

          {/* GRUP 4: PAZARLAMA & FİNANS */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Pazarlama & Finans</p>
            <button
              onClick={() => { setActiveTab("marketing"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "marketing"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <Tag size={17} />
              <span>Pazarlama & PayLink</span>
            </button>

            <button
              onClick={() => { setActiveTab("finance"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "finance"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <DollarSign size={17} />
              <span>Finans, Kur & POS</span>
            </button>
          </div>

          {/* GRUP 5: SİSTEM & YÖNETİM */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Sistem</p>
            <button
              onClick={() => { setActiveTab("cms"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "cms"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <Globe size={17} />
              <span>Web Tasarım & CMS</span>
            </button>

            <button
              onClick={() => { setActiveTab("security"); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                activeTab === "security"
                  ? "bg-[#f36b2b] text-white shadow-md shadow-orange-950/30 font-bold"
                  : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
              }`}
            >
              <Shield size={17} />
              <span>Güvenlik & Log</span>
            </button>
          </div>
        </div>

        {/* SIDEBAR FOOTER (USER & ACTIONS) */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#081522] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-[#f36b2b] text-white grid place-items-center text-xs font-black shrink-0">
                {admin?.name?.charAt(0) || "A"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold leading-tight text-white truncate">{admin?.name || "Yönetici"}</p>
                <p className="text-[10px] text-slate-400 truncate">{admin?.email || "Super Admin"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Oturumu Kapat"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <ExternalLink size={12} />
              <span>Mağaza</span>
            </Link>
            <button
              onClick={() => {
                window.location.href = "/api/admin/security?action=backup";
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20 px-2 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-900/60 transition"
            >
              <HardDriveDownload size={12} />
              <span>Yedek Al</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5 sm:px-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 capitalize flex items-center gap-2">
                {activeTab === "overview" && "Genel Bakış & Hızlı İstatistikler"}
                {activeTab === "categories" && "Kategori & Araç Ağacı Masası"}
                {activeTab === "products" && "Ürün & Depo (WMS) Raf Sistemi"}
                {activeTab === "scraper" && "Evrensel Link ile Ürün Çekici"}
                {activeTab === "orders" && "Sipariş & Şasi (VIN) Doğrulama Masası"}
                {activeTab === "returns" && "İade (RMA) & Tedarikçi Rücu"}
                {activeTab === "members" && "Üyeler, B2B Bayi/Usta & Cari"}
                {activeTab === "marketing" && "Pazarlama, Kuponlar & PayLink"}
                {activeTab === "finance" && "Döviz Kuru Kalkanı & POS Taksit"}
                {activeTab === "cms" && "Web Tasarım & CMS Yönetimi"}
                {activeTab === "security" && "Yönetici Güvenliği & Audit Logs"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* DÖVİZ KURU KALKANI (LIVE CURRENCY SHIELD) */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white border border-slate-800">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="font-bold text-slate-300 text-[11px]">Döviz:</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-bold">USD:</span>
                <input
                  type="number"
                  step="0.1"
                  value={currencyRates.USD || 36.5}
                  onChange={(e) => setCurrencyRates((prev) => ({ ...prev, USD: parseFloat(e.target.value) || 0 }))}
                  onBlur={(e) => handleCurrencyUpdate("USD", parseFloat(e.target.value) || 0)}
                  className="w-14 rounded bg-slate-800 px-1 py-0.5 text-center text-xs font-bold text-white outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-bold">EUR:</span>
                <input
                  type="number"
                  step="0.1"
                  value={currencyRates.EUR || 38.2}
                  onChange={(e) => setCurrencyRates((prev) => ({ ...prev, EUR: parseFloat(e.target.value) || 0 }))}
                  onBlur={(e) => handleCurrencyUpdate("EUR", parseFloat(e.target.value) || 0)}
                  className="w-14 rounded bg-slate-800 px-1 py-0.5 text-center text-xs font-bold text-white outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
              {updatingCurrency && <LoaderCircle size={12} className="animate-spin text-orange-400" />}
            </div>

            {/* Quick Add Product button */}
            <button
              onClick={() => handleOpenProductModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#f36b2b] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#df5b20]"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Yeni Ürün Ekle</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY DASHBOARD */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto">
        {/* ============================================================== */}
        {/* 1. OVERVIEW & METRICS TAB */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Bugünkü Ciro</span>
                  <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{formatPrice(stats.todayRevenue || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span>Net Kâr: {formatPrice(stats.todayProfit || 0)}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Yeni Siparişler</span>
                  <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingCart size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{stats.newOrderCount || 0}</p>
                <p className="mt-1 text-xs text-slate-500">Toplam {stats.orderCount || 0} sipariş kaydı</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Şasi Onayı Bekleyen</span>
                  <div className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
                    <Car size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{stats.pendingVinCount || 0}</p>
                <button
                  onClick={() => {
                    setOrderVinFilter("Bekliyor");
                    setActiveTab("orders");
                  }}
                  className="mt-1 text-xs font-bold text-orange-600 hover:underline"
                >
                  Şasi Masasını Aç →
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Kritik Stok Uyarısı</span>
                  <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-rose-600">{stats.lowStockCount || 0}</p>
                <button
                  onClick={() => {
                    setProductCriticalFilter(true);
                    setActiveTab("products");
                  }}
                  className="mt-1 text-xs font-bold text-rose-600 hover:underline"
                >
                  Kritik Parçaları İncele →
                </button>
              </div>
            </div>

            {/* Quick Actions & Live Modules Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-[#f36b2b]" />
                  Hızlı İşlemler Masası
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <button
                    onClick={() => setActiveTab("scraper")}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-orange-50 hover:border-orange-200"
                  >
                    <Link2 size={24} className="text-[#f36b2b]" />
                    <span className="text-xs font-bold text-slate-800">Linkle Ürün Çek</span>
                    <span className="text-[10px] text-slate-500">Tedarikçiden kopyala</span>
                  </button>

                  <button
                    onClick={() => {
                      setPayLinkModal(true);
                      setActiveTab("marketing");
                    }}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-blue-50 hover:border-blue-200"
                  >
                    <CreditCard size={24} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">PayLink Üret</span>
                    <span className="text-[10px] text-slate-500">Özel parça talebi linki</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("categories")}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-purple-50 hover:border-purple-200"
                  >
                    <FolderTree size={24} className="text-purple-600" />
                    <span className="text-xs font-bold text-slate-800">Araç & Kategori Ağacı</span>
                    <span className="text-[10px] text-slate-500">Split-view düzenleyici</span>
                  </button>

                  <button
                    onClick={() => {
                      setBulkMarkupOpen(true);
                      setActiveTab("products");
                    }}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-emerald-50 hover:border-emerald-200"
                  >
                    <Percent size={24} className="text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Toplu Fiyat Güncelle</span>
                    <span className="text-[10px] text-slate-500">% Zam / İndirim motoru</span>
                  </button>

                  <button
                    onClick={() => {
                      window.open("/api/feed/merchant", "_blank");
                    }}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-amber-50 hover:border-amber-200"
                  >
                    <FileSpreadsheet size={24} className="text-amber-600" />
                    <span className="text-xs font-bold text-slate-800">Merchant XML Feed</span>
                    <span className="text-[10px] text-slate-500">Akakçe, Cimri, Google</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("cms")}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-sky-50 hover:border-sky-200"
                  >
                    <Globe size={24} className="text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">Web Tasarım & CMS</span>
                    <span className="text-[10px] text-slate-500">Slider, Logo, Duyuru</span>
                  </button>
                </div>
              </div>

              {/* Feed & API Status */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Radio size={16} className="text-emerald-500" />
                  Entegrasyon & Canlı Feedler
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold text-slate-700">Google Merchant Feed:</span>
                    <a
                      href="/api/feed/merchant"
                      target="_blank"
                      className="font-bold text-[#f36b2b] hover:underline flex items-center gap-1"
                    >
                      /api/feed/merchant <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold text-slate-700">Sitemap.xml:</span>
                    <a
                      href="/api/sitemap"
                      target="_blank"
                      className="font-bold text-[#f36b2b] hover:underline flex items-center gap-1"
                    >
                      /api/sitemap <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold text-slate-700">Aktif Üye Sayısı:</span>
                    <span className="font-extrabold text-slate-900">{stats.memberCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold text-slate-700">Bekleyen İadeler:</span>
                    <span className="font-extrabold text-rose-600">{stats.pendingRmaCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. SPLIT-VIEW KATEGORİ & ARAÇ AĞACI YÖNETİMİ */}
        {/* ============================================================== */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsVehicleTreeMode(false)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    !isVehicleTreeMode ? "bg-[#102b42] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Parça Kategorileri (Fren, Motor vb.)
                </button>
                <button
                  onClick={() => setIsVehicleTreeMode(true)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    isVehicleTreeMode ? "bg-[#102b42] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Araç Ağacı (Marka → Model → Kasa → Motor)
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedCategory({
                    id: "",
                    name: "",
                    slug: "",
                    parentId: null,
                    sortOrder: 0,
                    icon: "",
                    banner: "",
                    seoTitle: "",
                    seoDescription: "",
                    defaultMargin: 20.0,
                    isVehicleTree: isVehicleTreeMode,
                    active: true,
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#f36b2b] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#df5b20]"
              >
                <Plus size={15} />
                Yeni Kök Kategori Ekle
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              {/* SOL PANEL (%35): Ağaç Yapısı */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-5 xl:col-span-4 space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ağaçta anlık ara…"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
                  {categoriesTree
                    .filter((c) => (isVehicleTreeMode ? c.isVehicleTree : !c.isVehicleTree))
                    .filter((c) => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div
                          onClick={() => setSelectedCategory(item)}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer transition ${
                            selectedCategory?.id === item.id
                              ? "bg-orange-50 text-[#f36b2b] border border-orange-200"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FolderTree size={16} className="text-slate-400 group-hover:text-orange-500" />
                            <span>{item.name}</span>
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {item.productCount || 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategory({
                                  id: "",
                                  name: "",
                                  slug: "",
                                  parentId: item.id,
                                  sortOrder: 0,
                                  icon: "",
                                  banner: "",
                                  seoTitle: "",
                                  seoDescription: "",
                                  defaultMargin: item.defaultMargin || 20.0,
                                  isVehicleTree: item.isVehicleTree,
                                  active: true,
                                });
                              }}
                              title="Alt Kırılım Ekle"
                              className="rounded-md p-1 hover:bg-slate-200 text-slate-600"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Render Children */}
                        {item.children && item.children.length > 0 && (
                          <div className="ml-5 border-l-2 border-slate-100 pl-2 space-y-1">
                            {item.children.map((child) => (
                              <div
                                key={child.id}
                                onClick={() => setSelectedCategory(child)}
                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition ${
                                  selectedCategory?.id === child.id
                                    ? "bg-orange-50 text-[#f36b2b]"
                                    : "hover:bg-slate-50 text-slate-600"
                                }`}
                              >
                                <span>↳ {child.name}</span>
                                <span className="text-[10px] text-slate-400">%{child.defaultMargin}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* SAĞ PANEL (%65): Düzenleme Formu */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-7 xl:col-span-8">
                {selectedCategory ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSavingCategory(true);
                      try {
                        const res = await fetch("/api/admin/categories", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "upsert",
                            ...selectedCategory,
                          }),
                        });
                        if (res.ok) {
                          try {
                            const currentMap = JSON.parse(localStorage.getItem("markasi_category_images") || "{}");
                            const chosen = selectedCategory.icon || selectedCategory.banner;
                            if (chosen) {
                              currentMap[selectedCategory.name] = chosen;
                              if (selectedCategory.slug) currentMap[selectedCategory.slug] = chosen;
                            }
                            localStorage.setItem("markasi_category_images", JSON.stringify(currentMap));
                            window.dispatchEvent(new Event("markasi_categories_updated"));
                          } catch {}
                          showToast("Kategori başarıyla kaydedildi!");
                          void loadCategories();
                        } else {
                          showToast("Kategori kaydedilemedi.", "error");
                        }
                      } catch {
                        showToast("Bağlantı hatası.", "error");
                      } finally {
                        setSavingCategory(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {selectedCategory.id ? `Düzenle: ${selectedCategory.name}` : "Yeni Kategori Ekle"}
                      </h4>
                      {selectedCategory.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`${selectedCategory.name} kategorisini silmek istediğinize emin misiniz?`)) return;
                            const res = await fetch(`/api/admin/categories?id=${selectedCategory.id}`, { method: "DELETE" });
                            if (res.ok) {
                              showToast("Kategori silindi.");
                              setSelectedCategory(null);
                              void loadCategories();
                            }
                          }}
                          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Kategoriyi Sil
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600">Kategori / Araç Adı *</label>
                        <input
                          type="text"
                          required
                          value={selectedCategory.name}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600">Üst Kategori</label>
                        <select
                          value={selectedCategory.parentId || ""}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, parentId: e.target.value || null })}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400"
                        >
                          <option value="">-- Kök Kategori (Üstü Yok) --</option>
                          {categoriesTree
                            .filter((c) => c.id !== selectedCategory.id)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600">Varsayılan Kâr Marjı (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={selectedCategory.defaultMargin}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, defaultMargin: parseFloat(e.target.value) || 0 })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600">Sıra Numarası</label>
                        <input
                          type="number"
                          value={selectedCategory.sortOrder}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, sortOrder: parseInt(e.target.value) || 0 })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                        />
                      </div>

                      {/* Category Banner / Cover Image */}
                      <div className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                            Kategori Görseli / Banner (Kapak Resmi)
                          </label>
                          {selectedCategory.banner && (
                            <button
                              type="button"
                              onClick={async () => {
                              const updated = { ...selectedCategory, banner: "" };
                              setSelectedCategory(updated);
                              try {
                                const currentMap = JSON.parse(localStorage.getItem("markasi_category_images") || "{}");
                                delete currentMap[selectedCategory.name];
                                if (selectedCategory.slug) delete currentMap[selectedCategory.slug];
                                localStorage.setItem("markasi_category_images", JSON.stringify(currentMap));
                                window.dispatchEvent(new Event("markasi_categories_updated"));
                              } catch {}
                              await fetch("/api/admin/categories", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "upsert", ...updated }),
                              });
                              showToast("Banner görseli kaldırıldı.");
                            }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1 hover:underline"
                            >
                              <Trash2 size={12} /> Görseli Kaldır
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Örn: /categories/balata-fren.svg veya https://..."
                            value={selectedCategory.banner}
                            onChange={(e) => setSelectedCategory({ ...selectedCategory, banner: e.target.value })}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400"
                          />
                          <label className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm">
                            <Upload size={13} className={uploadingCatImg === "banner" ? "animate-bounce text-orange-500" : "text-slate-500"} />
                            <span>{uploadingCatImg === "banner" ? "Yükleniyor..." : "Dosyadan Yükle"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingCatImg !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleCategoryUpload("banner", file);
                              }}
                            />
                          </label>
                        </div>

                        {selectedCategory.banner && (
                          <div className="flex items-center gap-3 pt-1">
                            <div className="relative h-14 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                              <img
                                src={selectedCategory.banner}
                                alt="Önizleme"
                                className="size-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">Banner önizleme aktif</span>
                          </div>
                        )}
                      </div>

                      {/* Category Icon */}
                      <div className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                            Kategori İkonu (SVG / PNG)
                          </label>
                          {selectedCategory.icon && (
                            <button
                              type="button"
                              onClick={async () => {
                              const updated = { ...selectedCategory, icon: "" };
                              setSelectedCategory(updated);
                              try {
                                const currentMap = JSON.parse(localStorage.getItem("markasi_category_images") || "{}");
                                delete currentMap[selectedCategory.name];
                                if (selectedCategory.slug) delete currentMap[selectedCategory.slug];
                                localStorage.setItem("markasi_category_images", JSON.stringify(currentMap));
                                window.dispatchEvent(new Event("markasi_categories_updated"));
                              } catch {}
                              await fetch("/api/admin/categories", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "upsert", ...updated }),
                              });
                              showToast("İkon kaldırıldı.");
                            }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1 hover:underline"
                            >
                              <Trash2 size={12} /> İkonu Kaldır
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Örn: /categories/fren-sistemi.svg veya https://..."
                            value={selectedCategory.icon}
                            onChange={(e) => setSelectedCategory({ ...selectedCategory, icon: e.target.value })}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400"
                          />
                          <label className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm">
                            <Upload size={13} className={uploadingCatImg === "icon" ? "animate-bounce text-orange-500" : "text-slate-500"} />
                            <span>{uploadingCatImg === "icon" ? "Yükleniyor..." : "Dosyadan Yükle"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingCatImg !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleCategoryUpload("icon", file);
                              }}
                            />
                          </label>
                        </div>

                        {selectedCategory.icon && (
                          <div className="flex items-center gap-3 pt-1">
                            <div className="relative size-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
                              <img
                                src={selectedCategory.icon}
                                alt="İkon Önizleme"
                                className="size-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">İkon önizleme aktif</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Reset Button if any image is set */}
                      {(selectedCategory.banner || selectedCategory.icon) && (
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory({ ...selectedCategory, banner: "", icon: "" })}
                            className="w-full py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition flex items-center justify-center gap-2"
                          >
                            <Trash2 size={13} /> Tüm Görselleri Temizle (Varsayılan Sistem İkonunu Kullan)
                          </button>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600">SEO Başlığı (Title)</label>
                        <input
                          type="text"
                          value={selectedCategory.seoTitle}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, seoTitle: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600">Meta Açıklaması (Description)</label>
                        <textarea
                          rows={2}
                          value={selectedCategory.seoDescription}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, seoDescription: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedCategory.active}
                          onChange={(e) => setSelectedCategory({ ...selectedCategory, active: e.target.checked })}
                          className="size-4 rounded accent-[#f36b2b]"
                        />
                        Kategori Aktif ve Sitede Görünür
                      </label>

                      <button
                        type="submit"
                        disabled={savingCategory}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-[#df5b20] disabled:opacity-50"
                      >
                        {savingCategory ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                        Kaydet
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
                    <FolderTree size={40} className="mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Düzenlemek için sol taraftan bir kategori seçin</p>
                    <p className="text-[10px] text-slate-400">veya yukarıdaki butondan yeni kök kategori oluşturun</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. EVRENSEL LİNK İLE OTOMATİK ÜRÜN ÇEKİCİ (UNIVERSAL SCRAPER) */}
        {/* ============================================================== */}
        {activeTab === "scraper" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="grid size-10 place-items-center rounded-2xl bg-orange-50 text-[#f36b2b]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Evrensel Link ile Otomatik Ürün Çekme Motoru</h3>
                  <p className="text-xs text-slate-500">
                    Herhangi bir e-ticaret veya yedek parça sitesinin linkini yapıştırarak fiyat, görseller, OEM kodları ve özellikleri saniyeler içinde çekin.
                  </p>
                </div>
              </div>

              <form onSubmit={handleScrape} className="mt-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="url"
                    required
                    placeholder="Örnek: https://www.yedekparca.com.tr/urun/volkswagen-golf-7-yag-filtresi-04e115561h"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs outline-none focus:border-orange-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={scraping}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f36b2b] px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-[#df5b20] disabled:opacity-50"
                  >
                    {scraping ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />}
                    Ürün Bilgilerini Çek
                  </button>
                </div>

                {/* Fiyat Hesaplayıcı Ayarları */}
                <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                  <span className="font-extrabold text-slate-700">Fiyat Hesaplama Motoru:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-600">
                      <input
                        type="radio"
                        checked={scraperMarkupType === "percent"}
                        onChange={() => setScraperMarkupType("percent")}
                        className="accent-[#f36b2b]"
                      />
                      % Kâr Ekle
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-600">
                      <input
                        type="radio"
                        checked={scraperMarkupType === "amount"}
                        onChange={() => setScraperMarkupType("amount")}
                        className="accent-[#f36b2b]"
                      />
                      + TL Sabit Ekle
                    </label>
                  </div>
                  <input
                    type="number"
                    value={scraperMarkupValue}
                    onChange={(e) => setScraperMarkupValue(parseFloat(e.target.value) || 0)}
                    className="w-20 rounded-xl border border-slate-200 bg-white px-2 py-1 text-center font-black outline-none"
                  />
                  <span className="text-slate-400">{scraperMarkupType === "percent" ? "% kâr marjı" : "TL net kâr"}</span>
                </div>
              </form>

              {/* Scraped Result Preview */}
              {scrapedData && (
                <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50/20 p-6 space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase text-[#f36b2b]">
                        {scrapedData.brand || "Orijinal"}
                      </span>
                      <h4 className="mt-2 text-lg font-black text-slate-900">{scrapedData.name}</h4>
                      <p className="mt-1 text-xs text-slate-500">SKU / Parça Kodu: <strong className="text-slate-800">{scrapedData.sku || "Otomatik"}</strong></p>
                    </div>

                    <div className="rounded-2xl border border-orange-200 bg-white p-4 text-right shadow-sm">
                      <p className="text-[11px] font-bold text-slate-400">Kaynak Alış Fiyatı: {formatPrice(scrapedData.price)}</p>
                      <p className="text-xl font-black text-emerald-600">
                        Satış Fiyatı: {formatPrice(scrapedData.calculatedPrice)}
                      </p>
                    </div>
                  </div>

                  {/* OEM Numaraları */}
                  {scrapedData.oemCodes && scrapedData.oemCodes.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-600 block mb-1.5">Algılanan OEM ve Çapraz Kodlar:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {scrapedData.oemCodes.map((code: string) => (
                          <span key={code} className="rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-black text-sky-800">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resim Galerisi (Reorder / Delete) */}
                  {scrapedData.images && scrapedData.images.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-600 block mb-2">Çekilen Yüksek Çözünürlüklü Resimler (Silmek için üzerine tıklayın):</span>
                      <div className="flex flex-wrap gap-3">
                        {scrapedData.images.map((img: string, idx: number) => (
                          <div key={idx} className="group relative size-24 rounded-2xl border border-slate-200 bg-white p-1 overflow-hidden shadow-sm">
                            <img src={img} alt="Product" className="size-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                setScrapedData({
                                  ...scrapedData,
                                  images: scrapedData.images.filter((_: any, i: number) => i !== idx),
                                });
                              }}
                              className="absolute inset-0 bg-rose-900/80 text-white font-bold text-xs opacity-0 group-hover:opacity-100 grid place-items-center transition"
                            >
                              Sil
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teknik Tablo */}
                  {scrapedData.specs && Object.keys(scrapedData.specs).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <span className="text-xs font-bold text-slate-700 block mb-2">Çekilen Teknik Özellikler:</span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                        {Object.entries(scrapedData.specs).map(([key, val]: any) => (
                          <div key={key} className="flex justify-between border-b border-slate-100 py-1">
                            <span className="font-semibold text-slate-500">{key}:</span>
                            <span className="font-bold text-slate-800">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-orange-200">
                    <button
                      type="button"
                      onClick={async () => {
                        setSyncStatusReport("Kaynak site taranıyor…");
                        try {
                          const res = await fetch("/api/admin/scraper", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "check-sync", sourceUrl: scrapedData.url }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setSyncStatusReport(
                              `Karşı sitede son fiyat: ${(data.currentPrice / 100).toFixed(2)} TL | Stok: ${data.inStock ? "Mevcut" : "Tükendi"}`
                            );
                          }
                        } catch {
                          setSyncStatusReport("Fiyat kontrolü başarısız.");
                        }
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} /> Kaynak Sitede Fiyat/Stok Kontrolü Yap
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveScrapedProduct}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <Save size={16} />
                      Otomatik Kataloğa Kaydet (WebP + Kâr Dahil)
                    </button>
                  </div>

                  {syncStatusReport && (
                    <p className="text-xs font-bold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">{syncStatusReport}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. GÜÇLÜ ÜRÜN YÖNETİMİ & WMS DEPO RAF SİSTEMİ */}
        {/* ============================================================== */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Parça kodu, OEM veya ad ara…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-orange-400 focus:bg-white w-56"
                  />
                </div>

                <button
                  onClick={() => setProductCriticalFilter(!productCriticalFilter)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    productCriticalFilter ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  <AlertTriangle size={13} />
                  Kritik Stoklar (≤ 5)
                </button>

                <button
                  onClick={() => setBulkMarkupOpen(!bulkMarkupOpen)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-1.5 text-xs font-bold transition"
                >
                  <Percent size={13} />
                  Toplu Fiyat / Zam
                </button>

                <button
                  onClick={() => setBundleWizardOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 text-xs font-bold transition"
                >
                  <PackagePlus size={13} />
                  Bakım Seti (Bundle) Sihirbazı
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenProductModal()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f36b2b] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#df5b20] transition"
                >
                  <Plus size={14} /> Yeni Parça Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setBulkImportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  <Sparkles size={14} /> Toplu Ürün Çek / Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickOemResults([]);
                    setQuickOemText("");
                    setQuickOemModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  <Wrench size={14} /> Usta Hızlı OEM Sorgu
                </button>
                <a
                  href="/api/admin/products?export=csv"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Download size={13} /> Excel/CSV İndir
                </a>
              </div>
            </div>

            {/* Toplu Fiyat Güncelleme Kutusu */}
            {bulkMarkupOpen && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900">Toplu Fiyat Değişim Motoru</h4>
                  <button onClick={() => setBulkMarkupOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold text-slate-600">Uygulanacak Alan:</span>
                  <select
                    value={bulkApplyTo}
                    onChange={(e: any) => setBulkApplyTo(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 font-bold"
                  >
                    <option value="price">Satış Fiyatı</option>
                    <option value="cost">Alış Maliyeti</option>
                    <option value="both">Her İkisi</option>
                  </select>

                  <span className="font-bold text-slate-600">Yüzde Değişim (%):</span>
                  <input
                    type="number"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(parseFloat(e.target.value) || 0)}
                    placeholder="+10 veya -5"
                    className="w-20 rounded-xl border border-slate-200 bg-white px-2 py-1 text-center font-bold"
                  />

                  <button
                    onClick={handleBulkMarkup}
                    className="rounded-xl bg-[#f36b2b] px-4 py-1.5 text-xs font-black text-white hover:bg-[#df5b20]"
                  >
                    Uygula
                  </button>
                </div>
              </div>
            )}

            {/* Ürün Listesi Tablosu (Satır içi Inline Edit & WMS Depo Raf Adresleri) */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Ürün & OEM</th>
                      <th className="px-4 py-3">Kategori & Marka</th>
                      <th className="px-4 py-3">WMS Depo Adresi</th>
                      <th className="px-4 py-3 text-right">Alış (Maliyet)</th>
                      <th className="px-4 py-3 text-right">Satış Fiyatı</th>
                      <th className="px-4 py-3 text-center">Merkez Stok</th>
                      <th className="px-4 py-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 max-w-[280px]">
                          <button
                            type="button"
                            onClick={() => handleOpenProductModal(p)}
                            className="text-left font-bold text-slate-900 truncate hover:text-[#f36b2b] transition block w-full"
                            title="Sağ Panelde Düzenlemek İçin Tıklayın"
                          >
                            {p.name}
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                              {p.code}
                            </span>
                            {p.position && p.position !== "Yönsüz / Evrensel" && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded">
                                {p.position}
                              </span>
                            )}
                            {p.hasCoreDeposit && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                                Depozitolu
                              </span>
                            )}
                            {p.compatibleVehicles && p.compatibleVehicles.length > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded" title={p.fitment}>
                                🚗 {p.compatibleVehicles.length} Araç
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{p.brand}</p>
                          <p className="text-[10px] text-slate-500">{p.category}</p>
                        </td>

                        {/* WMS RAF (Koridor-Raf-Göz) */}
                        <td className="px-4 py-3">
                          {inlineEditingCell?.id === p.id && inlineEditingCell.field === "shelf" ? (
                            <input
                              autoFocus
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => commitInlineEdit(p.id, "shelf")}
                              onKeyDown={(e) => e.key === "Enter" && commitInlineEdit(p.id, "shelf")}
                              className="w-20 rounded border border-orange-400 px-1.5 py-0.5 text-xs font-mono font-bold"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setInlineEditingCell({ id: p.id, field: "shelf" });
                                setInlineEditValue(p.shelf || "A-01-01");
                              }}
                              className="font-mono font-bold text-slate-700 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 px-2 py-1 rounded border border-slate-200"
                              title="Tıkla ve Raf Kodunu Değiştir"
                            >
                              {p.corridor ? `${p.corridor}-${p.shelf}-${p.bin || "01"}` : p.shelf || "Raf Tanımsız"}
                            </button>
                          )}
                        </td>

                        {/* Alış Maliyeti */}
                        <td className="px-4 py-3 text-right">
                          {inlineEditingCell?.id === p.id && inlineEditingCell.field === "cost" ? (
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => commitInlineEdit(p.id, "cost")}
                              onKeyDown={(e) => e.key === "Enter" && commitInlineEdit(p.id, "cost")}
                              className="w-20 rounded border border-orange-400 px-1 text-right text-xs"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setInlineEditingCell({ id: p.id, field: "cost" });
                                setInlineEditValue((p.cost / 100).toFixed(2));
                              }}
                              className="font-bold text-slate-500 hover:text-orange-600"
                            >
                              {formatPrice(p.cost)}
                            </button>
                          )}
                        </td>

                        {/* Satış Fiyatı */}
                        <td className="px-4 py-3 text-right">
                          {inlineEditingCell?.id === p.id && inlineEditingCell.field === "price" ? (
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => commitInlineEdit(p.id, "price")}
                              onKeyDown={(e) => e.key === "Enter" && commitInlineEdit(p.id, "price")}
                              className="w-20 rounded border border-orange-400 px-1 text-right text-xs"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setInlineEditingCell({ id: p.id, field: "price" });
                                setInlineEditValue((p.price / 100).toFixed(2));
                              }}
                              className="font-black text-slate-900 hover:text-orange-600 text-sm"
                            >
                              {formatPrice(p.price)}
                            </button>
                          )}
                        </td>

                        {/* Stok Adedi */}
                        <td className="px-4 py-3 text-center">
                          {inlineEditingCell?.id === p.id && inlineEditingCell.field === "centralStock" ? (
                            <input
                              autoFocus
                              type="number"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => commitInlineEdit(p.id, "centralStock")}
                              onKeyDown={(e) => e.key === "Enter" && commitInlineEdit(p.id, "centralStock")}
                              className="w-14 rounded border border-orange-400 px-1 text-center text-xs"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setInlineEditingCell({ id: p.id, field: "centralStock" });
                                setInlineEditValue(String(p.centralStock));
                              }}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition ${
                                p.centralStock <= 5 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {p.centralStock} adet
                            </button>
                          )}
                        </td>

                        {/* İşlemler: Düzenle, Kopyala, Sil */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenProductModal(p)}
                              className="size-7 rounded-lg border border-slate-200 bg-white grid place-items-center text-slate-600 hover:text-white hover:bg-[#f36b2b] hover:border-orange-500 transition shadow-sm"
                              title="Sağ Çekmece Panelinde Düzenle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(p.id)}
                              className="size-7 rounded-lg border border-slate-200 bg-white grid place-items-center text-slate-600 hover:text-white hover:bg-sky-600 hover:border-sky-600 transition shadow-sm"
                              title="Ürünü Çoğalt"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`${p.name} parçasını silmek istediğinize emin misiniz?`)) return;
                                const res = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
                                if (res.ok) {
                                  showToast("Ürün silindi.");
                                  void loadProducts();
                                }
                              }}
                              className="size-7 rounded-lg border border-slate-200 bg-white grid place-items-center text-slate-400 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition shadow-sm"
                              title="Ürünü Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. SİPARİŞ & ŞASİ (VIN) DOĞRULAMA MASASI & YAZDIRMA */}
        {/* ============================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm text-xs">
              {[
                { label: "Tüm Siparişler", val: "" },
                { label: "Yeni", val: "Yeni" },
                { label: "Şasi Onayı Bekleyen", val: "vin_bekliyor" },
                { label: "Hazırlanıyor", val: "Hazırlanıyor" },
                { label: "Kargoya Verildi", val: "Kargoya verildi" },
                { label: "Tamamlandı", val: "Tamamlandı" },
                { label: "İptal/İade", val: "İptal edildi" },
              ].map((st) => (
                <button
                  key={st.label}
                  onClick={() => {
                    if (st.val === "vin_bekliyor") {
                      setOrderStatusFilter("");
                      setOrderVinFilter("Bekliyor");
                    } else {
                      setOrderStatusFilter(st.val);
                      setOrderVinFilter("");
                    }
                  }}
                  className={`rounded-xl px-3 py-1.5 font-bold transition ${
                    (st.val === "vin_bekliyor" && orderVinFilter === "Bekliyor") ||
                    (orderStatusFilter === st.val && !orderVinFilter)
                      ? "bg-[#102b42] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Sipariş No & Tarih</th>
                      <th className="px-4 py-3">Müşteri</th>
                      <th className="px-4 py-3">Şasi (VIN) Durumu</th>
                      <th className="px-4 py-3">Kargo Takip</th>
                      <th className="px-4 py-3 text-right">Tutar & Net Kâr</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <p className="font-mono font-bold text-slate-900">{o.id}</p>
                          <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{o.customerName}</p>
                          <p className="text-[10px] text-slate-500">{o.phone}</p>
                        </td>

                        {/* Şasi (VIN) Durumu */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setVinInspectionModal(o)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold border transition ${
                              o.vinStatus === "Uyumlu"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : o.vinStatus === "Uyumsuz"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            }`}
                          >
                            <Car size={13} />
                            {o.vinNumber ? o.vinNumber.slice(0, 10) + "…" : "Ruhsat / Şasi"}
                            <span className="font-black">({o.vinStatus || "Bekliyor"})</span>
                          </button>
                        </td>

                        {/* Kargo */}
                        <td className="px-4 py-3 text-slate-600">
                          {o.courierCompany ? (
                            <div>
                              <p className="font-bold text-slate-800">{o.courierCompany}</p>
                              <p className="font-mono text-[10px] text-slate-500">{o.trackingCode || "Takip No Yok"}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Atanmadı</span>
                          )}
                        </td>

                        {/* Tutar & Net Kâr Kutusu */}
                        <td className="px-4 py-3 text-right">
                          <p className="font-black text-slate-900">{formatPrice(o.total)}</p>
                          <p className="text-[10px] font-extrabold text-emerald-600">
                            Net Kâr: {formatPrice(o.netProfit || 0)}
                          </p>
                        </td>

                        {/* Durum */}
                        <td className="px-4 py-3">
                          <select
                            value={o.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const res = await fetch("/api/admin/orders", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: o.id, status: newStatus }),
                                });
                                if (res.ok) {
                                  setOrders((prev) =>
                                    prev.map((ord) => (ord.id === o.id ? { ...ord, status: newStatus as any } : ord))
                                  );
                                  showToast(`Sipariş durumu "${newStatus}" olarak güncellendi.`);
                                } else {
                                  showToast("Sipariş durumu güncellenemedi.", "error");
                                }
                              } catch {
                                showToast("Bağlantı hatası.", "error");
                              }
                            }}
                            className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-bold outline-none border transition ${
                              o.status === "Tamamlandı"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : o.status === "Kargoya verildi"
                                ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                : o.status === "Hazırlanıyor"
                                ? "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100"
                                : o.status === "İptal edildi"
                                ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                                : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                            }`}
                          >
                            <option value="Yeni">Yeni</option>
                            <option value="Hazırlanıyor">Hazırlanıyor</option>
                            <option value="Kargoya verildi">Kargoya verildi</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                            <option value="İptal edildi">İptal edildi</option>
                          </select>
                        </td>

                        {/* İşlemler */}
                        <td className="px-4 py-3 text-center space-x-1">
                          <button
                            onClick={() => setPrintingSlip({ order: o, type: "picking" })}
                            title="Depo Toplama Fişi Yazdır"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            onClick={() => setPrintingSlip({ order: o, type: "shipping" })}
                            title="Barkodlu Kargo Etiketi Yazdır"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          >
                            <QrCode size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VIN ŞASİ DOĞRULAMA MODALI */}
            {vinInspectionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Car size={18} className="text-[#f36b2b]" />
                      Şasi (VIN) Doğrulama Masası
                    </h4>
                    <button onClick={() => setVinInspectionModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Müşteri:</span>
                      <span className="font-bold text-slate-800">{vinInspectionModal.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">17 Haneli Şasi Numarası:</span>
                      <span className="font-mono font-black text-sm text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {vinInspectionModal.vinNumber || "Müşteri Şasi Girmemiş"}
                      </span>
                    </div>

                    {/* Siparişteki Parçalar */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">Siparişteki Parçalar:</span>
                      {vinInspectionModal.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] py-0.5">
                          <span>{it.quantity}x {it.name} ({it.code})</span>
                          <span className="font-mono text-slate-400">Raf: {it.shelf || "A-01"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={`https://wa.me/${vinInspectionModal.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Merhaba ${vinInspectionModal.customerName}, Markasi Otomotiv siparişinizdeki (${vinInspectionModal.id}) şasi kontrolünde seçtiğiniz parçanın aracınıza tam uyumlu olmadığı görüldü. Doğru parçayı önermek için buradayız.`
                      )}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <MessageCircle size={15} /> WhatsApp&apos;tan Doğru Parçayı Öner
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await fetch("/api/admin/orders", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: vinInspectionModal.id, action: "vin", vinStatus: "Uyumlu" }),
                          });
                          showToast("Şasi onaylandı (Uyumlu).");
                          setVinInspectionModal(null);
                          void loadOrders();
                        }}
                        className="rounded-xl bg-[#102b42] px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800"
                      >
                        Şasi Uyumlu (Onayla)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DEPO TOPLAMA VE KARGO FİŞİ YAZDIRMA PENCERESİ */}
            {printingSlip && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl space-y-6 text-slate-900 print:m-0 print:p-0">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h2 className="text-xl font-black">
                        {printingSlip.type === "picking" ? "DEPO SİPARİŞ TOPLAMA FİŞİ" : "BARKODLU KARGO GÖNDERİ ETİKETİ"}
                      </h2>
                      <p className="text-xs text-slate-500">Sipariş No: {printingSlip.order.id}</p>
                    </div>
                    <button onClick={() => setPrintingSlip(null)} className="print:hidden text-slate-400">✕</button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="font-bold text-slate-500">Alıcı:</p>
                        <p className="font-bold text-sm text-slate-900">{printingSlip.order.customerName}</p>
                        <p>{printingSlip.order.phone}</p>
                        <p>{printingSlip.order.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-500">Tarih / Saat:</p>
                        <p>{new Date().toLocaleString("tr-TR")}</p>
                        <p className="font-bold text-slate-500 mt-2">Ödeme:</p>
                        <p className="font-bold">{printingSlip.order.paymentMethod}</p>
                      </div>
                    </div>

                    <table className="w-full text-left border">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 border">WMS Raf Adresi</th>
                          <th className="p-2 border">Parça Kodu</th>
                          <th className="p-2 border">Parça Adı</th>
                          <th className="p-2 border text-center">Adet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printingSlip.order.items?.map((it, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 border font-mono font-black text-rose-700 bg-rose-50/40">
                              {it.shelf || "A-01-R01"}
                            </td>
                            <td className="p-2 border font-mono font-bold">{it.code}</td>
                            <td className="p-2 border">{it.name}</td>
                            <td className="p-2 border text-center font-bold">{it.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#f36b2b] px-6 py-2.5 text-xs font-black text-white hover:bg-[#df5b20]"
                    >
                      <Printer size={15} /> Yazıcıya Gönder
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. İADE (RMA) VE TEDARİKÇİ RÜCU TAKİBİ */}
        {/* ============================================================== */}
        {activeTab === "returns" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
                <RotateCcw size={16} className="text-[#f36b2b]" />
                Müşteri İade Talepleri (RMA)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3">İade No</th>
                      <th className="p-3">Müşteri</th>
                      <th className="p-3">İade Nedeni</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {returns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">Bekleyen iade kaydı bulunmuyor.</td>
                      </tr>
                    ) : (
                      returns.map((r) => (
                        <tr key={r.id}>
                          <td className="p-3 font-mono font-bold">{r.id}</td>
                          <td className="p-3 font-semibold">{r.customerName}</td>
                          <td className="p-3">{r.reason}</td>
                          <td className="p-3">
                            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-bold text-[10px]">
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-center space-x-2">
                            <button
                              onClick={async () => {
                                await fetch("/api/admin/returns", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ returnId: r.id, status: "Onaylandı" }),
                                });
                                showToast("İade onaylandı.");
                                void loadReturns();
                              }}
                              className="text-xs font-bold text-emerald-600 hover:underline"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={async () => {
                                await fetch("/api/admin/returns", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ returnId: r.id, status: "Reddedildi" }),
                                });
                                showToast("İade reddedildi.");
                                void loadReturns();
                              }}
                              className="text-xs font-bold text-rose-600 hover:underline"
                            >
                              Reddet
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tedarikçi Rücu Takip Listesi */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
                <Truck size={16} className="text-purple-600" />
                Tedarikçiye Garantiye / İadeye Gönderilecekler Listesi (Rücu)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3">Kayıt No</th>
                      <th className="p-3">Tedarikçi</th>
                      <th className="p-3">Parça Kodu</th>
                      <th className="p-3">Arıza / Problem</th>
                      <th className="p-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">Tedarikçiye gönderilecek rücu kaydı yok.</td>
                      </tr>
                    ) : (
                      recourses.map((rc) => (
                        <tr key={rc.id}>
                          <td className="p-3 font-mono font-bold">{rc.id}</td>
                          <td className="p-3 font-bold text-slate-800">{rc.supplier}</td>
                          <td className="p-3 font-mono font-bold text-sky-700">{rc.partCode}</td>
                          <td className="p-3 text-slate-600">{rc.problemDescription}</td>
                          <td className="p-3">
                            <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 font-bold text-[10px]">
                              {rc.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. ÜYELER, B2B USTA/BAYİ GRUPLARI & MÜŞTERİ GARAJI */}
        {/* ============================================================== */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-[#f36b2b]" />
                  Üyeler, B2B Bayiler & Müşteri Garajı
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3">Üye Adı & E-posta</th>
                      <th className="p-3">B2B Grubu & İskonto</th>
                      <th className="p-3">Cari Bakiye</th>
                      <th className="p-3">Kayıtlı Araçları (Garaj)</th>
                      <th className="p-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[10px] text-slate-500">{m.email} | {m.phone}</p>
                        </td>

                        <td className="p-3">
                          {m.b2bGroupName ? (
                            <span className="inline-block rounded-lg bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[11px] font-bold">
                              {m.b2bGroupName} (%{m.b2bDiscountPercent || 0})
                            </span>
                          ) : (
                            <span className="text-slate-400">Bireysel Müşteri</span>
                          )}
                        </td>

                        <td className="p-3 font-mono font-bold">
                          <span className={m.creditBalance < 0 ? "text-rose-600" : "text-emerald-600"}>
                            {formatPrice(m.creditBalance)}
                          </span>
                        </td>

                        {/* Garaj Araçları */}
                        <td className="p-3">
                          {m.vehicles && m.vehicles.length > 0 ? (
                            <div className="space-y-1">
                              {m.vehicles.map((v) => (
                                <span key={v.id} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 mr-1">
                                  <Car size={11} /> {v.plateNumber} ({v.brand} {v.model})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Kayıtlı araç yok</span>
                          )}
                        </td>

                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="text-xs font-bold text-[#f36b2b] hover:underline"
                          >
                            B2B / Cari Yönet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2B / Cari Modal */}
            {selectedMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="font-extrabold text-sm">{selectedMember.name} - B2B & Cari Ayarları</h4>
                    <button onClick={() => setSelectedMember(null)}>✕</button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">B2B Bayi Grubu Ata:</label>
                      <select
                        value={selectedMember.b2bGroupId || ""}
                        onChange={(e) => setSelectedMember({ ...selectedMember, b2bGroupId: e.target.value || null })}
                        className="w-full rounded-xl border p-2 bg-white"
                      >
                        <option value="">-- Bireysel (İskontosuz) --</option>
                        {b2bGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} (%{g.discountPercent} İskonto)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Cari Bakiye Ekle/Çıkar (+TL / -TL):</label>
                      <input
                        type="number"
                        placeholder="Örn: 500 veya -250"
                        value={cariBalanceDelta}
                        onChange={(e) => setCariBalanceDelta(e.target.value)}
                        className="w-full rounded-xl border p-2 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      onClick={async () => {
                        const delta = parseFloat(cariBalanceDelta) || 0;
                        await fetch("/api/admin/members", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            memberId: selectedMember.id,
                            b2bGroupId: selectedMember.b2bGroupId,
                            creditBalanceDelta: delta !== 0 ? delta : undefined,
                          }),
                        });
                        showToast("Üye B2B ve cari bilgisi güncellendi!");
                        setSelectedMember(null);
                        setCariBalanceDelta("");
                        void loadMembers();
                      }}
                      className="rounded-xl bg-[#f36b2b] px-4 py-2 text-xs font-bold text-white hover:bg-[#df5b20]"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 8. PAZARLAMA: PAYLINK, TERK EDİLEN SEPETLER & KUPONLAR */}
        {/* ============================================================== */}
        {activeTab === "marketing" && (
          <div className="space-y-6">
            {/* PayLink Generator */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-600" />
                  Özel Parça Ödeme Linkleri (PayLink Havuzu)
                </h3>
                <button
                  onClick={() => setPayLinkModal(true)}
                  className="rounded-xl bg-[#f36b2b] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#df5b20]"
                >
                  + Yeni Ödeme Linki Oluştur
                </button>
              </div>

              {payLinkModal && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
                    <input
                      type="text"
                      placeholder="Müşteri Adı"
                      value={payLinkName}
                      onChange={(e) => setPayLinkName(e.target.value)}
                      className="rounded-xl border bg-white p-2"
                    />
                    <input
                      type="text"
                      placeholder="Telefon (WhatsApp)"
                      value={payLinkPhone}
                      onChange={(e) => setPayLinkPhone(e.target.value)}
                      className="rounded-xl border bg-white p-2"
                    />
                    <input
                      type="text"
                      placeholder="Talep Edilen Parça & Model"
                      value={payLinkPart}
                      onChange={(e) => setPayLinkPart(e.target.value)}
                      className="rounded-xl border bg-white p-2"
                    />
                    <input
                      type="number"
                      placeholder="Tutar (TL)"
                      value={payLinkAmount}
                      onChange={(e) => setPayLinkAmount(e.target.value)}
                      className="rounded-xl border bg-white p-2 font-bold"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setPayLinkModal(false)} className="px-3 py-1 text-xs text-slate-500">İptal</button>
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/admin/marketing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "create-paylink",
                            customerName: payLinkName,
                            phone: payLinkPhone,
                            partDescription: payLinkPart,
                            amount: parseFloat(payLinkAmount) || 0,
                          }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setGeneratedPayUrl(data.payUrl);
                          showToast("Ödeme linki üretildi!");
                          setPayLinkModal(false);
                          void loadMarketing();
                        }
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white hover:bg-blue-700"
                    >
                      Linki Üret
                    </button>
                  </div>
                </div>
              )}

              {generatedPayUrl && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Oluşturulan Ödeme Linki: {generatedPayUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPayUrl);
                      showToast("Link kopyalandı!");
                    }}
                    className="flex items-center gap-1 underline"
                  >
                    <Copy size={13} /> Kopyala
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3">Müşteri</th>
                      <th className="p-3">Talep Edilen Parça</th>
                      <th className="p-3 text-right">Tutar</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-center">Paylaş</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payLinks.map((pl) => (
                      <tr key={pl.id}>
                        <td className="p-3">
                          <p className="font-bold">{pl.customerName}</p>
                          <p className="text-[10px] text-slate-500">{pl.phone}</p>
                        </td>
                        <td className="p-3">{pl.partDescription}</td>
                        <td className="p-3 text-right font-black text-[#f36b2b]">{formatPrice(pl.amount)}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            pl.status === "Ödendi" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {pl.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={`https://wa.me/${pl.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Sayın ${pl.customerName}, talep ettiğiniz ${pl.partDescription} için özel ödeme bağlantınız: ${window.location.origin}/odeme/${pl.id}`
                            )}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px] font-bold border border-emerald-200"
                          >
                            <Send size={12} /> WhatsApp ile Gönder
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 9. WEB TASARIM & CMS YÖNETİMİ */}
        {/* ============================================================== */}
        {activeTab === "cms" && (
          <div className="space-y-6">
            {/* ÜST BİLGİLENDİRME & KAYDET BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-orange-200 bg-orange-50/70 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f36b2b] text-white shadow-sm">
                  <Globe size={22} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Web Tasarım, Kurumsal Kimlik & İletişim Ayarları
                  </h3>
                  <p className="text-xs text-slate-600">
                    Burada yapacağınız değişiklikler sitenin en üst duyuru bandı, telefon numaraları, şirket künyesi ve fatura/vergi alanlarına anında yansır.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveCmsSettings}
                disabled={savingCmsSettings}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-3 text-xs sm:text-sm font-black text-white hover:bg-[#df5b20] shadow-md transition disabled:opacity-50 shrink-0"
              >
                {savingCmsSettings ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Tüm Ayarları Kaydet ve Yayınla
                  </>
                )}
              </button>
            </div>

            {/* KART 1: İLETİŞİM & TELEFON NUMARALARI */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b pb-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-sky-50 text-sky-600">
                    <Phone size={17} />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">İletişim & Telefon Numaraları</h4>
                    <p className="text-[11px] text-slate-500">Sitenin en üstündeki barda ve alt iletişim alanında görünen numaralar</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sabit Telefon (En Üst Barda Görünen Tel):
                  </label>
                  <input
                    type="text"
                    value={siteSettings.phone || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                    placeholder="Örn. 0216 444 88 99 veya 0212..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Sitenin en üstündeki siyah/lacivert bantta "📞 [Numara]" olarak görünür.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mobil Cep Telefonu:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.mobile_phone || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, mobile_phone: e.target.value })}
                    placeholder="Örn. 0532 584 43 01"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Sayfa altındaki iletişim alanında cep telefonu olarak listelenir.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp Destek & Sipariş Numarası:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.whatsapp_number || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_number: e.target.value })}
                    placeholder="Örn. 905325844301"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Parça detayında "Ustaya WhatsApp'tan Sorun" için kullanılır (Başında 90 olmalıdır).
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kurumsal E-Posta Adresi:
                  </label>
                  <input
                    type="email"
                    value={siteSettings.email || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                    placeholder="Örn. destek@markasioto.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Çalışma Günleri & Saatleri:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.working_hours || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, working_hours: e.target.value })}
                    placeholder="Örn. Hafta içi: 08:30 - 18:30 | Cumartesi: 09:00 - 15:00"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Sayfa altında mesai ve müşteri hizmetleri saatleri olarak görüntülenir.
                  </p>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="font-bold text-slate-700 block mb-1">
                    Google Harita / Konum Linki:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.google_maps_embed || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, google_maps_embed: e.target.value })}
                    placeholder="https://www.google.com/maps/..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* KART 2: KURUMSAL, VERGİ & FATURA BİLGİLERİ */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b pb-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileText size={17} />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Kurumsal, Vergi & Fatura Bilgileri</h4>
                    <p className="text-[11px] text-slate-500">Sayfa altında (footer) çıkan şirket künyesi, Vergi Dairesi ve açık adres</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Resmi Şirket Ünvanı / Firma Adı:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.company_name || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, company_name: e.target.value })}
                    placeholder="Örn. Markasi Otomotiv Sanayi ve Ticaret A.Ş."
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Sayfa altındaki ana başlık ve fatura sözleşmelerinde geçerli ünvan.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Vergi Dairesi:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.tax_office || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, tax_office: e.target.value })}
                    placeholder="Örn. Kadıköy V.D. veya Çukurova V.D."
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-bold text-emerald-800 bg-emerald-50/20"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Sayfa altında "Vergi Dairesi: [Buraya Yazılan]" şeklinde görüntülenir.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Vergi Numarası / T.C. Kimlik No:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.tax_number || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, tax_number: e.target.value })}
                    placeholder="Örn. 6120894521"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-bold text-slate-800"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Vergi dairesinin yanında "No: [Vergi No]" olarak listelenir.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Açık Firma & Mağaza Adresi:
                  </label>
                  <textarea
                    rows={2}
                    value={siteSettings.address || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                    placeholder="Örn. Yeni Sanayi Sitesi, Mehmet Nuri Arıkan Cd. No:22, Dulkadiroğlu / Kahramanmaraş"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* KART 3: EN ÜST TURUNCU KAYAN YAZI BANDI (MARQUEE) */}
            <div className="rounded-3xl border border-orange-300 bg-orange-50/50 p-6 shadow-sm">
              <div className="border-b border-orange-200 pb-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#f36b2b] text-white shadow-sm">
                    <Radio size={17} />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">En Üst Turuncu Kayan Yazı Bandı (Marquee)</h4>
                    <p className="text-[11px] text-slate-500">Sitenin en tepesinde kesintisiz akan duyuru metni ("Kampanyalar için bizi takip edin" alanı)</p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-200/70 border border-orange-300 px-3 py-1 text-[10px] font-black uppercase text-[#e65f26]">
                  Canlı Kayan Marquee
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Kayan Yazı Metni:
                  </label>
                  <textarea
                    rows={2}
                    value={
                      siteSettings.marquee_text !== undefined
                        ? siteSettings.marquee_text
                        : "Markasi Otomotiv — Orijinal ve eşdeğer yedek parçalar, anlık stok ve tedarikçi fiyatları ile hizmetinizde. Kampanyalar için bizi takip edin!"
                    }
                    onChange={(e) => setSiteSettings({ ...siteSettings, marquee_text: e.target.value })}
                    placeholder="Markasi Otomotiv — Orijinal ve eşdeğer yedek parçalar, anlık stok ve tedarikçi fiyatları ile hizmetinizde. Kampanyalar için bizi takip edin!"
                    className="w-full rounded-xl border border-orange-300 bg-white p-3 font-semibold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    💡 İpucu: Buraya yazdığınız metin sitenin en üstünde turuncu arka plan üzerinde sürekli olarak kayacaktır.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kayan Yazı Durumu:</label>
                    <select
                      value={siteSettings.marquee_enabled !== "0" && siteSettings.marquee_enabled !== "false" ? "1" : "0"}
                      onChange={(e) => setSiteSettings({ ...siteSettings, marquee_enabled: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-bold text-slate-700 outline-none"
                    >
                      <option value="1">✓ Açık (Sitede Göster)</option>
                      <option value="0">✕ Kapalı (Gizle)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bant Arka Plan Rengi:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteSettings.marquee_bg || "#f36b2b"}
                        onChange={(e) => setSiteSettings({ ...siteSettings, marquee_bg: e.target.value })}
                        className="size-9 cursor-pointer rounded-lg border p-0.5"
                      />
                      <input
                        type="text"
                        value={siteSettings.marquee_bg || "#f36b2b"}
                        onChange={(e) => setSiteSettings({ ...siteSettings, marquee_bg: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bant Yazı Rengi:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteSettings.marquee_color || "#ffffff"}
                        onChange={(e) => setSiteSettings({ ...siteSettings, marquee_color: e.target.value })}
                        className="size-9 cursor-pointer rounded-lg border p-0.5"
                      />
                      <input
                        type="text"
                        value={siteSettings.marquee_color || "#ffffff"}
                        onChange={(e) => setSiteSettings({ ...siteSettings, marquee_color: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KART 4: SİTE BAŞLIĞI, SLOGAN & SABİT KARGO DUYURUSU (LACİVERT BANT) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b pb-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-[#f36b2b]">
                    <Layers size={17} />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Site Başlığı, Slogan & Kayan Duyuru Bandı</h4>
                    <p className="text-[11px] text-slate-500">Tarayıcı sekme başlığı ve en üstteki duyuru bandı metinleri</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Site Başlığı (SEO Title):
                  </label>
                  <input
                    type="text"
                    value={siteSettings.site_title || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, site_title: e.target.value })}
                    placeholder="Markasi Otomotiv | Orijinal & Eşdeğer Oto Yedek Parça"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Site Sloganı / Alt Açıklama:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.site_slogan || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, site_slogan: e.target.value })}
                    placeholder="Avrupa grubu araçların perakende yedek parça satışı."
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    En Üst Kayan Duyuru Bandı Metni:
                  </label>
                  <input
                    type="text"
                    value={siteSettings.site_top_announcement || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, site_top_announcement: e.target.value })}
                    placeholder="Saat 16:00'ya kadar verilen siparişler aynı gün kargoda! 1.500 TL üzeri ücretsiz kargo."
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t pt-4">
                <button
                  onClick={handleSaveCmsSettings}
                  disabled={savingCmsSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-2.5 text-xs font-black text-white hover:bg-[#df5b20] shadow-md transition disabled:opacity-50"
                >
                  {savingCmsSettings ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Tüm Ayarları Kaydet ve Yayınla
                    </>
                  )}
                </button>
              </div>
            </div>

                        {/* KART 5: GOOGLE İLE GİRİŞ & ÜYE OLMA (OAUTH 2.0 ENTEGRASYONU) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-[#f36b2b]">
                    <Globe size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">Google ile Giriş & Üye Olma (OAuth 2.0)</h4>
                      {siteSettings.google_client_id && siteSettings.google_client_secret ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 size={12} /> Yapılandırıldı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                          Demo Modu Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Müşterilerinizin tek tıkla Google hesaplarıyla üye olmasını veya giriş yapmasını sağlayın.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/account"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <ExternalLink size={13} /> Giriş Sayfasını Gör
                  </a>
                  <a
                    href="/api/auth/google?demo=1"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    ⚡ Demo Girişi Test Et
                  </a>
                </div>
              </div>

              {/* Bilgilendirme ve Kurulum Adımları */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs text-sky-900 mb-5">
                <p className="font-bold mb-1">📌 Google Cloud Console Yapılandırması:</p>
                <p className="text-slate-600 mb-2">
                  Google Cloud Console (console.cloud.google.com) &gt; APIs & Services &gt; Credentials &gt; Create Credentials &gt; OAuth client ID seçin.
                  Web Application türünü seçip aşağıdaki <strong>Authorized redirect URIs (Yetkili Yönlendirme Adresleri)</strong> alanına ekleyin:
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-sky-200 text-slate-800">
                    <span className="truncate">https://markasioto.vercel.app/api/auth/google/callback</span>
                    <span className="text-[10px] text-slate-400 font-sans ml-2">(Canlı / Vercel)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-sky-200 text-slate-800">
                    <span className="truncate">http://localhost:3000/api/auth/google/callback</span>
                    <span className="text-[10px] text-slate-400 font-sans ml-2">(Yerel Test)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Google Client ID (İstemci Kimliği):
                  </label>
                  <input
                    type="text"
                    value={siteSettings.google_client_id || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, google_client_id: e.target.value })}
                    placeholder="Örn. 123456789-abcdef.apps.googleusercontent.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium font-mono text-xs"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Google Cloud Console'dan aldığınız OAuth 2.0 İstemci Kimliği.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Google Client Secret (Gizli Anahtar):
                  </label>
                  <input
                    type="password"
                    value={siteSettings.google_client_secret || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, google_client_secret: e.target.value })}
                    placeholder="Örn. GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium font-mono text-xs"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Google Cloud Console'dan aldığınız İstemci Gizli Anahtarı.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t pt-4">
                <button
                  onClick={handleSaveCmsSettings}
                  disabled={savingCmsSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-2.5 text-xs font-black text-white hover:bg-[#df5b20] shadow-md transition disabled:opacity-50"
                >
                  {savingCmsSettings ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Google Ayarlarını Kaydet ve Yayınla
                    </>
                  )}
                </button>
              </div>
            </div>

{/* CMS Sayfaları Düzenleyici */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-4">Kurumsal Sayfa Metinleri (Hakkımızda, Sözleşmeler)</h3>
              <div className="flex gap-2 border-b pb-3 mb-4 overflow-x-auto text-xs">
                {cmsPages.map((pg) => (
                  <button
                    key={pg.slug}
                    onClick={() => setSelectedCmsPage(pg)}
                    className={`rounded-xl px-3 py-1.5 font-bold transition shrink-0 ${
                      selectedCmsPage?.slug === pg.slug ? "bg-[#102b42] text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {pg.title}
                  </button>
                ))}
              </div>

              {selectedCmsPage && (
                <div className="space-y-4">
                  <textarea
                    rows={8}
                    value={selectedCmsPage.content}
                    onChange={(e) => setSelectedCmsPage({ ...selectedCmsPage, content: e.target.value })}
                    className="w-full rounded-2xl border p-4 text-xs font-sans leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        await fetch("/api/admin/cms", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ section: "page", ...selectedCmsPage }),
                        });
                        showToast(`${selectedCmsPage.title} sayfası güncellendi!`);
                      }}
                      className="rounded-xl bg-[#f36b2b] px-5 py-2 text-xs font-bold text-white hover:bg-[#df5b20]"
                    >
                      Sayfa Metnini Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 10. GÜVENLİK, RBAC & AUDIT LOGS */}
        {/* ============================================================== */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
                <History size={16} className="text-[#f36b2b]" />
                İşlem Kayıtları (Audit Logs - Kim, Ne Zaman, Ne Yaptı?)
              </h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b sticky top-0">
                    <tr>
                      <th className="p-3">Yönetici</th>
                      <th className="p-3">İşlem Türü</th>
                      <th className="p-3">Kayıt / Varlık</th>
                      <th className="p-3">Detay</th>
                      <th className="p-3">Zaman</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 text-[11px]">
                        <td className="p-3 font-bold text-slate-900">{log.adminEmail}</td>
                        <td className="p-3 font-mono font-bold text-sky-700">{log.action}</td>
                        <td className="p-3">{log.entityType} ({log.entityId})</td>
                        <td className="p-3 text-slate-600 truncate max-w-xs">{log.details}</td>
                        <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString("tr-TR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ============================================================== */}
      {/* SAĞA DAYALI ÇEKMECE PANELİ: ÜRÜN DÜZENLEME & EKLEME */}
      {/* ============================================================== */}
      {productModalOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setProductModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
          />

          {/* Sağa Dayalı Çekmece (Slide-Over Drawer) */}
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[580px] lg:w-[680px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6 bg-[#0a1826] text-white">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-orange-500/20 text-[#f36b2b] grid place-items-center border border-orange-500/30">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white truncate max-w-[380px]">
                    {editingProduct ? `Düzenle: ${editingProduct.name}` : "Yeni Parça / Ürün Ekle"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProduct ? `Stok Kodu: ${editingProduct.code}` : "Ürün detaylarını girin ve kataloğa ekleyin"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* BİLGİSAYARDAN RESİM YÜKLEME ALANI */}
              <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900">
                      Ürün Görselleri & Resim Yükleme
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Bilgisayarınızdan fotoğraf seçin veya harici URL yapıştırın.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#df5b20] cursor-pointer transition">
                    <Upload size={14} />
                    <span>Bilgisayardan Resim Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadImages(e.target.files)}
                    />
                  </label>
                </div>

                {uploadingImage && (
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <LoaderCircle size={14} className="animate-spin" />
                    <span>Görseller sunucuya yükleniyor...</span>
                  </div>
                )}

                {/* Resim Galerisi Önizleme */}
                {productForm.images ? (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {productForm.images
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group size-20 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm"
                        >
                          <img src={imgUrl} alt="Ürün" className="size-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] font-black text-white text-center py-0.5">
                              Kapak
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const arr = productForm.images
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, images: arr.join("\n") });
                            }}
                            className="absolute top-1 right-1 size-5 rounded-full bg-rose-600 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition shadow"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Henüz görsel eklenmedi.</p>
                )}

                <div>
                  <input
                    type="text"
                    placeholder="Veya görsel URL'si yapıştırıp Enter'a basın..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          const current = productForm.images ? productForm.images.split("\n").map(s => s.trim()).filter(Boolean) : [];
                          setProductForm({ ...productForm, images: [...current, val].join("\n") });
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-400 font-mono"
                  />
                </div>
              </div>

              {/* TEMEL BİLGİLER */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ürün / Parça Adı *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Örn: Ön Fren Balata Takımı"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parça Kodu (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value, sku: e.target.value })}
                    placeholder="Örn: 04E 115 561 H"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Üretici Marka *</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="Örn: BOSCH, MANN, VALEO"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-orange-400"
                  >
                    {flatCategories.filter((c) => !c.isVehicleTree).map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parça Türü</label>
                  <select
                    value={productForm.kind}
                    onChange={(e) => setProductForm({ ...productForm, kind: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-orange-400"
                  >
                    <option value="OEM">Orijinal (OEM)</option>
                    <option value="Eşdeğer">Muadil / Eşdeğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alış Maliyeti (TL) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.cost}
                    onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                    placeholder="250.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400 font-bold text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satış Fiyatı (TL) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="385.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400 font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merkez Stok (Adet) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.centralStock}
                    onChange={(e) => setProductForm({ ...productForm, centralStock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400 font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">İndirimli Fiyat (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.discountPrice}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                    placeholder="Opsiyonel"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </div>

                {/* DEPO RAF ADRESİ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Depo Koridoru</label>
                  <input
                    type="text"
                    value={productForm.corridor}
                    onChange={(e) => setProductForm({ ...productForm, corridor: e.target.value })}
                    placeholder="A"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Raf No</label>
                  <input
                    type="text"
                    value={productForm.shelf}
                    onChange={(e) => setProductForm({ ...productForm, shelf: e.target.value })}
                    placeholder="04"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Göz / Kutu No</label>
                  <input
                    type="text"
                    value={productForm.bin}
                    onChange={(e) => setProductForm({ ...productForm, bin: e.target.value })}
                    placeholder="12"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kargo Desi</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productForm.desi}
                    onChange={(e) => setProductForm({ ...productForm, desi: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barkod</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="8690000000000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durum</label>
                  <select
                    value={productForm.condition}
                    onChange={(e) => setProductForm({ ...productForm, condition: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400"
                  >
                    <option value="Sıfır">Sıfır Kutusunda</option>
                    <option value="Çıkma">Orijinal Çıkma</option>
                    <option value="Yenilenmiş">Revizyonlu / Yenilenmiş</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Çapraz OEM Kodları (Virgülle ayırın)</label>
                  <input
                    type="text"
                    value={productForm.oemCodes}
                    onChange={(e) => setProductForm({ ...productForm, oemCodes: e.target.value })}
                    placeholder="04E115561H, 04E115561D, F026407157"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-orange-400"
                  />
                </div>

                {/* ========================================================= */}
                {/* 🚗 ARAÇ UYUMLULUK MASASI (DİNAMİK ÇOKLU ARAÇ EŞLEME) */}
                {/* ========================================================= */}
                <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 space-y-3.5 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-sky-100 text-sky-700 grid place-items-center">
                        <Car size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          Araç Uyumluluk Masası (Fitment Engine)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Bu parçanın uyumlu olduğu araçları seçin. Bir parça birden fazla araca uyabilir.
                        </p>
                      </div>
                    </div>

                    {/* "Başka Araç Uyumu da Var" Tık / Butonu */}
                    <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-sm hover:border-sky-300 transition">
                      <input
                        type="checkbox"
                        checked={hasMultiFitment}
                        onChange={(e) => setHasMultiFitment(e.target.checked)}
                        className="rounded text-orange-500 focus:ring-orange-400 size-3.5"
                      />
                      <span className="text-[11px] font-bold text-slate-800">
                        Başka araç uyumu da var (Çoklu Model)
                      </span>
                    </label>
                  </div>

                  {/* Cascading Dropdowns: Marka -> Model -> Kasa/Yıl -> Motor */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {/* 1. MARKA */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        1. Araç Markası
                      </label>
                      <select
                        value={fitmentBrand}
                        onChange={(e) => {
                          setFitmentBrand(e.target.value);
                          setFitmentModel("");
                          setFitmentGeneration("");
                          setFitmentEngine("");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-orange-400"
                      >
                        <option value="">Marka Seçin...</option>
                        {vehicleCatalog.map((b) => (
                          <option key={b.label} value={b.label}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. MODEL */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        2. Model
                      </label>
                      <select
                        disabled={!fitmentBrand}
                        value={fitmentModel}
                        onChange={(e) => {
                          setFitmentModel(e.target.value);
                          setFitmentGeneration("");
                          setFitmentEngine("");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Model Seçin...</option>
                        {currentModels.map((m) => (
                          <option key={m.label} value={m.label}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. KASA / YIL */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        3. Kasa / Yıl
                      </label>
                      <select
                        disabled={!fitmentModel}
                        value={fitmentGeneration}
                        onChange={(e) => {
                          setFitmentGeneration(e.target.value);
                          setFitmentEngine("");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Kasa Seçin (Tümü)</option>
                        {currentGenerations.map((g) => (
                          <option key={g.id || g.label} value={g.id || g.label}>
                            {g.label} ({g.startYear}-{g.endYear || "Günümüz"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. MOTOR / GÜÇ */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                        4. Motor / Güç
                      </label>
                      <select
                        disabled={!fitmentModel}
                        value={fitmentEngine}
                        onChange={(e) => setFitmentEngine(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Tüm Motorlar</option>
                        {currentEngines.map((eng, idx) => (
                          <option key={idx} value={eng.label}>
                            {eng.label} {eng.powerHp?.length ? `(${eng.powerHp.join("/")} HP)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ekle Butonu */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-slate-600 font-medium">
                      {fitmentBrand && fitmentModel
                        ? `Seçilen: ${fitmentBrand} ${fitmentModel} ${fitmentGeneration ? "· " + fitmentGeneration : ""} ${fitmentEngine ? "· " + fitmentEngine : ""}`
                        : "Yukarıdaki listeden marka ve model seçerek bu parçaya araç uyumluluğu ekleyin."}
                    </p>
                    <button
                      type="button"
                      disabled={!fitmentBrand || !fitmentModel}
                      onClick={handleAddFitmentVehicle}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-800 disabled:opacity-50 transition shrink-0"
                    >
                      <Plus size={14} />
                      <span>Bu Aracı Uyumluluk Listesine Ekle</span>
                    </button>
                  </div>

                  {/* Seçilen Araç Rozetleri (Badges / Pills) */}
                  {productForm.compatibleVehicles && productForm.compatibleVehicles.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-sky-100">
                      <span className="text-[11px] font-extrabold text-slate-700">
                        Tanımlı Uyumlu Araçlar ({productForm.compatibleVehicles.length} Araç):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {productForm.compatibleVehicles.map((veh, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-sky-300 shadow-sm"
                          >
                            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>
                              {veh.brand} {veh.model}
                              {veh.generation ? ` (${veh.generation})` : ""}
                              {veh.yearRange ? ` ${veh.yearRange}` : ""}
                              {veh.engine ? ` · ${veh.engine}` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFitmentVehicle(idx)}
                              className="text-slate-400 hover:text-rose-600 transition ml-1"
                              title="Bu araç uyumunu kaldır"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      Henüz yapısal araç seçilmedi. İsterseniz yukarıdan araç ekleyebilir veya aşağıdaki metin alanına manuel yazabilirsiniz.
                    </p>
                  )}
                </div>

                {/* MONTAJ POZİSYONU (YÖN) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montaj Pozisyonu (Yön)
                  </label>
                  <select
                    value={productForm.position || "Yönsüz / Evrensel"}
                    onChange={(e) => setProductForm({ ...productForm, position: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-orange-400"
                  >
                    <option value="Yönsüz / Evrensel">Yönsüz / Evrensel (Her İki Taraf)</option>
                    <option value="Ön Takım">Ön Takım</option>
                    <option value="Ön Sağ (Yolcu Tarafı)">Ön Sağ (Yolcu Tarafı)</option>
                    <option value="Ön Sol (Sürücü Tarafı)">Ön Sol (Sürücü Tarafı)</option>
                    <option value="Arka Takım">Arka Takım</option>
                    <option value="Arka Sağ">Arka Sağ</option>
                    <option value="Arka Sol">Arka Sol</option>
                    <option value="Sağ Taraf">Sağ Taraf</option>
                    <option value="Sol Taraf">Sol Taraf</option>
                    <option value="Kabin İçi">Kabin İçi</option>
                    <option value="Motor Bölmesi">Motor Bölmesi</option>
                  </select>
                </div>

                {/* ESKİSİ İADELİ PARÇA (CORE DEPOZİTO) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.hasCoreDeposit}
                      onChange={(e) => setProductForm({ ...productForm, hasCoreDeposit: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-400 size-3.5"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Eskisi İadeli Parça (Depozitolu / Revizyonlu)
                    </span>
                  </label>
                  {productForm.hasCoreDeposit && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Eski Parça Depozito Tutarı (TL)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={productForm.coreDepositPrice}
                        onChange={(e) => setProductForm({ ...productForm, coreDepositPrice: e.target.value })}
                        placeholder="Örn: 1500"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-orange-400"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Müşteri eski arızalı parçayı (turbo, alternatör vb.) kargoyla iade ettiğinde bu tutar kendisine geri ödenir.
                      </p>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Uyumlu Araçlar Özeti (Fitment Metni)</label>
                  <input
                    type="text"
                    value={productForm.fitment}
                    onChange={(e) => setProductForm({ ...productForm, fitment: e.target.value })}
                    placeholder="Yukarıdaki araç seçildiğinde otomatik oluşur..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400 font-medium font-mono text-[11px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detaylı Açıklama</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Ürün teknik özellikleri ve detayları..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Drawer Sticky Footer */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-950/20 hover:bg-[#df5b20] disabled:opacity-60 transition"
                >
                  {savingProduct ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                  {editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Kataloğa Ekle"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

{/* MODAL: USTA HIZLI OEM SORGU & SEPET MASASI */}
      {quickOemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-slate-900 text-white grid place-items-center">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Sanayi Ustası & Hızlı OEM Parça Sorgu Masası
                  </h3>
                  <p className="text-xs text-slate-500">
                    Birden fazla OEM kodunu veya parça numarasını alt alta yapıştırıp kataloğunuzda anında sorgulayın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickOemModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                OEM Kodlarını Yapıştırın (Virgül veya her satıra bir kod):
              </label>
              <textarea
                rows={4}
                value={quickOemText}
                onChange={(e) => setQuickOemText(e.target.value)}
                placeholder="04E 115 561 H\n5Q0 698 151 F\n1K0 129 620 D"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono outline-none focus:border-orange-400"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Ustanın WhatsApp&apos;tan attığı parça kodlarını direkt kopyalayıp buraya yapıştırabilirsiniz.
                </span>
                <button
                  type="button"
                  onClick={handleQuickOemSearch}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#df5b20] transition"
                >
                  <Search size={14} />
                  <span>Katalogda Eşle & Sorgula</span>
                </button>
              </div>
            </div>

            {/* Sonuç Listesi */}
            {quickOemResults.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                  <span>Bulunan Eşleşen Parçalar ({quickOemResults.length} Adet):</span>
                  <span className="text-emerald-700 font-mono">
                    Toplam: {formatPrice(quickOemResults.reduce((sum, p) => sum + p.price, 0))}
                  </span>
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {quickOemResults.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                          <span className="bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded">{p.code}</span>
                          <span>{p.brand}</span>
                          <span className="text-emerald-700 font-bold">Stok: {p.centralStock} adet</span>
                          <span>Raf: {p.corridor ? `${p.corridor}-${p.shelf}-${p.bin || "01"}` : p.shelf}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900">{formatPrice(p.price)}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickOemModalOpen(false);
                            handleOpenProductModal(p);
                          }}
                          className="mt-1 text-[11px] font-bold text-[#f36b2b] hover:underline"
                        >
                          Düzenle →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

            {/* ============================================================== */}
      {/* MODAL: TOPLU ÜRÜN EKLE / KATEGORİ LİNKİ İLE OTOMATİK ÇEKİCİ */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Otomatik Toplu Ürün Ekleme Masası
                  </h3>
                  <p className="text-xs text-slate-500">
                    Herhangi bir sitenin kategori linkini yapıştırarak ürünleri otomatik çekin veya Excel/CSV ile aktarın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkImportOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setBulkImportMode("category-url")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  bulkImportMode === "category-url"
                    ? "bg-[#102b42] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Globe size={15} />
                Kategori Linki Yapıştır (Otomatik Çek)
              </button>
              <button
                type="button"
                onClick={() => setBulkImportMode("excel")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  bulkImportMode === "excel"
                    ? "bg-[#102b42] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileSpreadsheet size={15} />
                Excel / CSV ile Yükle
              </button>
            </div>

            {/* MODE 1: KATEGORİ LİNKİNDEN OTOMATİK ÇEKME */}
            {bulkImportMode === "category-url" && (
              <div className="space-y-4">
                <form onSubmit={handleCategoryScrape} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    Herhangi Bir Sitenin Kategori / Parça Listesi Linkini Yapıştırın:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      required
                      value={categoryScrapeUrl}
                      onChange={(e) => setCategoryScrapeUrl(e.target.value)}
                      placeholder="https://www.orneksite.com/kategori/fren-balatalari veya opel-parca"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:border-orange-400 focus:bg-white font-medium"
                    />
                    <button
                      type="submit"
                      disabled={categoryScraping || !categoryScrapeUrl.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f36b2b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#df5b20] disabled:opacity-60 whitespace-nowrap transition"
                    >
                      {categoryScraping ? (
                        <>
                          <LoaderCircle size={15} className="animate-spin" />
                          <span>Ürünler Taranıyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Kategorideki Tüm Ürünleri Çek</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    💡 İpucu: Herhangi bir yedek parça veya e-ticaret sitesinin kategori sayfa adresini girdiğinizde; ürün isimleri, resimleri, fiyatları ve açıklamaları otomatik olarak aşağıdaki düzenleme tablosuna aktarılır.
                  </p>
                </form>

                {/* STAGING QUEUE (DÜZENLEME MASASI) */}
                {scrapedCategoryItems.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          Çekilen Ürünler ({scrapedCategoryItems.length} Adet)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Kaydetmeden önce satır içi güncelleyebilir, istemediğiniz ürünleri silebilirsiniz.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={bulkImportLoading}
                        onClick={handleSaveQueueToCatalog}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition"
                      >
                        {bulkImportLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                        Tümünü Kataloğa Aktar ({scrapedCategoryItems.length} Ürün)
                      </button>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 w-12">Resim</th>
                            <th className="px-3 py-2">Ürün Adı</th>
                            <th className="px-3 py-2 w-28">Stok Kodu</th>
                            <th className="px-3 py-2 w-28">Kategori</th>
                            <th className="px-3 py-2 w-24 text-right">Fiyat (TL)</th>
                            <th className="px-3 py-2 w-20 text-center">Stok</th>
                            <th className="px-3 py-2 w-10 text-center">Sil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scrapedCategoryItems.map((it, idx) => (
                            <tr key={it.id || idx} className="hover:bg-slate-50 transition">
                              <td className="px-3 py-2">
                                <div className="size-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                  {it.image ? (
                                    <img src={it.image} alt="" className="size-full object-cover" />
                                  ) : (
                                    <div className="size-full grid place-items-center text-slate-400">
                                      <ImageIcon size={14} />
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={it.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setScrapedCategoryItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                                    );
                                  }}
                                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold outline-none focus:border-orange-400"
                                />
                              </td>

                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={it.code}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setScrapedCategoryItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, code: val } : item))
                                    );
                                  }}
                                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono font-bold outline-none focus:border-orange-400"
                                />
                              </td>

                              <td className="px-3 py-2">
                                <select
                                  value={it.category}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setScrapedCategoryItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, category: val } : item))
                                    );
                                  }}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-medium outline-none focus:border-orange-400"
                                >
                                  {flatCategories.filter((c) => !c.isVehicleTree).map((c) => (
                                    <option key={c.id || c.name} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={it.price}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setScrapedCategoryItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, price: val, cost: Math.round(val * 0.7) } : item))
                                    );
                                  }}
                                  className="w-20 rounded-lg border border-slate-200 px-1.5 py-1 text-right text-xs font-bold outline-none focus:border-orange-400"
                                />
                              </td>

                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  value={it.stock}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setScrapedCategoryItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, stock: val } : item))
                                    );
                                  }}
                                  className="w-14 rounded-lg border border-slate-200 px-1 py-1 text-center text-xs font-bold outline-none focus:border-orange-400"
                                />
                              </td>

                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setScrapedCategoryItems((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: EXCEL / CSV İLE İÇE AKTARMA */}
            {bulkImportMode === "excel" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">Sütun Sırası Formatı:</span>
                    <a
                      href="/api/admin/products?template=csv"
                      className="font-bold text-[#f36b2b] hover:underline flex items-center gap-1"
                    >
                      <Download size={13} /> Örnek Şablonu İndir
                    </a>
                  </div>
                  <p className="font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                    Stok Kodu ; Ürün Adı ; Marka ; Kategori ; Fiyat ; Maliyet ; Stok ; Raf ; Desi ; Barkod ; OEM
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      CSV veya Excel Tablosunu Yapıştırın:
                    </label>
                    <label className="cursor-pointer text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
                      <Upload size={13} /> Dosyadan Yükle (.csv)
                      <input
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setBulkImportText(String(ev.target?.result || ""));
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>

                  <textarea
                    rows={8}
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    placeholder={`04E 115 561 H;Yağ Filtresi;MANN-FILTER;Filtreler;385.00;248.00;18;A-04-12;1.2;8690000;04E115561H\n5Q0 698 151 F;Ön Fren Balata;ATE;Balata-Fren;2490.00;1760.00;7;B-02-05;2.5;8690001;5Q0698151F`}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs font-mono outline-none focus:border-orange-400 bg-slate-50/50"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoCategory"
                      checked={bulkImportAutoCategory}
                      onChange={(e) => setBulkImportAutoCategory(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    <label htmlFor="autoCategory" className="text-xs font-medium text-slate-700 cursor-pointer">
                      Kategori sistemde yoksa otomatik olarak kategori ağacına ekle
                    </label>
                  </div>

                  {bulkImportResult && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 space-y-1">
                      <p className="font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        İşlem Tamamlandı: {bulkImportResult.inserted} yeni ürün eklendi, {bulkImportResult.updated} ürün güncellendi.
                      </p>
                      {bulkImportResult.errors?.length > 0 && (
                        <div className="text-[11px] text-rose-700 pt-1">
                          {bulkImportResult.errors.map((err, idx) => (
                            <p key={idx}>⚠️ {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBulkImportOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Kapat
                  </button>
                  <button
                    type="button"
                    disabled={bulkImportLoading || !bulkImportText.trim()}
                    onClick={handleBulkImportSubmit}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {bulkImportLoading ? <LoaderCircle size={15} className="animate-spin" /> : <FileUp size={15} />}
                    Kataloğa Toplu Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
