// app/error/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Home,
  RefreshCw,
  ArrowLeft,
  Lock,
  Wrench,
  Ban,
} from "lucide-react";

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Langsung baca dari URL
  const errorCode = searchParams.get("code") || "500";

  // Jangan tampilkan 404 di sini
  if (errorCode === "404") {
    router.push("/404");
    return null;
  }

  // Fungsi untuk mendapatkan icon
  const getErrorIcon = () => {
    switch (errorCode) {
      case "403":
        return <Lock className="w-12 h-12 text-white" />;
      case "500":
        return <AlertTriangle className="w-12 h-12 text-white" />;
      case "503":
        return <Wrench className="w-12 h-12 text-white" />;
      case "400":
        return <Ban className="w-12 h-12 text-white" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-white" />;
    }
  };

  // Fungsi untuk mendapatkan pesan
  const getErrorMessage = () => {
    switch (errorCode) {
      case "403":
        return "Akses Ditolak";
      case "500":
        return "Kesalahan Server Internal";
      case "503":
        return "Layanan Tidak Tersedia";
      case "400":
        return "Permintaan Tidak Valid";
      default:
        return "Terjadi Kesalahan";
    }
  };

  // Fungsi untuk mendapatkan warna gradient
  const getGradientClass = () => {
    switch (errorCode) {
      case "403":
        return "bg-gradient-to-r from-red-600 to-red-500";
      case "500":
        return "bg-gradient-to-r from-red-600 to-pink-500";
      case "503":
        return "bg-gradient-to-r from-purple-600 to-purple-500";
      case "400":
        return "bg-gradient-to-r from-orange-600 to-red-500";
      default:
        return "bg-gradient-to-r from-red-600 to-red-500";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className={`${getGradientClass()} p-6 text-center`}>
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              {getErrorIcon()}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Error {errorCode}
            </h1>
            <p className="text-white/90 text-lg">{getErrorMessage()}</p>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Informasi Error */}
            <div className="text-center mb-8">
              <p className="text-gray-600">
                {errorCode === "403" &&
                  "Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator."}
                {errorCode === "500" &&
                  "Kami mengalami kendala teknis. Tim IT kami telah diberitahu dan sedang memperbaiki masalah ini."}
                {errorCode === "503" &&
                  "Sistem sedang dalam pemeliharaan. Silakan coba lagi dalam beberapa saat."}
                {errorCode === "400" &&
                  "Permintaan yang Anda kirim tidak dapat diproses. Silakan periksa kembali."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={() => router.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>

              <Button
                onClick={() => router.push("/")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>

            {/* Contact Support */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/img/citiplumb.jpg"
                    alt="PT. CITI PLUMB"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      IT Support
                    </p>
                    <p className="text-xs text-gray-500">Online 24/7</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    const message = `Halo IT Support, saya mengalami error ${errorCode} pada aplikasi.`;
                    window.open(
                      `https://wa.me/62895327504234?text=${encodeURIComponent(message)}`,
                      "_blank",
                    );
                  }}
                >
                  Hubungi via WhatsApp
                </Button>
              </div>
            </div>
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

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
