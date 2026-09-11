// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Package, Camera, ArrowRight } from "lucide-react";

export default function Home() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Image
              src="/img/citiplumb.jpg"
              alt="PT. CITI PLUMB Logo"
              width={64}
              height={64}
              className="mx-auto rounded-xl border border-slate-200/80 shadow-xs object-cover"
              priority
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-4">
              PT. CITI PLUMB
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Portal Layanan Terintegrasi
            </p>
          </div>

          {/* Cards Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* IT Inventory */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push("/auth/login")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push("/auth/login");
                }
              }}
              className="group flex flex-col justify-between p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Package className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  IT Inventory
                </h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Manajemen persediaan barang, mutasi, dan pelaporan Bea Cukai.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Login Inventory</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>

            {/* CCTV System */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push("/api/cctv/login")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push("/api/cctv/login");
                }
              }}
              className="group flex flex-col justify-between p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4 border border-slate-200 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                  CCTV System
                </h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Monitoring kamera dan rekaman pengawasan area secara langsung.
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-slate-700 group-hover:translate-x-0.5 transition-transform">
                <span>Akses CCTV</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100">
        © {currentYear} PT. CITI PLUMB. All rights reserved.
      </footer>
    </div>
  );
}
