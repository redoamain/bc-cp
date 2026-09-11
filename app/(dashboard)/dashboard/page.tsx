// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  Server,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/app/contexts/UserContext";

interface DbStatus {
  status: "connected" | "disconnected" | "checking";
  message: string;
  timestamp: string;
  database?: string;
  server?: string;
  responseTime?: number;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    status: "checking",
    message: "Memeriksa koneksi database...",
    timestamp: new Date().toLocaleTimeString("id-ID"),
  });

  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkDatabaseConnection = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    const startTime = performance.now();

    try {
      const response = await fetch("/api/health/database");
      const data = await response.json();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (isMounted.current) {
        if (response.ok && data.status === "connected") {
          setDbStatus({
            status: "connected",
            message: `Terhubung ke database ${data.database || "utama"}`,
            timestamp: new Date().toLocaleTimeString("id-ID"),
            database: data.database,
            server: data.server,
            responseTime: responseTime,
          });
        } else {
          setDbStatus({
            status: "disconnected",
            message: data.error || "Gagal terhubung ke database",
            timestamp: new Date().toLocaleTimeString("id-ID"),
            responseTime: responseTime,
          });
        }
        setLastChecked(new Date());
      }
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (isMounted.current) {
        setDbStatus({
          status: "disconnected",
          message:
            error instanceof Error
              ? error.message
              : "Tidak dapat terhubung ke database",
          timestamp: new Date().toLocaleTimeString("id-ID"),
          responseTime: responseTime,
        });
        setLastChecked(new Date());
      }
    } finally {
      if (isMounted.current) {
        setIsChecking(false);
      }
    }
  }, [isChecking]);

  useEffect(() => {
    isMounted.current = true;
    checkDatabaseConnection();

    intervalRef.current = setInterval(() => {
      checkDatabaseConnection();
    }, 30000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleManualCheck = () => {
    checkDatabaseConnection();
  };

  const displayName =
    user?.Nama || user?.name || user?.UserName || user?.username || "Pengguna";
  const displayRole =
    user?.Bagian || user?.role || user?.jabatan || "Staff Operasional";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col gap-6">
        {/* Welcome & Overview Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Selamat Datang, {displayName}
              </h1>
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100/80 text-slate-700 border-slate-200">
                {displayRole}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Sistem IT Inventory Kawasan Berikat PT. CITI PLUMB terintegrasi dengan pengawasan Bea Cukai.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus.status === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : dbStatus.status === "disconnected"
                    ? "bg-red-500"
                    : "bg-amber-500 animate-ping"
                }`}
              />
              <span className="font-medium">
                {dbStatus.status === "connected"
                  ? `Database Online (${dbStatus.responseTime ?? 0}ms)`
                  : dbStatus.status === "disconnected"
                  ? "Database Terputus"
                  : "Mengecek Koneksi..."}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="h-8 w-8 text-slate-600 hover:text-slate-900"
              title="Periksa ulang koneksi database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Database Connectivity Detail (Clean Info Grid) */}
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Parameter Server & Konektivitas Database
                </CardTitle>
              </div>
              <span className="text-[11px] text-slate-400">
                Pembaruan otomatis setiap 30 detik
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Status Koneksi</p>
                <div className="flex items-center gap-1.5">
                  {dbStatus.status === "connected" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : dbStatus.status === "disconnected" ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 animate-spin" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">
                    {dbStatus.status === "connected"
                      ? "Terhubung"
                      : dbStatus.status === "disconnected"
                      ? "Terputus"
                      : "Memeriksa..."}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Infrastruktur Host</p>
                <div className="flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800 truncate" title="Server Utama (Internal)">
                    {dbStatus.server || "Server Utama (Internal)"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Layanan Database</p>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800 truncate" title="Database IT Inventory">
                    {dbStatus.database || "Database IT Inventory"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Latensi / Ping</p>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">
                    {dbStatus.responseTime ? `${dbStatus.responseTime} ms` : "-"}
                  </span>
                </div>
              </div>
            </div>

            {dbStatus.status === "disconnected" && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dbStatus.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informasi Sistem & Kepatuhan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-2xs">
            <h3 className="text-xs font-semibold text-slate-900 mb-1">IT Inventory Bea Cukai</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Memenuhi standar pencatatan pertanggungjawaban Kawasan Berikat sesuai regulasi DJBC.
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-2xs">
            <h3 className="text-xs font-semibold text-slate-900 mb-1">Navigasi Transaksi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gunakan menu di bilah atas (Navbar) untuk mengakses Pemasukan, Pengeluaran, Mutasi, dan Log.
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-2xs">
            <h3 className="text-xs font-semibold text-slate-900 mb-1">Audit Trail & Keamanan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Setiap aktivitas masuk, keluar, serta mutasi stok terekam secara otomatis ke dalam sistem log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

