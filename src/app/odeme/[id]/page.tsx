import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getDatabase, type PayLink } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PayLinkProps {
  params: Promise<{ id: string }>;
}

export default async function PayLinkPublicPage({ params }: PayLinkProps) {
  const { id } = await params;
  const payLink = getDatabase()
    .prepare("SELECT * FROM pay_links WHERE id = ?")
    .get(id) as PayLink | undefined;

  if (!payLink) {
    notFound();
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val / 100);

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-50 text-[#f36b2b]">
              <CreditCard size={28} />
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-slate-900">Özel Parça Ödeme Formu</h1>
            <p className="mt-1 text-xs text-slate-500">
              Bu bağlantı size özel yedek parça siparişi için oluşturulmuştur.
            </p>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Müşteri Adı:</span>
              <span className="font-bold text-slate-800">{payLink.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">İletişim:</span>
              <span className="font-bold text-slate-800">{payLink.phone}</span>
            </div>
            <div className="border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 block mb-1">Talep Edilen Parça:</span>
              <span className="font-semibold text-slate-800">{payLink.partDescription}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black text-slate-900">
              <span>Toplam Tutar:</span>
              <span className="text-lg text-[#f36b2b]">{formatPrice(payLink.amount)}</span>
            </div>
          </div>

          {payLink.status === "Ödendi" ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={18} />
              Bu ödeme tamamlanmıştır. Teşekkür ederiz!
            </div>
          ) : (
            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#f36b2b] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#df5b20]"
              >
                Kredi Kartı ile Güvenli Öde ({formatPrice(payLink.amount)})
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-slate-400">
                <ShieldCheck size={14} className="text-emerald-600" />
                256-Bit SSL ve 3D Secure ile Güvenli Ödeme
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

