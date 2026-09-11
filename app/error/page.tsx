// app/error/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Home,
  RefreshCw,
  ArrowLeft,
  Lock,
  Wrench,
  Ban,
  MessageCircle,
} from "lucide-react";

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  const errorCode = searchParams.get("code") || "500";

  if (errorCode === "404") {
    router.push("/not-found");
    return null;
  }

  const getErrorIcon = () => {
    switch (errorCode) {
      case "403":
        return <Lock className="w-6 h-6 text-amber-600" />;
      case "500":
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "503":
        return <Wrench className="w-6 h-6 text-blue-600" />;
      case "400":
        return <Ban className="w-6 h-6 text-orange-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  const getErrorMessage = () => {
    switch (errorCode) {
      case "403":
        return "Akses Ditolak";
      case "500":
        return "Kesalahan Server Internal";
      case "503":
        return "Layanan Dalam Pemeliharaan";
      case "400":
        return "Permintaan Tidak Valid";
      default:
        return "Terjadi Kendala Sistem";
    }
  };

  const getErrorDescription = () => {
    switch (errorCode) {
      case "403":
        return "Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator.";
      case "500":
        return "Terjadi kendala pada sistem backend. Silakan coba muat ulang atau hubungi tim IT.";
      case "503":
        return "Sistem sedang dalam proses pemeliharaan. Silakan coba kembali dalam beberapa saat.";
      case "400":
        return "Permintaan yang Anda kirim tidak dapat diproses. Silakan periksa kembali.";
      default:
        return "Terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between items-center px-4 py-12 text-slate-900">
      {/* Header Logo */}
      <div className="w-full max-w-md mx-auto text-center">
        <Link href="/" className="inline-block">
          <Image
            src="/img/citiplumb.jpg"
            alt="PT. CITI PLUMB Logo"
            width={52}
            height={52}
            className="mx-auto rounded-xl border border-slate-200 shadow-xs object-cover"
            priority
          />
        </Link>
      </div>

      {/* Main Error Content */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-5 border border-slate-200/60">
            {getErrorIcon()}
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
            Error {errorCode}
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3 mb-2">
            {getErrorMessage()}
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
            {getErrorDescription()}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-10 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Muat Ulang
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-10 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Kembali
            </Button>

            <Button
              asChild
              className="h-10 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Link href="/">
                <Home className="w-3.5 h-3.5 mr-1.5" />
                Beranda
              </Link>
            </Button>
          </div>

          {/* IT Support Contact */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Butuh bantuan teknis?</span>
            <button
              onClick={() => {
                const message = `Halo IT Support PT. CITI PLUMB, saya mengalami error ${errorCode} pada aplikasi.`;
                window.open(
                  `https://wa.me/62895327504234?text=${encodeURIComponent(message)}`,
                  "_blank",
                );
              }}
              className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Hubungi IT Support
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-2">
        © {currentYear} PT. CITI PLUMB. All rights reserved.
      </footer>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500 text-sm">Memuat...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
