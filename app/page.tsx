// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Camera,
  ArrowRight,
  Box,
  Video,
  HardDrive,
  Eye,
} from "lucide-react";

export default function Home() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen relative bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/img/bg-cp-v2.webp"
          alt="Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Simple overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-900/70 via-slate-900/80 to-slate-900/70 backdrop-blur-sm" />
      </div>

      {/* Konten Utama */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col justify-between">
        {/* Header */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-block mb-4">
            <Image
              src="/img/citiplumb.jpg"
              alt="PT. CITI PLUMB Logo"
              width={100}
              height={50}
              className="mx-auto rounded-full"
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-yellow-400">
              Selamat Datang
            </span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            Portal Terintegrasi PT. CITI PLUMB - Akses sistem inventory dan CCTV
            dalam satu platform
          </p>
        </div>

        {/* Cards Container */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-5xl mx-auto flex-1 py-6">
          {/* Card Inventory */}
          <Card
            className={`w-full md:w-96 cursor-pointer transition-shadow
              ${
                hoveredCard === "inventory"
                  ? "shadow-2xl shadow-blue-500/20 border-blue-500"
                  : "shadow-lg hover:shadow-xl border-white/20 hover:border-blue-500/50"
              }
              bg-white/95 backdrop-blur-sm border-2
            `}
            onMouseEnter={() => setHoveredCard("inventory")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleNavigation("/auth/login")}
          >
            <CardHeader className="text-center pb-3">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                IT Inventory System
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Manajemen inventory modern untuk kebutuhan IT perusahaan
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center pb-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Box className="w-4 h-4" />
                  <span>Manajemen Stok Barang</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <HardDrive className="w-4 h-4" />
                  <span>Laporan Pengeluaran & Pemasukan</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>Mutasi Barang & Riwayat Transaksi</span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation("/auth/login");
                }}
              >
                Login ke Inventory
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          {/* Card CCTV */}
          <Card
            className={`w-full md:w-96 cursor-pointer transition-shadow
              ${
                hoveredCard === "cctv"
                  ? "shadow-2xl shadow-yellow-500/20 border-yellow-500"
                  : "shadow-lg hover:shadow-xl border-white/20 hover:border-yellow-500/50"
              }
              bg-white/95 backdrop-blur-sm border-2
            `}
            onMouseEnter={() => setHoveredCard("cctv")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleNavigation("/api/cctv/login")}
          >
            <CardHeader className="text-center pb-3">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-yellow-100 flex items-center justify-center">
                <Camera className="w-10 h-10 text-yellow-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                CCTV System
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Monitoring keamanan real-time untuk seluruh area
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center pb-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Video className="w-4 h-4" />
                  <span>Live Streaming Kamera</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>Rekaman dan Playback</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Camera className="w-4 h-4" />
                  <span>Manajemen Kamera & Zona</span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <div className="flex flex-col w-full gap-2">

              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation("/api/cctv/login2");
                }}
                >
                Login ke CCTV 2
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation("/api/cctv/login");
                }}
                >
                Login ke CCTV 1
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
                </div>
            </CardFooter>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 py-4">
          <div className="inline-block px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-sm text-white/80">
              Pilih aplikasi yang ingin Anda akses untuk melanjutkan
            </p>
          </div>
          <p className="mt-2 text-xs text-white/40">
            © {currentYear} PT. CITI PLUMB. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
