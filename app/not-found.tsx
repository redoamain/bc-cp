// app/not-found.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const redirectTriggered = useRef(false);

  useEffect(() => {
    if (redirectTriggered.current) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;

        if (newCount <= 0 && !redirectTriggered.current) {
          redirectTriggered.current = true;
          setTimeout(() => {
            router.push("/");
          }, 0);
          return 0;
        }
        return newCount;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-lg w-full">
        {/* 404 Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header - Khusus 404 dengan warna kuning */}
          <div className="bg-linear-to-r from-yellow-500 to-orange-500 p-8 text-center">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-white mb-2">404</h1>
            <p className="text-xl text-white/90">Halaman Tidak Ditemukan</p>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Maaf, halaman yang Anda cari tidak ditemukan atau telah
                dipindahkan. Periksa kembali URL atau kembali ke beranda.
              </p>

              {/* Countdown Timer */}
              <div className="bg-gray-100 rounded-lg p-4 inline-block mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-yellow-600">
                      {countdown}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">Detik tersisa</p>
                    <p className="font-semibold text-gray-800">
                      Anda akan dialihkan ke beranda
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>

              <Button
                onClick={() => router.push("/")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Button>
            </div>

            {/* Contact Support */}
          
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-4">
          © {new Date().getFullYear()} PT. CITI PLUMB.
        </p>
      </div>
    </div>
  );
}
