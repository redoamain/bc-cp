// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Wifi,
  WifiOff,
  Clock,
  Server,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface DbStatus {
  status: "connected" | "disconnected" | "checking";
  message: string;
  timestamp: string;
  database?: string;
  server?: string;
  responseTime?: number;
}

export default function DashboardPage() {
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    status: "checking",
    message: "Memeriksa koneksi database...",
    timestamp: new Date().toLocaleString("id-ID"),
  });

  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);

  // Gunakan useRef untuk melacak apakah komponen masih mounted
  const isMounted = useRef(true);

  // Gunakan useRef untuk melacak interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi untuk mengecek koneksi database
  const checkDatabaseConnection = useCallback(async () => {
    // Cegah multiple requests
    if (isChecking) return;

    setIsChecking(true);

    const startTime = performance.now();

    try {
      const response = await fetch("/api/health/database");
      const data = await response.json();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Only update state if component is still mounted
      if (isMounted.current) {
        if (response.ok && data.status === "connected") {
          setDbStatus({
            status: "connected",
            message: `Terhubung ke database ${data.database || "utama"}`,
            timestamp: new Date().toLocaleString("id-ID"),
            database: data.database,
            server: data.server,
            responseTime: responseTime,
          });
        } else {
          setDbStatus({
            status: "disconnected",
            message: data.error || "Gagal terhubung ke database",
            timestamp: new Date().toLocaleString("id-ID"),
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
          timestamp: new Date().toLocaleString("id-ID"),
          responseTime: responseTime,
        });

        setLastChecked(new Date());
      }
    } finally {
      if (isMounted.current) {
        setIsChecking(false);
      }
    }
  }, [isChecking]); // isChecking sebagai dependency

  // Setup interval untuk pengecekan berkala
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;

    // Fungsi untuk memulai interval
    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        checkDatabaseConnection();
      }, 30000); // 30 detik
    };

    // Panggil sekali saat komponen mount
    checkDatabaseConnection();

    // Mulai interval
    startInterval();

    // Cleanup function
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - hanya jalan sekali saat mount

  // Handler untuk manual refresh
  const handleManualCheck = () => {
    checkDatabaseConnection();
  };

  const getStatusIcon = () => {
    switch (dbStatus.status) {
      case "connected":
        return <Wifi className="h-5 w-5 text-green-500" />;
      case "disconnected":
        return <WifiOff className="h-5 w-5 text-red-500" />;
      case "checking":
        return <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusBadge = () => {
    switch (dbStatus.status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Connected
          </Badge>
        );
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>;
      case "checking":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200 bg-yellow-50"
          >
            Checking...
          </Badge>
        );
    }
  };

  const getStatusColor = () => {
    switch (dbStatus.status) {
      case "connected":
        return "border-l-4 border-l-green-500";
      case "disconnected":
        return "border-l-4 border-l-red-500";
      case "checking":
        return "border-l-4 border-l-yellow-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang di Inventory System
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {lastChecked.toLocaleTimeString("id-ID")}
          </Badge>
        </div>

        {/* Database Status Card */}
        <Card className={`${getStatusColor()} shadow-md`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Status Koneksi Database
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <button
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  title="Refresh manual"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
            <CardDescription>
              Informasi konektivitas dengan server database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-0.5">{getStatusIcon()}</div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="text-base font-semibold">
                    {dbStatus.status === "connected"
                      ? "Terhubung"
                      : dbStatus.status === "disconnected"
                        ? "Terputus"
                        : "Memeriksa..."}
                  </p>
                </div>
              </div>

              {/* Server */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Server
                  </p>
                  <p className="text-base font-semibold">
                    {dbStatus.server ||
                      process.env.NEXT_PUBLIC_DB_SERVER ||
                      "Localhost"}
                  </p>
                </div>
              </div>

              {/* Database */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <HardDrive className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Database
                  </p>
                  <p className="text-base font-semibold">
                    {dbStatus.database ||
                      process.env.NEXT_PUBLIC_DB_DATABASE ||
                      "InventoryDB"}
                  </p>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Response Time
                  </p>
                  <p className="text-base font-semibold">
                    {dbStatus.responseTime
                      ? `${dbStatus.responseTime} ms`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <Alert
              className={`mt-4 ${
                dbStatus.status === "connected"
                  ? "bg-green-50 border-green-200"
                  : dbStatus.status === "disconnected"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
              }`}
            >
              {dbStatus.status === "connected" && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {dbStatus.status === "disconnected" && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              {dbStatus.status === "checking" && (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription
                className={
                  dbStatus.status === "connected"
                    ? "text-green-700"
                    : dbStatus.status === "disconnected"
                      ? "text-red-700"
                      : "text-yellow-700"
                }
              >
                {dbStatus.message}
              </AlertDescription>
            </Alert>

            {/* Last Checked */}
            <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
              <span>Terakhir diperiksa: {dbStatus.timestamp}</span>
              <span className="text-xs">Interval: 30 detik</span>
            </div>
          </CardContent>
        </Card>

     

        {/* Welcome Message */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Welcome to the Dashboard
              </h2>
              <p className="text-gray-600">
                Sistem Inventory Beacukai - Pantau stok barang dengan mudah dan
                efisien
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
