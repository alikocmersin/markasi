"use client";

import {
  ArrowLeft,
  Check,
  LoaderCircle,
  LogOut,
  MapPin,
  ShieldCheck,
  Package,
  Clock,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";

type MemberProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  tcIdentity: string;
  addressLine: string;
  district: string;
  city: string;
  postalCode: string;
};

const errorMessages: Record<string, string> = {
  google_not_configured:
    "Google ile giriş henüz etkin değil. Google Cloud Console'dan aldığınız GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET değerlerini proje kökündeki .env.local dosyasına ekleyin. Yönlendirme adresi http://localhost:3000/api/auth/google/callback olmalı; ardından geliştirme sunucusunu yeniden başlatın. Ayrıntılar README.md içindeki Google üye girişi bölümünde.",
  google_unavailable:
    "Google girişi şu anda başlatılamıyor. Lütfen daha sonra tekrar deneyin.",
  google_account_conflict:
    "Bu e-posta başka bir Google hesabına bağlı. Hesap eşleştirme için destek alın.",
  google_cancelled: "Google girişi iptal edildi.",
  google_callback_failed:
    "Google girişi tamamlanamadı. Lütfen tekrar deneyin.",
};

async function responseError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `İşlem başarısız oldu (${response.status}).`;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const queryError = new URLSearchParams(window.location.search).get("error");
    if (queryError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    void fetch("/api/member/profile", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(await responseError(response));
        const data = (await response.json()) as { profile: MemberProfile };
        return data.profile;
      })
      .then((memberProfile) => {
        setProfile(memberProfile);
        if (memberProfile) {
          setLoadingOrders(true);
          fetch("/api/member/orders", { cache: "no-store" })
            .then((res) => (res.ok ? res.json() : { orders: [] }))
            .then((data) => setOrders(data.orders || []))
            .catch(() => {})
            .finally(() => setLoadingOrders(false));
        }
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Üye bilgileri yüklenemedi.",
        ),
      )
      .finally(() => {
        setLoading(false);
        if (queryError) {
          setError(
            errorMessages[queryError] ??
              (queryError.length <= 180
                ? queryError
                : "Google girişi tamamlanamadı. Lütfen tekrar deneyin."),
          );
        }
      });
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(formData.entries()),
        ),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const authentication = (await response.json()) as {
        redirectTo?: string;
      };
      if (authentication.redirectTo === "/admin") {
        router.push("/admin");
        return;
      }
      const refreshed = await fetch("/api/member/profile", {
        cache: "no-store",
      });
      if (!refreshed.ok) throw new Error(await responseError(refreshed));
      const data = (await refreshed.json()) as { profile: MemberProfile };
      setProfile(data.profile);
      setMessage("Üye bilgileriniz kaydedildi.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Üye bilgileri kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitAuthentication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/member/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authMode,
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const refreshed = await fetch("/api/member/profile", {
        cache: "no-store",
      });
      if (!refreshed.ok) throw new Error(await responseError(refreshed));
      const data = (await refreshed.json()) as { profile: MemberProfile };
      setProfile(data.profile);
      setMessage(
        authMode === "register"
          ? "Üyeliğiniz oluşturuldu. Teslimat adresinizi profilinize ekleyebilirsiniz."
          : "Hesabınıza giriş yaptınız.",
      );
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Üye işlemi tamamlanamadı.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      const response = await fetch("/api/member/session", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await responseError(response));
      setProfile(null);
      setMessage("Oturumunuz kapatıldı.");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Oturum kapatılamadı.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f6f9] px-4 py-8 text-[#172a3d] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={15} /> Mağazaya dön
        </Link>
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="bg-[#102b42] px-6 py-6 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo
                compact
                className="rounded-xl bg-white px-3 py-2"
              />
              <div>
                <h1 className="mt-1 text-xl font-black">
                  {profile ? "Üye bilgilerim" : "Üye hesabı"}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="grid min-h-48 place-items-center text-[#f36b2b]">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : profile ? (
              <>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm font-bold">{profile.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      İletişim ve teslimat bilgilerinizi istediğiniz zaman
                      düzenleyebilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <LogOut size={14} /> Çıkış yap
                  </button>
                </div>
                <div className="mt-6 flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                      activeTab === "profile"
                        ? "border-[#f36b2b] text-[#f36b2b]"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <MapPin size={15} />
                    Profil ve Adres
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                      activeTab === "orders"
                        ? "border-[#f36b2b] text-[#f36b2b]"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Package size={15} />
                    Siparişlerim (${orders.length})
                  </button>
                </div>

                {activeTab === "orders" ? (
                  <div className="mt-6 space-y-4">
                    {loadingOrders ? (
                      <div className="grid min-h-32 place-items-center text-[#f36b2b]">
                        <LoaderCircle className="animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <Package size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">Henüz siparişiniz bulunmuyor</p>
                        <p className="text-xs text-slate-400 mt-1">Verdiğiniz siparişler burada listelenecek ve kargo durumu anlık takip edilebilecektir.</p>
                        <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-4 py-2 text-xs font-bold text-white hover:bg-[#df5b20] transition">
                          Alışverişe Başla
                        </Link>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-xs font-black text-slate-900">Sipariş #{order.id}</span>
                              <span className="ml-2 text-[11px] text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-[#f36b2b]">
                              {order.status || "Yeni"}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700 line-clamp-1">{item.name} <span className="text-slate-400">({item.code})</span></span>
                                <span className="font-bold text-slate-900 shrink-0 ml-4">{item.quantity} adet · {item.unitPrice?.toLocaleString("tr-TR")} ₺</span>
                              </div>
                            ))}
                          </div>

                          {order.trackingCode && (
                            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 border border-slate-100">
                              <Truck size={14} className="text-[#f36b2b]" />
                              <span>{order.courierCompany || "Kargo"}: <strong className="font-mono text-slate-800">{order.trackingCode}</strong></span>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                            <span className="text-slate-500">Ödeme: {order.paymentMethod}</span>
                            <span className="text-base font-black text-[#f36b2b]">Toplam: {order.total?.toLocaleString("tr-TR")} ₺</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                <form onSubmit={saveProfile} className="mt-6 space-y-4">
                  <ProfileField label="Ad soyad">
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      defaultValue={profile.name}
                      className={inputStyle}
                    />
                  </ProfileField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField label="Telefon">
                      <input
                        name="phone"
                        type="tel"
                        maxLength={30}
                        autoComplete="tel"
                        defaultValue={profile.phone}
                        className={inputStyle}
                      />
                    </ProfileField>
                    <ProfileField label="T.C. kimlik numarası (isteğe bağlı)">
                      <input
                        name="tcIdentity"
                        inputMode="numeric"
                        autoComplete="off"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        defaultValue={profile.tcIdentity}
                        className={inputStyle}
                      />
                    </ProfileField>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                      <MapPin size={16} className="text-[#f36b2b]" />
                      Teslimat adresi
                    </h2>
                    <div className="mt-3 space-y-4">
                      <ProfileField label="Açık adres">
                        <textarea
                          name="addressLine"
                          maxLength={250}
                          rows={3}
                          autoComplete="street-address"
                          defaultValue={profile.addressLine}
                          className={`${inputStyle} h-auto py-2.5`}
                        />
                      </ProfileField>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <ProfileField label="İlçe">
                          <input
                            name="district"
                            maxLength={80}
                            autoComplete="address-level3"
                            defaultValue={profile.district}
                            className={inputStyle}
                          />
                        </ProfileField>
                        <ProfileField label="İl">
                          <input
                            name="city"
                            maxLength={80}
                            autoComplete="address-level1"
                            defaultValue={profile.city}
                            className={inputStyle}
                          />
                        </ProfileField>
                        <ProfileField label="Posta kodu">
                          <input
                            name="postalCode"
                            maxLength={12}
                            autoComplete="postal-code"
                            defaultValue={profile.postalCode}
                            className={inputStyle}
                          />
                        </ProfileField>
                      </div>
                    </div>
                  </div>
                  {error && <Notice tone="error">{error}</Notice>}
                  {message && <Notice tone="success">{message}</Notice>}
                  <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">
                    T.C. kimlik numaranız yalnızca gerekli olduğunda girilmelidir
                    ve veritabanında şifrelenerek saklanır. Kaydedilmiş
                    bilgileriniz bu hesapla sınırlıdır.
                  </div>
                  <button
                    disabled={saving}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f36b2b] text-sm font-bold text-white transition hover:bg-[#df5b20] disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Bilgilerimi kaydet
                  </button>
                </form>
                )}
              </>
            ) : (
              <div className="mx-auto max-w-md py-3 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-50 text-[#f36b2b]">
                  <ShieldCheck size={27} />
                </span>
                <h2 className="mt-4 text-lg font-black">
                  {authMode === "register"
                    ? "Yeni üyelik oluşturun"
                    : "Üye girişi"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {authMode === "register"
                    ? "İsim, soy isim, e-posta ve şifrenizle üye olun. Teslimat adresinizi daha sonra hesabınızdan ekleyebilirsiniz."
                    : "Kayıtlı e-posta adresiniz ve şifrenizle hesabınıza giriş yapın."}
                </p>
                <div
                  className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
                  role="tablist"
                  aria-label="Üye işlemi"
                >
                  {(["register", "login"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={authMode === mode}
                      onClick={() => {
                        setAuthMode(mode);
                        setError("");
                        setMessage("");
                      }}
                      className={`h-10 rounded-lg text-sm font-bold transition ${
                        authMode === mode
                          ? "bg-white text-[#172a3d] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {mode === "register" ? "Üye ol" : "Giriş yap"}
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="mt-5">
                    <Notice tone="error">{error}</Notice>
                  </div>
                )}
                {message && (
                  <div className="mt-5">
                    <Notice tone="success">{message}</Notice>
                  </div>
                )}
                <form
                  onSubmit={submitAuthentication}
                  className="mt-5 space-y-4 text-left"
                >
                  {authMode === "register" && (
                    <ProfileField label="İsim soyisim">
                      <input
                        name="name"
                        required
                        minLength={3}
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Adınız ve soyadınız"
                        className={inputStyle}
                      />
                    </ProfileField>
                  )}
                  <ProfileField label="E-posta">
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={160}
                      autoComplete="email"
                      placeholder="ornek@eposta.com"
                      className={inputStyle}
                    />
                  </ProfileField>
                  <ProfileField label="Şifre">
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete={
                        authMode === "register"
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder={
                        authMode === "register"
                          ? "En az 8 karakter"
                          : "Şifreniz"
                      }
                      className={inputStyle}
                    />
                  </ProfileField>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f36b2b] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#df5b20] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : null}
                    {authMode === "register" ? "Üyeliği oluştur" : "Giriş yap"}
                  </button>
                </form>
                <div className="my-5 flex items-center gap-3 text-[11px] font-medium text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  veya
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <a
                  href="/api/auth/google"
                  className="flex h-12 items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <GoogleMark />
                  Google ile devam et
                </a>
                {authMode === "register" && (
                  <p className="mt-4 text-[11px] leading-5 text-slate-400">
                    Teslimat adresi ve iletişim bilgilerinizi üye olduktan
                    sonra profilinizden ekleyebilirsiniz.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function ProfileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3.5 py-3 text-xs font-semibold ${
        tone === "error"
          ? "bg-rose-50 text-rose-700"
          : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {children}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 32 15.1l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32 15.1l5.7-5.7A20 20 0 0 0 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.8 28l-6.5 5A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2A20 20 0 0 0 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
    </svg>
  );
}
