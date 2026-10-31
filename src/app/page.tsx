"use client";

import {
  ArrowDownUp,
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Heart,
  Info,
  Layers,
  LoaderCircle,
  MessageCircle,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";

type VehicleSelection = {
  brand: string;
  model: string;
  year: string;
  generationId: string;
  body: string;
  engine: string;
  power: string;
};

type SupplierStock = {
  supplier: string;
  quantity: number;
  delivery: string;
};

type Part = {
  id: string;
  brand: string;
  name: string;
  code: string;
  kind: "OEM" | "Eşdeğer";
  category: string;
  price: number;
  image?: string | null;
  images?: string[];
  description?: string;
  cost?: number;
  centralStock?: number;
  shelf?: string;
  xmlStock?: SupplierStock[];
  canPurchase: boolean;
  fitment: string;
};

type CartLine = { productId: string; quantity: number };

type CheckoutProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  addressLine: string;
  district: string;
  city: string;
  postalCode: string;
};

type DecodedVin = {
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

type SourceVehicleOption = { value: string; label: string };

type CmsSettings = Record<string, string>;
type CmsSlider = {
  id: string;
  title: string;
  subtitle: string;
  imageDesktop: string;
  imageMobile: string;
  linkUrl: string;
  buttonText: string;
  position: string;
  sortOrder: number;
  active: boolean | number;
};
type CmsPage = {
  slug: string;
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  active?: boolean | number;
};
const getCategorySafeImage = (catName: string, customImage?: string | null): string => {
  if (customImage && typeof customImage === 'string' && customImage.trim() !== '') {
    const trimmed = customImage.trim();
    if (!trimmed.includes('cdnaws.com.tr') && !trimmed.includes('yedekparcacomtr')) {
      return trimmed;
    }
  }
  const clean = (catName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');

  if (clean.includes('balata') || clean.includes('fren')) return '/categories/balata-fren.svg';
  if (clean.includes('debriyaj')) return '/categories/debriyaj.svg';
  if (clean.includes('filtre')) return '/categories/filtreler.svg';
  if (clean.includes('yag')) return '/categories/motor-yaglari.svg';
  if (clean.includes('suspansiyon') || clean.includes('amortis')) return '/categories/suspansiyon.svg';
  if (clean.includes('yakit')) return '/categories/yakit-sistemi.svg';
  if (clean.includes('motor')) return '/categories/motor-parcalari.svg';
  return '/categories/fren-sistemi.svg';
};

const featuredCategories = [
  {
    label: "Balata-Fren",
    filter: "Balata-Fren",
    image: "/categories/balata-fren.svg",
    description: "Güvenli duruş, güçlü performans",
  },
  {
    label: "Debriyaj Sistemi",
    filter: "Debriyaj Sistemi",
    image: "/categories/debriyaj.svg",
    description: "Yumuşak geçiş, sağlam kavrama",
  },
  {
    label: "Motor Parçalari",
    filter: "Motor Parçalari",
    image: "/categories/motor-parcalari.svg",
    description: "Motorunuz için temiz hava",
  },
  {
    label: "Motor Yağları",
    filter: "Motor Yağları",
    image: "/categories/motor-yaglari.svg",
    description: "Her kilometrede güçlü koruma",
  },
  {
    label: "Süspansiyon",
    filter: "Süspansiyon",
    image: "/categories/suspansiyon.svg",
    description: "Konforlu ve güvenli sürüş",
  },
  {
    label: "Yakıt Sistemi",
    filter: "Yakıt Sistemi",
    image: "/categories/yakit-sistemi.svg",
    description: "Temiz yakıt, verimli motor",
  },
] as const;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value / 100);

const whatsappPhone = "905325844301";
const productsPerPage = 6;
const vehicleStepLabels = ["Marka", "Model", "Kasa", "Yıl", "Motor", "Güç"];
const frequentlySelectedMakes = [
  "Volkswagen",
  "Audi",
  "Mercedes",
  "Bmw",
  "Opel",
  "Peugeot",
  "Citroen",
];
const vehicleOptionWarmups = new Map<string, Promise<void>>();

function cleanPartNumber(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}


function normalizeSearchText(val: string): string {
  return (val || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchCategory(productCat: string, selectedCat: string): boolean {
  if (!selectedCat || selectedCat === "Tüm Parçalar") return true;
  if (!productCat) return false;
  const pNorm = normalizeSearchText(productCat);
  const sNorm = normalizeSearchText(selectedCat);
  if (pNorm === sNorm) return true;

  if (sNorm.includes("yag")) return pNorm.includes("yag");
  if (sNorm.includes("fren") || sNorm.includes("balata")) {
    return pNorm.includes("fren") || pNorm.includes("balata");
  }
  if (sNorm.includes("debriyaj")) return pNorm.includes("debriyaj");
  if (sNorm.includes("filtre")) return pNorm.includes("filtre");
  if (sNorm.includes("suspansiyon") || sNorm.includes("amortis")) {
    return pNorm.includes("suspansiyon") || pNorm.includes("amortis");
  }
  if (sNorm.includes("yakit")) return pNorm.includes("yakit");
  if (sNorm.includes("motor") && !sNorm.includes("yag")) {
    return pNorm.includes("motor") && !pNorm.includes("yag");
  }

  return pNorm.includes(sNorm) || sNorm.includes(pNorm);
}

function normalizeFitment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function getError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `İşlem başarısız oldu (${response.status}).`;
}

const vehicleOptionMemoryCache = new Map<string, SourceVehicleOption[]>();

async function getSourceVehicleOptions(
  sequence: number,
  selectedValues: string[],
  signal?: AbortSignal,
): Promise<SourceVehicleOption[]> {
  const params = new URLSearchParams({ sequence: String(sequence) });
  selectedValues.forEach((value, index) =>
    params.set(`specs[${index + 1}]`, value),
  );
  const cacheKey = `v_cat_${params.toString()}`;

  // 1. In-memory RAM cache check (Instant 0ms)
  if (vehicleOptionMemoryCache.has(cacheKey)) {
    return vehicleOptionMemoryCache.get(cacheKey)!;
  }

  // 2. Browser localStorage cache check
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SourceVehicleOption[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          vehicleOptionMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
  }

  // 3. API request with force-cache
  try {
    const response = await fetch(`/api/vehicles/catalog?${params}`, {
      cache: "force-cache",
      signal,
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      options: SourceVehicleOption[];
    };
    const options = data.options || [];
    vehicleOptionMemoryCache.set(cacheKey, options);
    if (typeof window !== "undefined" && options.length > 0) {
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(options));
      } catch {
        // ignore quota error
      }
    }
    return options;
  } catch {
    return [];
  }
}

function warmVehicleOptionBranches(
  sequence: number,
  branches: string[][],
  concurrency = 3,
) {
  const warmupBranches = branches.slice(0, 15);
  let nextBranch = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, warmupBranches.length) },
    async () => {
      while (nextBranch < warmupBranches.length) {
        const selectedValues = warmupBranches[nextBranch++];
        if (!selectedValues) continue;
        void getSourceVehicleOptions(sequence, selectedValues);
      }
    },
  );
  void Promise.all(workers);
}

export default function Home() {
  const [hideCost, setHideCost] = useState(true);
  const [canViewCost, setCanViewCost] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [vin, setVin] = useState("");
  const [vinStatus, setVinStatus] = useState<"idle" | "valid" | "invalid">(
    "idle",
  );
  const [vinLoading, setVinLoading] = useState(false);
  const [decodedVin, setDecodedVin] = useState<DecodedVin | null>(null);
  const [vinError, setVinError] = useState("");
  const [vehicleSelections, setVehicleSelections] = useState<
    Array<SourceVehicleOption | null>
  >(() => Array.from({ length: 6 }, () => null));
  const [vehicleOptions, setVehicleOptions] = useState<SourceVehicleOption[][]>(
    () => Array.from({ length: 6 }, () => []),
  );
  const [loadingVehicleStep, setLoadingVehicleStep] = useState<number | null>(1);
  const [vehicleCatalogError, setVehicleCatalogError] = useState("");
  const vehicleCatalogRequest = useRef<AbortController | null>(null);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ name: string; image: string; description?: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  function toggleCategory(categoryName: string) {
    setCurrentProductPage(1);
    setSelectedCategories((current) =>
      current.includes(categoryName)
        ? current.filter((c) => c !== categoryName)
        : [...current, categoryName]
    );
  }

  function clearCategoryFilter() {
    setCurrentProductPage(1);
    setSelectedCategories([]);
  }
  const [cartAnimationId, setCartAnimationId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Part | null>(null);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const c of d.categories || []) map[c.name] = c.image;
        setCategoryImages(map);
        if (Array.isArray(d.categories) && d.categories.length > 0) {
          setDynamicCategories(d.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) {
      const timer = setTimeout(() => {
        setSelectedCategories([cat]);
        setCurrentProductPage(1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);
  const [sortMode, setSortMode] = useState<
    "recommended" | "price-asc" | "price-desc" | "stock-desc"
  >("recommended");
  const [products, setProducts] = useState<Part[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [productCatalog, setProductCatalog] = useState<Record<string, Part>>({});
  const [productCatalogHydrated, setProductCatalogHydrated] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartStorageWarning, setCartStorageWarning] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);
  const [favoritesStorageWarning, setFavoritesStorageWarning] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderNotice, setOrderNotice] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [checkoutProfile, setCheckoutProfile] =
    useState<CheckoutProfile | null>(null);
  const [memberProfileWarning, setMemberProfileWarning] = useState("");

  const [cmsSettings, setCmsSettings] = useState<CmsSettings>({});
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (selectedProduct) setSelectedProduct(null);
        else if (cartOpen) setCartOpen(false);
        else if (checkoutOpen) setCheckoutOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct, cartOpen, checkoutOpen]);

  const [cmsSliders, setCmsSliders] = useState<CmsSlider[]>([]);
  const [cmsPages, setCmsPages] = useState<CmsPage[]>([]);
  const [activeSliderIndex, setActiveSliderIndex] = useState(0);

  useEffect(() => {
    // 1. Instant fallback from localStorage
    let localSaved: Record<string, string> | null = null;
    try {
      const stored = localStorage.getItem("markasi_site_settings");
      if (stored) {
        localSaved = JSON.parse(stored);
        if (localSaved && typeof localSaved === "object") {
          setCmsSettings((prev) => ({ ...prev, ...localSaved }));
        }
      }
    } catch {}

    // 2. Fresh dynamic load from server bypassing any cache
    fetch(`/api/admin/cms?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const serverSettings = data.settings || {};
        const merged = localSaved ? { ...serverSettings, ...localSaved } : serverSettings;
        setCmsSettings(merged);
        if (data.sliders) setCmsSliders(data.sliders);
        if (data.pages) setCmsPages(data.pages);
      })
      .catch((err) => console.warn("CMS settings load error:", err));
  }, []);

  const heroSliders = cmsSliders.filter(
    (s) => (s.active === 1 || s.active === true) && (s.position === "hero_slider" || !s.position)
  );
  const bottomBanners = cmsSliders.filter(
    (s) => (s.active === 1 || s.active === true) && s.position === "bottom_banner",
  );


  useEffect(() => {
    if (heroSliders.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSliderIndex((prev) => (prev + 1) % heroSliders.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSliders.length]);

  const loadVehicleOptions = useCallback(
    async (
      sequence: number,
      selectedValues: string[],
    ): Promise<SourceVehicleOption[] | null> => {
      vehicleCatalogRequest.current?.abort();
      const controller = new AbortController();
      vehicleCatalogRequest.current = controller;
      setLoadingVehicleStep(sequence);
      setVehicleCatalogError("");
      try {
        const options = await getSourceVehicleOptions(
          sequence,
          selectedValues,
          controller.signal,
        );
        if (vehicleCatalogRequest.current !== controller) return null;
        setVehicleOptions((current) =>
          current.map((items, index) =>
            index === sequence - 1 ? options : items,
          ),
        );
        return options;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return null;
        }
        if (vehicleCatalogRequest.current !== controller) return null;
        console.warn("Vehicle catalog step load warning:", error);
        return null;
      } finally {
        if (vehicleCatalogRequest.current === controller) {
          vehicleCatalogRequest.current = null;
          setLoadingVehicleStep(null);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const warmController = new AbortController();
    vehicleCatalogRequest.current = controller;
    void getSourceVehicleOptions(1, [], controller.signal)
      .then((options) => {
        if (vehicleCatalogRequest.current !== controller) return;
        setVehicleOptions((current) =>
          current.map((items, index) => (index === 0 ? options : items)),
        );
        setVehicleCatalogError("");
        const commonMakeBranches = options
          .filter((option) =>
            frequentlySelectedMakes.some(
              (make) => make.toLowerCase() === option.value.toLowerCase(),
            ),
          )
          .map((option) => [option.value]);
        warmVehicleOptionBranches(2, commonMakeBranches, 2);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (vehicleCatalogRequest.current !== controller) return;
        setVehicleCatalogError(
          error instanceof Error ? error.message : "Araç markaları yüklenemedi.",
        );
      })
      .finally(() => {
        if (vehicleCatalogRequest.current === controller) {
          vehicleCatalogRequest.current = null;
          setLoadingVehicleStep(null);
        }
      });
    // Pre-warm top popular automotive brands into browser cache immediately
    void fetch("/api/vehicles/catalog?warm=1", { cache: "default" }).catch(() => {});
    return () => {
      controller.abort();
      warmController.abort();
      if (vehicleCatalogRequest.current === controller) {
        vehicleCatalogRequest.current = null;
      }
    };
  }, []);

  const vehicle: VehicleSelection = {
    brand: vehicleSelections[0]?.label ?? "",
    model: vehicleSelections[1]?.label ?? "",
    body: vehicleSelections[2]?.label ?? "",
    year: vehicleSelections[3]?.label ?? "",
    generationId: vehicleSelections[3]?.value ?? "",
    engine: vehicleSelections[4]?.label ?? "",
    power: vehicleSelections[5]?.label ?? "",
  };
  const selectedBrand = vehicleSelections[0]?.label ?? "";
  const selectedModel = vehicleSelections[1]?.label ?? "";
  const selectedBody = vehicleSelections[2]?.label ?? "";
  const selectedYear = vehicleSelections[3]?.label ?? "";
  const selectedEngine = vehicleSelections[4]?.label ?? "";
  const selectedPower = vehicleSelections[5]?.label ?? "";
  const hasVehicleFilter = Boolean(selectedBrand.trim());
  const vehicleReady = vehicleSelections.every(Boolean);
  const availableCategories = Array.from(
    new Set([
      ...featuredCategories.map((category) => category.filter),
      ...catalogCategories,
      ...Object.values(productCatalog).map((product) => product.category),
    ]),
  ).sort((left, right) => left.localeCompare(right, "tr"));
    // Dynamic, DB-connected category list with real product counts
  const allKnownCategories = Array.from(
    new Set([
      ...dynamicCategories.map((c) => c.name),
      ...products.map((p) => p.category),
    ])
  ).filter((name) => name && name.trim() !== "" && name !== "Tüm Parçalar");

  const vehicleFilteredProducts = hasVehicleFilter
    ? products.filter((product) => {
        const fitment = normalizeFitment(
          (product.fitment || "") + " " + (product.name || "") + " " + (product.brand || "")
        );
        const brandNorm = normalizeFitment(selectedBrand);
        if (!fitment.includes(brandNorm)) return false;

        if (selectedModel.trim()) {
          const modelNorm = normalizeFitment(selectedModel);
          if (!fitment.includes(modelNorm)) return false;
        }
        return true;
      })
    : products;

  const categoryList = allKnownCategories.map((name) => {
    const dynamic = dynamicCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    const count = vehicleFilteredProducts.filter((p) =>
      matchCategory(p.category, name)
    ).length;

    return {
      name,
      image: categoryImages[name] || dynamic?.image || getCategorySafeImage(name),
      description: dynamic?.description || `${name} yedek parçaları`,
      count,
    };
  });
  const vinIsValid = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoadingProducts(true);
    setProductsError("");
    const params = new URLSearchParams();
    if (submittedQuery) params.set("q", cleanPartNumber(submittedQuery));
// Client-side category filtering for instant responsive UI
    if (!hideCost) params.set("cost", "1");
    try {
      const response = await fetch(`/api/products?${params}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) {
        if (response.status === 403 && !hideCost) {
          setCanViewCost(false);
          setHideCost(true);
          throw new Error("Alış maliyeti yalnızca yönetici oturumunda görüntülenebilir.");
        }
        throw new Error(await getError(response));
      }
      const data = (await response.json()) as {
        products: Part[];
        categories: string[];
      };
      setCatalogCategories(data.categories);
      const completeCatalog =
        !params.has("q") && !params.has("category");
      setProductCatalog((current) =>
        completeCatalog
          ? Object.fromEntries(
              data.products.map((product) => [product.id, product]),
            )
          : {
              ...current,
              ...Object.fromEntries(
                data.products.map((product) => [product.id, product]),
              ),
            },
      );
      if (completeCatalog) setProductCatalogHydrated(true);
      setProducts(data.products);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setProductsError(
        error instanceof Error ? error.message : "Ürünler yüklenemedi.",
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [hideCost, submittedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void loadProducts(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadProducts]);

  useEffect(() => {
    let restoredCart: CartLine[] = [];
    let storageWarning = "";
    try {
      const saved = window.localStorage.getItem("markasi-cart");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const quantities = new Map<string, number>();
          for (const entry of parsed) {
            if (!entry || typeof entry !== "object") continue;
            const line = entry as Partial<CartLine>;
            if (
              typeof line.productId !== "string" ||
              !line.productId ||
              line.productId.length > 80 ||
              !Number.isInteger(line.quantity) ||
              !line.quantity ||
              line.quantity < 1
            ) {
              continue;
            }
            quantities.set(
              line.productId,
              Math.min(99, (quantities.get(line.productId) ?? 0) + line.quantity),
            );
          }
          restoredCart = Array.from(quantities, ([productId, quantity]) => ({
            productId,
            quantity,
          })).slice(0, 50);
        }
      }
    } catch {
      storageWarning =
        "Önceki sepet bu tarayıcıdan okunamadı; yeni sepetiniz kullanılabilir.";
    }
    const timer = window.setTimeout(() => {
      setCart(restoredCart);
      setCartHydrated(true);
      if (storageWarning) setCartStorageWarning(storageWarning);
    }, 0);
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await getError(response));
        return response.json();
      })
      .then((session: { admin: { email: string } | null }) => {
        setCanViewCost(Boolean(session.admin));
      })
      .catch(() => setCanViewCost(false));
    void fetch("/api/member/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await getError(response));
        return response.json() as Promise<{
          member: CheckoutProfile | null;
        }>;
      })
      .then((session) => setCheckoutProfile(session.member))
      .catch(() =>
        setMemberProfileWarning(
          "Üye profiliniz yüklenemedi. Teslimat bilgilerinizi elle girebilirsiniz.",
        ),
      );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      window.localStorage.setItem("markasi-cart", JSON.stringify(cart));
      window.setTimeout(() => setCartStorageWarning(""), 0);
    } catch {
      window.setTimeout(
        () =>
          setCartStorageWarning(
            "Sepet bu tarayıcıda saklanamadı; sayfayı kapatmadan siparişinizi tamamlayın.",
          ),
        0,
      );
    }
  }, [cart, cartHydrated]);

  useEffect(() => {
    let restoredFavorites: string[] = [];
    let storageWarning = "";
    try {
      const saved = window.localStorage.getItem("markasi-favorites");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          restoredFavorites = Array.from(
            new Set(
              parsed.filter(
                (id): id is string =>
                  typeof id === "string" && id.length > 0 && id.length <= 80,
              ),
            ),
          ).slice(0, 200);
        }
      }
    } catch {
      storageWarning =
        "Favoriler bu tarayıcıdan okunamadı; yeni favorileriniz kullanılabilir.";
    }
    const timer = window.setTimeout(() => {
      setFavorites(restoredFavorites);
      setFavoritesHydrated(true);
      if (storageWarning) setFavoritesStorageWarning(storageWarning);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!favoritesHydrated) return;
    try {
      window.localStorage.setItem(
        "markasi-favorites",
        JSON.stringify(favorites),
      );
      window.setTimeout(() => setFavoritesStorageWarning(""), 0);
    } catch {
      window.setTimeout(
        () =>
          setFavoritesStorageWarning(
            "Favoriler bu tarayıcıda saklanamadı; sayfayı kapatmadan görüntüleyebilirsiniz.",
          ),
        0,
      );
    }
  }, [favorites, favoritesHydrated]);

  const cartItems = cart.flatMap((line) => {
    const product = productCatalog[line.productId];
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const unavailableCartLines = productCatalogHydrated
    ? cart.filter((line) => !productCatalog[line.productId])
    : [];
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );
  const categoryFilteredProducts =
    selectedCategories.length === 0
      ? vehicleFilteredProducts
      : vehicleFilteredProducts.filter((product) =>
          selectedCategories.some((cat) => matchCategory(product.category, cat))
        );

  const displayedProducts = categoryFilteredProducts;
  const productPageCount = Math.ceil(displayedProducts.length / productsPerPage);
  const paginatedProducts = displayedProducts.slice(
    (currentProductPage - 1) * productsPerPage,
    currentProductPage * productsPerPage,
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
    setCurrentProductPage(1);
    scrollToProducts();
  }

  function scrollToProducts() {
    document
      .getElementById("products-heading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectFeaturedCategory(category: string) {
    const vehicleCategories = ["Fren", "Debriyaj", "Filtreler", "Motor yağları", "Balatalar"];
    toggleCategory(category);
    setCurrentProductPage(1);
    setQuery("");
    setSubmittedQuery("");
    setShowFavoritesOnly(false);
    if (vehicleCategories.includes(category)) {
      window.requestAnimationFrame(() => {
        document
          .getElementById("vehicle-finder")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      window.requestAnimationFrame(scrollToProducts);
    }
  }

  async function decodeVin() {
    if (!vinIsValid) {
      setDecodedVin(null);
      setVinError("");
      setVinStatus("invalid");
      return;
    }

    setVinLoading(true);
    setVinError("");
    setDecodedVin(null);
    setVinStatus("idle");
    try {
      const response = await fetch("/api/vehicles/vin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin }),
      });
      if (!response.ok) throw new Error(await getError(response));
      const result = (await response.json()) as {
        vehicle: DecodedVin;
        source: string;
      };
      setDecodedVin(result.vehicle);
      setVinStatus("valid");
    } catch (error) {
      setVinError(
        error instanceof Error
          ? error.message
          : "VIN bilgisi çözümlenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setVinLoading(false);
    }
  }

  function resetVehicleSelection() {
    vehicleCatalogRequest.current?.abort();
    vehicleCatalogRequest.current = null;
    setVehicleSelections(Array.from({ length: 6 }, () => null));
    setVehicleOptions((current) =>
      current.map((options, index) => (index === 0 ? options : [])),
    );
    setLoadingVehicleStep(null);
    setVehicleCatalogError("");
    setCurrentProductPage(1);
  }

  function selectVehicleStep(index: number, value: string) {
    const selected =
      vehicleOptions[index]?.find((option) => option.value === value) ?? null;
    const nextSelections = Array.from({ length: 6 }, (_, step) =>
      step < index
        ? vehicleSelections[step]
        : step === index
          ? selected
          : null,
    );
    setVehicleSelections(nextSelections);
    setVehicleOptions((current) =>
      current.map((options, step) => (step > index ? [] : options)),
    );
    setCurrentProductPage(1);
    setVehicleCatalogError("");

    if (!selected || index === 5) {
      vehicleCatalogRequest.current?.abort();
      vehicleCatalogRequest.current = null;
      setLoadingVehicleStep(null);
      return;
    }

    const selectedValues = nextSelections
      .slice(0, index + 1)
      .map((option) => option?.value ?? "");
    void loadVehicleOptions(index + 2, selectedValues).then((options) => {
      if (!options) return;
      if (index === 0) {
        warmVehicleOptionBranches(
          3,
          options.map((model) => [...selectedValues, model.value]),
        );
      } else if (index === 1) {
        warmVehicleOptionBranches(
          4,
          options.map((body) => [...selectedValues, body.value]),
        );
      }
    });
  }

  function addToCart(product: Part, quantityToAdd: number = 1) {
    if (!product.canPurchase) return;
    setOrderNotice("");
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      const maximumQuantity = Math.min(product.centralStock ?? 99, 99);
      if (existing) {
        if (existing.quantity >= maximumQuantity) return current;
        const newQty = Math.min(existing.quantity + quantityToAdd, maximumQuantity);
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: newQty }
            : line,
        );
      }
      if (maximumQuantity < 1 || current.length >= 50) return current;
      const initialQty = Math.min(quantityToAdd, maximumQuantity);
      return [...current, { productId: product.id, quantity: initialQty }];
    });
    setCartOpen(true);
  }

  function changeQuantity(productId: string, quantity: number) {
    const product = productCatalog[productId];
    if (!product) return;
    if (quantity < 1) {
      setCart((current) => current.filter((line) => line.productId !== productId));
      return;
    }
    const maximumQuantity = Math.min(product.centralStock ?? 99, 99);
    if (quantity > maximumQuantity) return;
    setCart((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity }
          : line,
      ),
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrdering(true);
    setCheckoutError("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.get("customerName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          address: formData.get("address"),
          paymentMethod: formData.get("paymentMethod"),
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });
      if (!response.ok) throw new Error(await getError(response));
      const result = (await response.json()) as { orderId: string; total: number };
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setOrderNotice(
        `${result.orderId} numaralı siparişiniz alındı. Sipariş toplamı ${formatPrice(result.total)}.`,
      );
      await loadProducts();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Sipariş oluşturulamadı.",
      );
    } finally {
      setOrdering(false);
    }
  }

  function createWhatsAppLink(part?: Part) {
    const message = [
      "Merhaba Markasi Oto Yedek Parça, aşağıdaki parça için bilgi rica ediyorum.",
      part && `Ürün: ${part.name}`,
      part && `Parça markası: ${part.brand}`,
      part && `Parça kodu: ${part.code}`,
      part && `Kategori: ${part.category}`,
      !part && selectedCategories.length > 0 &&
        `Seçili kategoriler: ${selectedCategories.join(", ")}`,
      submittedQuery && `Arama / OEM kodu: ${submittedQuery}`,
      hasVehicleFilter &&
        `Araç: ${[selectedBrand, selectedModel, selectedBody, selectedYear, selectedEngine, selectedPower].filter(Boolean).join(" · ")}`,
      "Uyumluluk, stok ve fiyat bilgisi paylaşabilir misiniz?",
    ]
      .filter(Boolean)
      .join("\n");
    const activePhone = (cmsSettings.whatsapp_number || whatsappPhone).replace(/[^0-9]/g, "");
    return `https://wa.me/${activePhone}?text=${encodeURIComponent(message)}`;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-[#172a3d]">
      <div
        style={{
          backgroundColor: cmsSettings.top_announcement_bg || "#102b42",
          color: cmsSettings.top_announcement_text || "#ffffff",
        }}
        className="transition-colors border-b border-white/10"
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-2 text-xs sm:px-8">
          <p className="flex items-center gap-2 font-medium">
            <PackageCheck size={14} className="text-orange-400 shrink-0" />
            <span>{cmsSettings.top_announcement || "Saat 16:00'ya kadar verilen siparişler aynı gün kargoda!"}</span>
          </p>
          <div className="hidden items-center gap-5 sm:flex text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <ShieldCheck size={14} />
              {cmsSettings.badge_secure_payment || "Güvenli sipariş · Stoktan teslim"}
            </span>
            {cmsSettings.phone && (
              <a href={`tel:${cmsSettings.phone.replace(/[\s-]/g, "")}`} className="hover:text-white transition">
                📞 {cmsSettings.phone}
              </a>
            )}
            <a
              href="#destek"
              className="flex items-center gap-1 text-slate-300 transition hover:text-white"
            >
              <CircleHelp size={14} /> Yardım
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-nowrap items-center gap-2 px-3 py-3 sm:gap-4 sm:px-8 sm:py-4">
          <Link
            href="/"
            aria-label="Markasi Otomotiv ana sayfa"
            className="flex shrink-0 items-center"
          >
            {cmsSettings.header_logo && cmsSettings.header_logo !== "/markasi-logo.svg" ? (
              <img
                src={cmsSettings.header_logo}
                alt={cmsSettings.site_title || "Markasi Otomotiv"}
                className="h-10 max-w-[160px] object-contain sm:h-12 sm:max-w-[220px]"
              />
            ) : (
              <BrandLogo />
            )}
          </Link>

          <form
            onSubmit={submitSearch}
            className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 p-1 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100 sm:p-1.5 lg:mx-6"
          >
            <Search
              size={18}
              className="ml-1.5 hidden shrink-0 text-slate-400 sm:ml-3 sm:block"
            />
            <input
              aria-label="OEM veya parça kodu ara"
              value={query}
              onChange={(event) => {
                setQuery(cleanPartNumber(event.target.value));
              }}
              placeholder="OEM kodu"
              className="h-9 min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:h-10 sm:px-3 sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSubmittedQuery("");
                  setCurrentProductPage(1);
                  scrollToProducts();
                }}
                aria-label="Aramayı temizle"
                className="mr-2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            )}
            <button
              type="submit"
              aria-label="Parça ara"
              className="rounded-lg bg-[#f36b2b] px-2.5 py-2 text-xs font-bold text-white transition hover:bg-[#df5b20] sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden sm:inline">Ara</span>
              <Search size={15} className="sm:hidden" />
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-1 sm:ml-auto sm:gap-3">
            <Link
              href="/account"
              aria-label="Üye hesabı ve giriş"
              className="flex items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
            >
              <UserRound size={20} className="text-slate-600" />
              <span className="hidden text-xs font-semibold text-slate-700 sm:block">
                Hesabım
              </span>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Sepeti aç"
              className="relative rounded-xl p-2 text-slate-700 transition hover:bg-slate-50 sm:p-2.5"
            >
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f36b2b] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </header>

      {/* Hero Sliders / Campaign Banners */}
      {heroSliders.length > 0 && (
        <section className="bg-slate-900 overflow-hidden relative border-b border-slate-800">
          <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-8">
            <div className="relative overflow-hidden rounded-2xl min-h-[160px] sm:min-h-[220px] lg:min-h-[270px] flex items-center bg-slate-950">
              {heroSliders.map((slider, idx) => (
                <div
                  key={slider.id}
                  className={`absolute inset-0 transition-opacity duration-700 flex items-center ${
                    idx === activeSliderIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={slider.imageDesktop}
                    alt={slider.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />
                  <div className="relative z-20 max-w-xl p-6 sm:p-10">
                    <span className="inline-block rounded-full bg-orange-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
                      Kampanya
                    </span>
                    <h2 className="mt-2 text-xl font-black text-white sm:text-3xl lg:text-4xl">
                      {slider.title}
                    </h2>
                    {slider.subtitle && (
                      <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                        {slider.subtitle}
                      </p>
                    )}
                    {slider.linkUrl && (
                      <a
                        href={slider.linkUrl}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#df5b20] sm:text-sm"
                      >
                        {slider.buttonText || "Hemen İncele"} <ChevronRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {heroSliders.length > 1 && (
                <div className="absolute bottom-3 right-4 z-30 flex gap-1.5">
                  {heroSliders.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveSliderIndex(dotIdx)}
                      aria-label={`Slide ${dotIdx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        dotIdx === activeSliderIndex ? "w-6 bg-orange-500" : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Araç Seçim Sihirbazı (Marka, Model, Kasa, Yıl, Motor, Güç Seçimi) */}
      <section
        id="vehicle-finder"
        aria-labelledby="vehicle-finder-title"
        className="scroll-mt-32 bg-[linear-gradient(135deg,#edf4fa_0%,#f8fafc_48%,#e9f1f8_100%)] px-4 py-5 sm:px-8 sm:py-8 border-b border-slate-200/60"
      >
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_50px_-25px_rgba(16,43,66,0.25)]">
          <div className="p-5 sm:p-8 lg:p-9">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e65f26]">
                  <Wrench size={13} />
                  Markasi Otomotiv Araç Sihirbazı
                </div>
                <h1
                  id="vehicle-finder-title"
                  className="text-xl font-black tracking-tight text-[#172a3d] sm:text-2xl"
                >
                  Aracınıza Göre Parça Bulun
                </h1>
                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  Marka ve modelinizi seçin, sadece aracınıza %100 uyumlu parçalar anında listelensin.
                </p>
              </div>
              {hasVehicleFilter && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[280px]">
                    {[selectedBrand, selectedModel, selectedBody, selectedYear, selectedEngine, selectedPower].filter(Boolean).join(" · ")}
                  </span>
                  <button
                    type="button"
                    onClick={resetVehicleSelection}
                    className="ml-1 text-[11px] text-emerald-700 hover:text-red-600 underline font-semibold"
                  >
                    Temizle
                  </button>
                </div>
              )}
            </div>

            {/* 6 Aşamalı Araç Seçim Kutuları */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {vehicleStepLabels.map((label, index) => {
                const isLoading = loadingVehicleStep === index + 1;
                const isDisabled =
                  isLoading ||
                  (index > 0 && !vehicleSelections[index - 1]) ||
                  vehicleOptions[index].length === 0;

                return (
                  <label key={label} className="block">
                    <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-black ${
                            vehicleSelections[index]
                              ? "bg-emerald-600 text-white"
                              : "bg-[#102b42] text-white"
                          }`}
                        >
                          {vehicleSelections[index] ? "✓" : index + 1}
                        </span>
                        {label}
                      </span>
                      {vehicleSelections[index] && (
                        <span className="text-[10px] text-emerald-600 font-bold">Seçildi</span>
                      )}
                    </span>
                    <div className="relative">
                      <select
                        value={vehicleSelections[index]?.value ?? ""}
                        onChange={(event) =>
                          selectVehicleStep(index, event.target.value)
                        }
                        disabled={isDisabled}
                        className={`h-11 w-full appearance-none rounded-xl border bg-white px-3 pr-8 text-xs font-semibold text-slate-800 outline-none transition ${
                          vehicleSelections[index]
                            ? "border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-300"
                            : "border-slate-200 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                      >
                        <option value="">
                          {isLoading
                            ? `${label} yükleniyor…`
                            : vehicleOptions[index].length === 0 && index > 0 && !vehicleSelections[index - 1]
                            ? `Önce ${vehicleStepLabels[index - 1]} seçin`
                            : `${label} seçin`}
                        </option>
                        {vehicleOptions[index].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </label>
                );
              })}
            </div>

            {vehicleCatalogError && (
              <div
                role="alert"
                className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
              >
                <span>{vehicleCatalogError}</span>
                <button
                  type="button"
                  onClick={() =>
                    void loadVehicleOptions(
                      vehicleSelections.findIndex((selection) => !selection) + 1,
                      vehicleSelections
                        .filter(
                          (selection): selection is SourceVehicleOption =>
                            selection !== null,
                        )
                        .map((selection) => selection.value),
                    )
                  }
                  className="font-bold underline underline-offset-2"
                >
                  Tekrar dene
                </button>
              </div>
            )}

            {/* Alt İşlem Butonları */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {hasVehicleFilter ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Check size={15} />
                    Seçilen araca göre filtreleme aktif ({vehicleFilteredProducts.length} parça)
                  </span>
                ) : (
                  <span>
                    {vehicleOptions[0].length
                      ? `${vehicleOptions[0].length} araç markası hazır`
                      : "Araç seçenekleri yükleniyor…"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasVehicleFilter && (
                  <button
                    type="button"
                    onClick={resetVehicleSelection}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
                  >
                    Seçimi Sıfırla
                  </button>
                )}
                <button
                  type="button"
                  disabled={!hasVehicleFilter}
                  onClick={scrollToProducts}
                  className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#f36b2b] px-6 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#df5b20] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Seçilen Araca Göre Parça Bul
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Şasi Numarası (VIN) İle Arama Açılır Bölümü */}
            <details className="mt-4 border-t border-slate-100 pt-3">
              <summary className="cursor-pointer list-none text-xs font-bold text-slate-600 marker:hidden hover:text-[#e65f26] flex items-center gap-2">
                <Search size={14} className="text-slate-400" />
                <span>Şasi numarasıyla (VIN) araç bul ve doğrula</span>
                <span className="text-[10px] font-normal text-slate-400">(17 haneli)</span>
              </summary>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                      <input
                        id="vin-input"
                        value={vin}
                        maxLength={17}
                        onChange={(event) => {
                          setVin(
                            event.target.value
                              .replace(/[^a-z0-9]/gi, "")
                              .toUpperCase(),
                          );
                          setVinStatus("idle");
                          setDecodedVin(null);
                          setVinError("");
                        }}
                        placeholder="Örn. WVWZZZ1KZAW000001"
                        className="min-w-0 flex-1 bg-transparent text-xs uppercase tracking-[0.12em] text-slate-700 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
                      />
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {vin.length}/17
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void decodeVin()}
                  disabled={vinLoading || vin.length !== 17}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {vinLoading ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      Sorgulanıyor
                    </>
                  ) : (
                    <>
                      VIN ile Çözümle <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

              {vinStatus !== "idle" && (
                <p
                  role="status"
                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                    vinStatus === "valid" ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {vinStatus === "valid" ? (
                    <>
                      <Check size={14} /> VIN doğrulandı; araç bilgileri aşağıda.
                    </>
                  ) : (
                    <>
                      <CircleHelp size={14} /> Şasi numarası 17 karakter olmalı; I, O ve Q harfleri kullanılamaz.
                    </>
                  )}
                </p>
              )}
              {vinError && (
                <p
                  role="alert"
                  className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                >
                  {vinError}
                </p>
              )}
              {decodedVin && (
                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#172a3d]">
                      {[decodedVin.modelYear, decodedVin.make, decodedVin.model]
                        .filter(Boolean)
                        .join(" ")}
                    </h3>
                    <span className="text-[10px] font-semibold text-sky-800">
                      NHTSA vPIC araç çözümleme
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-3">
                    {[
                      ["Donanım / Seri", decodedVin.trim],
                      ["Kasa Tipi", decodedVin.bodyClass],
                      [
                        "Motor",
                        [
                          decodedVin.engineModel,
                          decodedVin.displacementL && `${decodedVin.displacementL} L`,
                          decodedVin.engineCylinders && `${decodedVin.engineCylinders} silindir`,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      ],
                      [
                        "Güç",
                        [
                          decodedVin.engineHP && `${decodedVin.engineHP} HP`,
                          decodedVin.engineKW && `${decodedVin.engineKW} kW`,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      ],
                      ["Yakıt", decodedVin.fuelType],
                      ["Üretim Ülkesi", decodedVin.plantCountry],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt className="font-semibold text-slate-500">{label}</dt>
                          <dd className="mt-0.5 font-bold text-slate-800">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              )}
            </details>
          </div>
        </div>
      </section>


      <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-5 sm:px-8 sm:pt-8">
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="scroll-mt-40 sr-only">
            Ürün listesi
          </h2>

          {/* Seçilen Araç Bilgilendirme Kartı */}
          {hasVehicleFilter && (
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Check size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    Seçili Araç ile Uyumlu Parçalar
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {[selectedBrand, selectedModel, selectedBody, selectedYear, selectedEngine, selectedPower].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={resetVehicleSelection}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
                >
                  Tüm Kataloğu Göster
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("vehicle-finder")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-xl bg-[#102b42] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1c405d]"
                >
                  Aracı Değiştir
                </button>
              </div>
            </div>
          )}

          {/* Resimli Parça Kategorileri Bölümü - Çoklu Seçim & Yeşil Işık Efekti */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Layers size={18} className="text-emerald-600" />
                <h3 className="text-sm sm:text-base font-black text-[#172a3d]">
                  Parça Kategorileri
                </h3>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 ml-1">
                    {selectedCategories.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-800 shadow-sm"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {c}
                        <button
                          type="button"
                          onClick={() => toggleCategory(c)}
                          className="ml-0.5 text-xs text-emerald-700 hover:text-emerald-950 font-bold"
                          title="Kategoriyi kaldır"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={clearCategoryFilter}
                  className="text-xs font-bold text-emerald-700 hover:underline hover:text-emerald-800"
                >
                  Tüm Kategorileri Göster ({vehicleFilteredProducts.length})
                </button>
              )}
            </div>

            {/* Yatay Kaydırılabilir Resimli Kategori Kartları */}
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
              {/* Tüm Parçalar Kartı */}
              <button
                type="button"
                onClick={clearCategoryFilter}
                className={`group relative flex min-w-[120px] sm:min-w-[135px] flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-300 ${
                  selectedCategories.length === 0
                    ? "border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500 ring-offset-2 shadow-[0_0_20px_rgba(16,185,129,0.38)] -translate-y-1"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Yeşil Işık Efekti (Tüm Parçalar aktifken) */}
                {selectedCategories.length === 0 && (
                  <span className="absolute top-2.5 right-2.5 flex size-3" title="Tüm Parçalar Aktif">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                  </span>
                )}
                <div
                  className={`grid size-14 place-items-center rounded-xl mb-2 transition ${
                    selectedCategories.length === 0
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                      : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                  }`}
                >
                  <Box size={24} />
                </div>
                <span className={`text-xs font-extrabold line-clamp-1 ${
                  selectedCategories.length === 0 ? "text-emerald-950 font-black" : "text-slate-800"
                }`}>
                  Tüm Parçalar
                </span>
                <span className="mt-0.5 text-[10px] font-bold text-slate-500">
                  {vehicleFilteredProducts.length} parça
                </span>
              </button>

              {/* Resimli Çoklu Seçilebilir Kategori Kartları */}
              {categoryList.map((cat) => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`group relative flex min-w-[120px] sm:min-w-[135px] flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-300 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500 ring-offset-2 shadow-[0_0_20px_rgba(16,185,129,0.38)] -translate-y-1"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Yeşil Işık Efekti (Seçildiğinde yanan yeşil LED ışık) */}
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex size-3" title="Seçili Kategori">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                      </span>
                    )}

                    <div className={`relative size-14 overflow-hidden rounded-xl mb-2 border flex items-center justify-center p-1.5 transition ${
                      isSelected
                        ? "border-emerald-300 bg-white shadow-inner"
                        : "border-slate-100 bg-slate-50"
                    }`}>
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="size-full object-contain transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = getCategorySafeImage(cat.name);
                          }
                        }}
                      />
                    </div>
                    <span className={`text-xs font-extrabold line-clamp-1 ${
                      isSelected ? "text-emerald-950 font-black" : "text-slate-800"
                    }`}>
                      {cat.name}
                    </span>
                    <span className={`mt-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "text-emerald-700"
                        : cat.count > 0 ? "text-slate-500" : "text-slate-400"
                    }`}>
                      {cat.count} parça
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sonuç Sayacı */}
          <div className="mt-2 mb-3 flex items-center justify-between text-xs text-slate-500">
            <p>
              {submittedQuery ? (
                <>
                  <strong className="text-slate-700">{submittedQuery}</strong> için{" "}
                  <span className="font-bold text-slate-800">{displayedProducts.length}</span> sonuç
                </>
              ) : (
                <>
                  Toplam <span className="font-bold text-slate-800">{displayedProducts.length}</span> uyumlu parça listeleniyor
                  {selectedCategories.length > 0 && (
                    <span className="ml-1.5 font-semibold text-emerald-700">
                      (Filtrelenen: {selectedCategories.join(", ")})
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="mt-2 mb-3 flex items-center justify-between text-xs text-slate-500">
            <p>
              {submittedQuery ? (
                <>
                  <strong className="text-slate-700">{submittedQuery}</strong> için{" "}
                  <span className="font-bold text-slate-800">{displayedProducts.length}</span> sonuç
                </>
              ) : (
                <>
                  Toplam <span className="font-bold text-slate-800">{displayedProducts.length}</span> uyumlu parça listeleniyor
                  {selectedCategories.length > 0 && (
                    <span className="ml-1.5 font-semibold text-emerald-700">(Filtrelenen: {selectedCategories.join(", ")})</span>
                  )}
                </>
              )}
            </p>
          </div>

          {cartStorageWarning && (
            <p
              role="status"
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800"
            >
              {cartStorageWarning}
            </p>
          )}



          {orderNotice && (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              <span className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0" />
                {orderNotice}
              </span>
              <button
                aria-label="Bildirimi kapat"
                onClick={() => setOrderNotice("")}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {productsError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-rose-800">
                Ürünler yüklenemedi
              </p>
              <p className="mt-1 text-xs text-rose-700">{productsError}</p>
              <button
                onClick={() => void loadProducts()}
                className="mt-3 text-xs font-bold text-rose-800 underline"
              >
                Yeniden dene
              </button>
            </div>
          ) : loadingProducts && products.length === 0 ? (
            <div className="mt-4 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <LoaderCircle className="animate-spin text-[#f36b2b]" />
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {paginatedProducts.map((part) => {
                const inCart =
                  cart.find((line) => line.productId === part.id)?.quantity ?? 0;
                
                return (
                  <article
                    key={part.id}
                    onClick={() => {
                      setSelectedProduct(part);
                      setActiveModalImageIndex(0);
                      setModalQuantity(1);
                    }}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex gap-4">
                        <div
                          className={`grid size-[76px] shrink-0 place-items-center overflow-hidden rounded-2xl ${
                            part.kind === "OEM"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {part.image ? (
                            <img
                              src={part.image}
                              alt={part.name}
                              className="size-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                const fallback = parent?.querySelector(".fallback-box-icon");
                                if (fallback) (fallback as HTMLElement).style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div className={`fallback-box-icon size-full flex items-center justify-center ${part.image ? "hidden" : ""}`}>
                            <Box size={34} strokeWidth={1.5} />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                              {part.brand}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                part.kind === "OEM"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {part.kind === "OEM"
                                ? "ORİJİNAL · OEM"
                                : "EŞDEĞER MUADİL"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                (part.centralStock ?? 0) > 5
                                  ? "bg-emerald-50 text-emerald-700"
                                  : (part.centralStock ?? 0) > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {(part.centralStock ?? 0) > 5
                                ? "Stokta"
                                : (part.centralStock ?? 0) > 0
                                ? `Son ${part.centralStock} adet`
                                : "Tükendi"}
                            </span>
                          </div>
                          <h3 className="mt-1 text-sm font-extrabold text-[#172a3d] transition group-hover:text-[#f36b2b] sm:text-base">
                            {part.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Parça kodu:{" "}
                            <span className="font-bold text-slate-700">
                              {part.code}
                            </span>
                          </p>
                          {part.fitment && (
                            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                              <Check size={12} className="text-emerald-600" />
                              {part.fitment}
                            </p>
                          )}
                        </div>
                        
                      </div>

                      

                      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[10px] font-medium text-slate-400">
                            Satış fiyatı
                          </p>
                          <p className="mt-0.5 text-xl font-black tracking-tight text-[#172a3d]">
                            {formatPrice(part.price)}
                          </p>
                          {!hideCost && canViewCost && part.cost !== undefined && (
                            <p className="mt-1 text-[10px] font-medium text-slate-500">
                              Alış maliyeti:{" "}
                              <span className="font-bold text-slate-700">
                                {formatPrice(part.cost)}
                              </span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(part);
                            setCartAnimationId(part.id);
                            window.setTimeout(() => setCartAnimationId(null), 600);
                          }}
                          disabled={
                            inCart >= Math.min(part.centralStock ?? 99, 99) ||
                            !part.canPurchase ||
                            (!inCart && cart.length >= 50)
                          }
                          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-sm shadow-orange-200 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${
                            cartAnimationId === part.id
                              ? "bg-emerald-600 scale-110"
                              : "bg-[#f36b2b] hover:bg-[#df5b20]"
                          }`}
                        >
                          <ShoppingCart size={15} />
                          {!part.canPurchase ||
                          inCart >= Math.min(part.centralStock ?? 99, 99)
                            ? "Stokta yok"
                            : inCart >= 99
                              ? "99 adet sınırı"
                              : !inCart && cart.length >= 50
                                ? "Sepet sınırı"
                                : inCart
                                  ? `Sepette · ${inCart}`
                                  : "Sepete ekle"}
                        </button>
                      </div>
                      <a
                        href={createWhatsAppLink(part)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${part.name} hakkında ustaya WhatsApp'tan sor`}
                        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        <MessageCircle size={16} />
                        Ustaya WhatsApp&apos;tan sor
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            {bottomBanners.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6">
                {bottomBanners.map((banner) => (
                  <div key={banner.id} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{banner.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">{banner.subtitle}</p>
                    </div>
                    {banner.imageDesktop && (
                      <img src={banner.imageDesktop} alt={banner.title} className="h-24 w-auto rounded-2xl object-cover" />
                    )}
                    <a
                      href={banner.linkUrl || "#products-heading"}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#f36b2b] px-5 text-xs font-bold text-white hover:bg-[#df5b20]"
                    >
                      {banner.buttonText || "İncele"}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {productPageCount > 1 && (
              <nav
                aria-label="Ürün sayfaları"
                className="mt-6 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentProductPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentProductPage === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Önceki
                </button>
                {Array.from({ length: productPageCount }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      aria-label={`${page}. sayfa`}
                      aria-current={currentProductPage === page ? "page" : undefined}
                      onClick={() => setCurrentProductPage(page)}
                      className={`grid size-9 place-items-center rounded-lg border text-xs font-bold transition ${
                        currentProductPage === page
                          ? "border-[#102b42] bg-[#102b42] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentProductPage((page) =>
                      Math.min(productPageCount, page + 1),
                    )
                  }
                  disabled={currentProductPage === productPageCount}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sonraki
                </button>
              </nav>
            )}
            </>
          ) : loadingProducts ? (
            <div className="mt-4 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <LoaderCircle className="animate-spin text-[#f36b2b]" />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
              <Search size={25} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                {vehicleReady
                  ? `${vehicle.year} ${vehicle.brand} ${vehicle.model} için bu kategoride eşleşen parça bulunamadı. Lütfen diğer kategorileri inceleyin veya ustanıza danışın.`
                  : "Bu aramayla eşleşen parça bulunamadı"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                OEM numarasını veya kategori seçimini kontrol edip tekrar deneyin.
              </p>
              <button
                onClick={() => {
                  setCurrentProductPage(1);
                  setQuery("");
                  setSubmittedQuery("");
                  setSelectedCategories([]);
                  setShowFavoritesOnly(false);
                  resetVehicleSelection();
                }}
                className="mt-4 text-xs font-bold text-[#e65f26] hover:underline"
              >
                Tüm seçim ve arama filtrelerini temizle
              </button>
            </div>
          )}

        </section>

        {/* Sayfa Altı Güven ve Hizmet Rozetleri */}
        <section className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <div className="flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-[#f36b2b]">
                <Truck size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-800">
                  {cmsSettings.badge_same_day || "Aynı Gün Kargo"}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">16:00 öncesi siparişlerde</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-800">
                  {cmsSettings.badge_original || "%100 Orijinal & Faturalı Parça"}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Faturalı &amp; garantili ürün</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                <PackageCheck size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-800">
                  {cmsSettings.badge_secure_payment || "256-bit SSL Güvenli Alışveriş"}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">256-bit SSL koruması</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ArrowDownUp size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-800">
                  {cmsSettings.badge_easy_return || "14 Gün Koşulsuz Kolay İade"}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Koşulsuz iade hakkı</p>
              </div>
            </div>
          </div>
        </section>

                <footer className="mt-12 border-t border-slate-200 pt-10 text-sm text-slate-600">
          <div className="grid gap-8 pb-8 md:grid-cols-4">
            <section className="space-y-3">
              <h2 className="text-base font-black text-[#172a3d]">
                {cmsSettings.company_name || "Markasi Otomotiv Sanayi ve Ticaret A.Ş."}
              </h2>
              <p className="text-xs leading-relaxed text-slate-500">
                {cmsSettings.site_slogan || "Volkswagen, Audi, Mercedes, BMW, Opel, Peugeot ve Citroën gibi Avrupa grubu araçların perakende yedek parça satışı."}
              </p>
              {cmsSettings.tax_office && cmsSettings.tax_number && (
                <p className="text-[11px] text-slate-400">
                  Vergi Dairesi: {cmsSettings.tax_office} · No: {cmsSettings.tax_number}
                </p>
              )}
              {cmsSettings.working_hours && (
                <p className="text-[11px] font-medium text-slate-500">
                  🕒 {cmsSettings.working_hours}
                </p>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#172a3d]">
                Kurumsal & Sözleşmeler
              </h2>
              <ul className="space-y-1.5 text-xs">
                {cmsPages.length > 0 ? (
                  cmsPages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        href={`/sayfa/${page.slug}`}
                        className="transition hover:text-[#e65f26]"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link href="/sayfa/hakkimizda" className="transition hover:text-[#e65f26]">
                        Hakkımızda
                      </Link>
                    </li>
                    <li>
                      <Link href="/sayfa/iade-ve-degisim-kosullari" className="transition hover:text-[#e65f26]">
                        İade ve Değişim Koşulları
                      </Link>
                    </li>
                    <li>
                      <Link href="/sayfa/mesafeli-satis-sozlesmesi" className="transition hover:text-[#e65f26]">
                        Mesafeli Satış Sözleşmesi
                      </Link>
                    </li>
                    <li>
                      <Link href="/sayfa/gizlilik-sozlesmesi" className="transition hover:text-[#e65f26]">
                        Gizlilik ve Güvenlik
                      </Link>
                    </li>
                    <li>
                      <Link href="/sayfa/kargo-ve-teslimat" className="transition hover:text-[#e65f26]">
                        Kargo ve Teslimat
                      </Link>
                    </li>
                    <li>
                      <Link href="/sayfa/banka-hesaplarimiz" className="transition hover:text-[#e65f26]">
                        Banka Hesap Numaraları
                      </Link>
                    </li>
                    <li>
                      <Link href="/sayfa/sss" className="transition hover:text-[#e65f26]">
                        Sıkça Sorulan Sorular (SSS)
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#172a3d]">
                İletişim & Adres
              </h2>
              <div className="flex items-start gap-2 text-xs leading-5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#f36b2b]" />
                <span>
                  {cmsSettings.address || "Yeni Sanayi Sitesi, Mehmet Nuri Arıkan Cd. No:22, Dulkadiroğlu / Kahramanmaraş"}
                </span>
              </div>
              {cmsSettings.phone && (
                <a
                  href={`tel:${cmsSettings.phone.replace(/[\s-]/g, "")}`}
                  className="flex items-center gap-2 text-xs font-semibold transition hover:text-[#e65f26]"
                >
                  <UserRound size={14} className="text-[#f36b2b]" />
                  {cmsSettings.phone}
                </a>
              )}
              {cmsSettings.mobile_phone && (
                <a
                  href={`tel:${cmsSettings.mobile_phone.replace(/[\s-]/g, "")}`}
                  className="flex items-center gap-2 text-xs font-semibold transition hover:text-[#e65f26]"
                >
                  <UserRound size={14} className="text-emerald-600" />
                  {cmsSettings.mobile_phone}
                </a>
              )}
              {cmsSettings.email && (
                <a
                  href={`mailto:${cmsSettings.email}`}
                  className="block text-xs text-slate-500 hover:text-slate-800"
                >
                  ✉️ {cmsSettings.email}
                </a>
              )}
              {cmsSettings.google_maps_embed && (
                <a
                  href={cmsSettings.google_maps_embed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-xs font-bold text-[#e65f26] underline underline-offset-2"
                >
                  Haritada Göster ↗
                </a>
              )}
            </section>

            <section className="flex flex-col items-start space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#172a3d]">
                Parça ve Destek Hattı
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                Aracınıza uygun parçayı ruhsat veya şasi numaranızla usta ekibimize danışın.
              </p>
              <a
                href={createWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                <MessageCircle size={16} />
                Ustaya WhatsApp&apos;tan Sor
              </a>
              <div className="pt-2 text-xs text-slate-400">
                {cmsSettings.site_title || "Markasi Otomotiv"} © 2026
              </div>
            </section>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 py-4 text-[11px] text-slate-500 sm:flex-row sm:items-center">
            <p>{cmsSettings.company_name || "Markasi Otomotiv"} · Güvenilir parça, doğru adres.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/sayfa/kargo-ve-teslimat" className="hover:text-slate-800">
                Teslimat ve İade
              </Link>
              <Link href="/sayfa/gizlilik-sozlesmesi" className="hover:text-slate-800">
                Gizlilik Sözleşmesi
              </Link>
              <Link href="/sayfa/mesafeli-satis-sozlesmesi" className="hover:text-slate-800">
                Mesafeli Satış
              </Link>
              <Link href="/admin" className="font-semibold text-slate-700 hover:text-orange-600">
                Yönetim Paneli
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button
            aria-label="Sepeti kapat"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="cart-title" className="text-base font-black">
                  Alışveriş sepeti
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {cartCount} ürün
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Sepeti kapat"
                className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart size={30} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-bold">Sepetiniz boş</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ürün kartlarından sepetinize parça ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400">
                          {product.brand} · {product.code}
                        </p>
                        <p className="mt-1 text-sm font-bold">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatPrice(product.price)} / adet
                        </p>
                        <div className="mt-3 inline-flex h-8 items-center rounded-lg border border-slate-200">
                          <button
                            aria-label="Adedi azalt"
                            onClick={() => changeQuantity(product.id, quantity - 1)}
                            className="grid h-full w-8 place-items-center text-slate-600 hover:bg-slate-50"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold">
                            {quantity}
                          </span>
                          <button
                            aria-label="Adedi artır"
                            onClick={() => changeQuantity(product.id, quantity + 1)}
                            disabled={
                              quantity >= Math.min(product.centralStock ?? 99, 99)
                            }
                            className="grid h-full w-8 place-items-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <strong className="shrink-0 text-sm">
                        {formatPrice(product.price * quantity)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {unavailableCartLines.map((line) => (
              <div
                key={line.productId}
                role="status"
                className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
              >
                <Box size={19} className="shrink-0 text-amber-700" />
                <p className="min-w-0 flex-1 text-xs leading-5 text-amber-900">
                  Sepetteki bir ürün artık katalogda bulunmuyor.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setCart((current) =>
                      current.filter(
                        (item) => item.productId !== line.productId,
                      ),
                    )
                  }
                  className="shrink-0 text-[11px] font-bold text-amber-900 underline"
                >
                  Sepetten çıkar
                </button>
              </div>
            ))}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-5">
                <div className="flex justify-between text-sm font-bold">
                  <span>Ürünler toplamı</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Kargo ve teslimat bilgileri sipariş sırasında teyit edilir.
                </p>
                <button
                  onClick={() => {
                    setCheckoutError("");
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f36b2b] text-sm font-bold text-white hover:bg-[#df5b20]"
                >
                  Siparişi tamamla <ArrowRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#e65f26]">
                  Sipariş bilgileri
                </p>
                <h2 id="checkout-title" className="mt-1 text-xl font-black">
                  Teslimat adresi
                </h2>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                aria-label="Ödeme ekranını kapat"
                className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form
              key={checkoutProfile?.id ?? "guest"}
              onSubmit={submitOrder}
              className="mt-5 space-y-3.5"
            >
              <CheckoutField label="Ad soyad">
                <input
                  required
                  name="customerName"
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  defaultValue={checkoutProfile?.name ?? ""}
                  className={checkoutInput}
                />
              </CheckoutField>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckoutField label="E-posta">
                  <input
                    required
                    type="email"
                    name="email"
                    maxLength={160}
                    autoComplete="email"
                    defaultValue={checkoutProfile?.email ?? ""}
                    className={checkoutInput}
                  />
                </CheckoutField>
                <CheckoutField label="Telefon">
                  <input
                    required
                    type="tel"
                    name="phone"
                    minLength={10}
                    maxLength={30}
                    autoComplete="tel"
                    defaultValue={checkoutProfile?.phone ?? ""}
                    className={checkoutInput}
                  />
                </CheckoutField>
              </div>
              <CheckoutField label="Teslimat adresi">
                <textarea
                  required
                  name="address"
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  autoComplete="street-address"
                  defaultValue={
                    checkoutProfile
                      ? [
                          checkoutProfile.addressLine,
                          checkoutProfile.district,
                          checkoutProfile.city,
                          checkoutProfile.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : ""
                  }
                  className={`${checkoutInput} h-auto py-2.5`}
                />
              </CheckoutField>
              <CheckoutField label="Ödeme yöntemi">
                <select
                  name="paymentMethod"
                  className={checkoutInput}
                  defaultValue="Kapıda ödeme"
                >
                  <option>Kapıda ödeme</option>
                  <option>Havale / EFT</option>
                </select>
              </CheckoutField>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold">
                <span>Sipariş toplamı</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <p className="text-[10px] leading-4 text-slate-400">
                Siparişiniz oluşturulduğunda merkez depo stoğu ayrılır. Ödeme
                tahsilatı ve kargo entegrasyonu henüz etkin değildir.
              </p>
              {memberProfileWarning && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  {memberProfileWarning}
                </p>
              )}
              {checkoutError && (
                <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {checkoutError}
                </p>
              )}
              <button
                disabled={ordering || cartItems.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#102b42] text-sm font-bold text-white hover:bg-[#1c405d] disabled:opacity-60"
              >
                {ordering && <LoaderCircle size={16} className="animate-spin" />}
                Siparişi oluştur
              </button>
            </form>
          </section>
        </div>
      )}


      {/* Ürün Detay Penceresi (Modal) */}
      {selectedProduct && (() => {
        const productImages: string[] = (
          selectedProduct.images && selectedProduct.images.length > 0
            ? selectedProduct.images
            : selectedProduct.image
            ? [selectedProduct.image]
            : []
        ).filter(Boolean);
        const inCart =
          cart.find((line) => line.productId === selectedProduct.id)?.quantity ?? 0;
        const maxStock = Math.min(selectedProduct.centralStock ?? 99, 99);
        const canAddMore =
          selectedProduct.canPurchase &&
          inCart < maxStock &&
          maxStock > 0;
        const activeImage =
          productImages.length > 0
            ? productImages[Math.min(activeModalImageIndex, productImages.length - 1)]
            : null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            {/* Arka plan tıklanınca kapat */}
            <div
              className="absolute inset-0 cursor-default"
              onClick={() => setSelectedProduct(null)}
              aria-label="Pencereyi kapat"
            />

            {/* Modal Kart Gövdesi */}
            <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
              {/* Sağ Üst Kırmızı Çarpı Kapatma Butonu */}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-200"
                aria-label="Kapat"
                title="Pencereyi Kapat (Esc)"
              >
                <X size={22} strokeWidth={2.5} />
              </button>

              {/* Kaydırılabilir İçerik */}
              <div className="overflow-y-auto p-5 sm:p-8 space-y-6">
                {/* Üst Kısım: Resimler ve Temel Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
                  
                  {/* Sol Kolon: Resim Galerisi */}
                  <div className="md:col-span-6 flex flex-col gap-3">
                    <div className="relative aspect-square w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-4 group">
                      {activeImage ? (
                        <img
                          src={activeImage}
                          alt={selectedProduct.name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".modal-fallback-box");
                            if (fallback) (fallback as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`modal-fallback-box size-full flex flex-col items-center justify-center text-slate-300 ${
                          activeImage ? "hidden" : "flex"
                        }`}
                      >
                        <Box size={72} strokeWidth={1.2} />
                        <span className="mt-2 text-xs font-semibold text-slate-400">Görsel Hazırlanıyor</span>
                      </div>

                      {/* Rozetler */}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm ${
                            selectedProduct.kind === "OEM"
                              ? "bg-sky-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {selectedProduct.kind === "OEM" ? "Orijinal OEM" : "Eşdeğer Muadil"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                            (selectedProduct.centralStock ?? 0) > 5
                              ? "bg-emerald-600 text-white"
                              : (selectedProduct.centralStock ?? 0) > 0
                              ? "bg-amber-500 text-white"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {(selectedProduct.centralStock ?? 0) > 5
                            ? "Stokta Var"
                            : (selectedProduct.centralStock ?? 0) > 0
                            ? `Son ${selectedProduct.centralStock} Adet`
                            : "Tükendi"}
                        </span>
                      </div>

                      {/* Görsel Navigasyon Okları */}
                      {productImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalImageIndex((prev) =>
                                prev > 0 ? prev - 1 : productImages.length - 1
                              );
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white"
                            aria-label="Önceki Görsel"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalImageIndex((prev) =>
                                prev < productImages.length - 1 ? prev + 1 : 0
                              );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white"
                            aria-label="Sonraki Görsel"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Küçük Resimler (Thumbnails) */}
                    {productImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {productImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveModalImageIndex(idx)}
                            className={`relative size-16 shrink-0 rounded-xl border-2 overflow-hidden bg-slate-50 transition p-1 ${
                              activeModalImageIndex === idx
                                ? "border-[#f36b2b] ring-2 ring-orange-200"
                                : "border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Küçük Resim ${idx + 1}`}
                              className="size-full object-contain"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sağ Kolon: Başlık, Kod, Fiyat, Butonlar */}
                  <div className="md:col-span-6 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-black uppercase tracking-wider text-[#f36b2b] bg-orange-50 px-2.5 py-1 rounded-lg">
                        {selectedProduct.brand}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {selectedProduct.category}
                      </span>
                    </div>

                    <h2
                      id="product-modal-title"
                      className="mt-3 text-xl sm:text-2xl font-black text-[#172a3d] leading-snug"
                    >
                      {selectedProduct.name}
                    </h2>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Parça Kodu / OEM:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {selectedProduct.code}
                      </span>
                      {selectedProduct.shelf && canViewCost && (
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Raf: {selectedProduct.shelf}
                        </span>
                      )}
                    </div>

                    {selectedProduct.fitment && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                        <Check size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="font-bold">Uyumlu Araç Bilgisi</p>
                          <p className="mt-0.5 text-emerald-800">{selectedProduct.fitment}</p>
                        </div>
                      </div>
                    )}

                    {/* Fiyat Alanı */}
                    <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tight text-[#172a3d]">
                          {formatPrice(selectedProduct.price)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          KDV Dahil
                        </span>
                      </div>
                      {!hideCost && canViewCost && selectedProduct.cost !== undefined && (
                        <p className="mt-1 text-xs text-slate-500">
                          Alış maliyeti:{" "}
                          <span className="font-bold text-slate-700">
                            {formatPrice(selectedProduct.cost)}
                          </span>
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                        <Truck size={14} /> Aynı gün kargo &amp; Merkez depodan hızlı teslimat
                      </p>
                    </div>

                    {/* Adet ve Sepete Ekle / WhatsApp Butonları */}
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Adet seçici */}
                        <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1">
                          <button
                            type="button"
                            onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                            disabled={modalQuantity <= 1}
                            className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
                            aria-label="Adet Azalt"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center text-sm font-black text-slate-800">
                            {modalQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalQuantity((q) =>
                                Math.min(maxStock > 0 ? maxStock : 1, q + 1)
                              )
                            }
                            disabled={modalQuantity >= maxStock}
                            className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
                            aria-label="Adet Arttır"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* Sepete Ekle Butonu */}
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(selectedProduct, modalQuantity);
                            setCartAnimationId(selectedProduct.id);
                            setSelectedProduct(null);
                          }}
                          disabled={!canAddMore}
                          className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f36b2b] px-5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-[#df5b20] active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                        >
                          <ShoppingCart size={18} />
                          {!selectedProduct.canPurchase || maxStock <= 0
                            ? "Stokta Yok"
                            : inCart >= maxStock
                            ? "Sepetinizde Zaten Var"
                            : modalQuantity > 1
                            ? `Sepete Ekle (${modalQuantity} Adet)`
                            : "Sepete Ekle"}
                        </button>
                      </div>

                      {/* Ustaya WhatsApp'tan Sorun Butonu */}
                      <a
                        href={createWhatsAppLink(selectedProduct)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99]"
                      >
                        <MessageCircle size={19} />
                        Ustaya WhatsApp&apos;tan Sorun
                      </a>
                    </div>

                    {/* Güven Rozetleri */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                      <div className="flex flex-col items-center gap-1 text-[11px] text-slate-600">
                        <ShieldCheck size={18} className="text-emerald-600" />
                        <span className="font-semibold">%100 Uyum</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-[11px] text-slate-600">
                        <Truck size={18} className="text-sky-600" />
                        <span className="font-semibold">Hızlı Kargo</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-[11px] text-slate-600">
                        <PackageCheck size={18} className="text-orange-600" />
                        <span className="font-semibold">14 Gün İade</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alt Kısım: Ürün Açıklaması ve Teknik Tablo */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="text-base font-black text-[#172a3d] flex items-center gap-2">
                    <Info size={18} className="text-[#f36b2b]" />
                    Ürün Açıklaması ve Özellikleri
                  </h3>
                  
                  {selectedProduct.description ? (
                    <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-slate-200/80">
                      {selectedProduct.description}
                    </div>
                  ) : null}

                  {/* Teknik Tablo */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <td className="w-1/3 p-3 font-bold text-slate-500">Ürün Adı</td>
                          <td className="p-3 font-semibold text-slate-800">{selectedProduct.name}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-3 font-bold text-slate-500">Marka</td>
                          <td className="p-3 font-semibold text-slate-800">{selectedProduct.brand}</td>
                        </tr>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-500">Parça / OEM Kodu</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{selectedProduct.code}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-3 font-bold text-slate-500">Parça Türü</td>
                          <td className="p-3 font-semibold text-slate-800">
                            {selectedProduct.kind === "OEM"
                              ? "Orijinal Ekipman Üreticisi (OEM Parça)"
                              : "Yüksek Kalite Eşdeğer Muadil Parça"}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-500">Kategori</td>
                          <td className="p-3 font-semibold text-slate-800">{selectedProduct.category}</td>
                        </tr>
                        {selectedProduct.fitment && (
                          <tr className="border-b border-slate-100">
                            <td className="p-3 font-bold text-slate-500">Uyumlu Araçlar</td>
                            <td className="p-3 font-semibold text-slate-800">{selectedProduct.fitment}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="p-3 font-bold text-slate-500">Garanti &amp; İade</td>
                          <td className="p-3 font-semibold text-emerald-700">
                            12 Ay Markasi Otomotiv Garantisi &amp; Koşulsuz 14 Gün İade
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="sr-only" aria-live="polite">
        {cartCount} ürün sepetinizde
      </div>
    </main>
  );
}

const checkoutInput =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function CheckoutField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      {children}
    </label>
  );
}
