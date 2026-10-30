import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getCmsPage, getSiteSettings } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getCmsPage(slug);
  const settings = getSiteSettings();

  if (!page || !page.active) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            Mağazaya Dön
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <ShieldCheck size={24} className="text-[#f36b2b]" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {page.title}
            </h1>
          </div>

          <div className="prose max-w-none text-sm leading-relaxed text-slate-600 sm:text-base whitespace-pre-line">
            {page.content}
          </div>

          <div className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-xs text-slate-500">
            <p className="font-bold text-slate-700">{settings.company_name || "Markasi Otomotiv"}</p>
            <p className="mt-1">{settings.address}</p>
            <p className="mt-1">
              Tel: {settings.phone} | E-posta: {settings.email}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

