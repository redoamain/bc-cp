// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Camera, ArrowRight, Box, Video } from "lucide-react";

export default function Home() {
    const currentYear = new Date().getFullYear();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Selamat Datang di Portal Beacukai PT. CITI PLUMB
          </h1>
          <p className="text-lg text-muted-foreground">
            Silakan pilih aplikasi yang ingin Anda akses
          </p>
        </div>

        {/* Cards Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
          {/* Card Inventory */}
          <Card
            className={`w-full md:w-80 transform transition-all duration-300 hover:scale-105 cursor-pointer ${
              hoveredCard === "inventory"
                ? "ring-2 ring-blue-500 shadow-xl"
                : "hover:shadow-xl"
            }`}
            onMouseEnter={() => setHoveredCard("inventory")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleNavigation("/auth/login")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Inventory System
              </CardTitle>
              <CardDescription className="text-base">
                Kelola stok barang, mutasi, dan laporan inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <Box className="w-4 h-4" /> Manajemen Stok Barang
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" /> Laporan Pengeluaran
                </p>
                <p className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Mutasi Bahan Baku
                </p>
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
            className={`w-full md:w-80 transform transition-all duration-300 hover:scale-105 cursor-pointer ${
              hoveredCard === "cctv"
                ? "ring-2 ring-purple-500 shadow-xl"
                : "hover:shadow-xl"
            }`}
            onMouseEnter={() => setHoveredCard("cctv")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleNavigation("/api/cctv/login")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Camera className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl font-bold">CCTV System</CardTitle>
              <CardDescription className="text-base">
                Pantau dan kelola kamera CCTV secara real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <Video className="w-4 h-4" /> Live Streaming Kamera
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Rekaman dan Playback
                </p>
                <p className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Manajemen Kamera
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation("/api/cctv/login");
                }}
              >
                Login ke CCTV
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Pilih aplikasi yang ingin Anda akses untuk melanjutkan</p>
          <p className="mt-2">© {currentYear}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
