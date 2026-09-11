// app/not-found.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

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

      {/* Main 404 Content */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-5 border border-slate-200/60">
            <FileQuestion className="w-6 h-6" />
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            Error 404
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3 mb-2">
            Halaman Tidak Ditemukan
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-8">
            Halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau alamat URL yang dimasukkan salah.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
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
                Ke Halaman Utama
              </Link>
            </Button>
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
