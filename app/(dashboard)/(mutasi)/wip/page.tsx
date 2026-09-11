/* eslint-disable @typescript-eslint/no-unused-vars */
// app/mutasi/wip/page.tsx
"use client";

import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MutasiType } from "@/lib/types";
import { columns } from "@/components/wip/columns";
import { DataTableMutasi } from "@/components/data-table-mutasi";
import { FilterTanggal } from "@/components/filter-tanggal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
  Search,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getWIP } from "@/lib/services/mutasiService";
import { useUser } from "../../../contexts/UserContext";

const formatDate = (date: Date | string) => {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};

const formatNumber = (value: number) => {
  if (!value && value !== 0) return "-";
  return value.toLocaleString("id-ID");
};

// Fungsi untuk mengirim notifikasi ke Telegram
const sendTelegramNotification = async (exportData: {
  fileName: string;
  periode: string;
  totalData: number;
  totalSaldoAkhir: number;
  userAgent?: string;
  userName?: string;
  userBagian?: string;
}) => {
  try {
    const response = await fetch("/api/notif", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          `📦 |LAPORAN POSISI BARANG WIP DIEXPORT\n\n` +
          `📁 |File: ${exportData.fileName}\n` +
          `📅 |Periode: ${exportData.periode}\n` +
          `📊 |Total Item: ${exportData.totalData} WIP\n` +
          `📉 |Saldo Akhir: ${exportData.totalSaldoAkhir.toLocaleString("id-ID")}\n` +
          `🕐 |Waktu Export: ${format(new Date(), "dd MMM yyyy HH:mm:ss", { locale: id })}\n` +
          `👤 |Diekspor oleh: ${exportData.userName || "Unknown"} ${exportData.userBagian ? `(${exportData.userBagian})` : ""}\n` +
          `💻 |User Agent: ${exportData.userAgent || "Unknown"}`,
        parseMode: "Markdown",
      }),
    });

    if (!response.ok) {
      console.error("Gagal mengirim notifikasi Telegram");
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
};

export default function WipPage() {
  const today = new Date();
  const defaultTgl2 = format(today, "yyyy-MM-dd");
  const defaultTgl1 = format(
    new Date(today.setMonth(today.getMonth() - 1)),
    "yyyy-MM-dd",
  );

  const [data, setData] = useState<MutasiType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tgl1, setTgl1] = useState(defaultTgl1);
  const [tgl2, setTgl2] = useState(defaultTgl2);

  // Menggunakan UserContext
  const { user, isLoading: userLoading } = useUser();

  // Mendapatkan informasi user
  const getUserInfo = useCallback(() => {
    if (!user) return { name: "Unknown", bagian: "Unknown" };

    const name =
      user.Nama || user.name || user.UserName || user.username || "Unknown";
    const bagian = user.Bagian || user.role || user.jabatan || "Unknown";

    return { name, bagian };
  }, [user]);

  const userInfo = getUserInfo();

  const fetchData = useCallback(async (tglAwal: string, tglAkhir: string) => {
    setLoading(true);
    setError(null);
    setIsFirstLoad(false);
    setHasData(false);

    try {
      const response = await getWIP(tglAwal, tglAkhir);
      if (response.success && response.data) {
        setData(response.data);
        setTgl1(tglAwal);
        setTgl2(tglAkhir);
        setHasData(true);
      } else {
        setError(response.error || "Gagal mengambil data");
        setData([]);
        setHasData(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengambil data");
      setData([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilter = (tglAwal: string, tglAkhir: string) => {
    fetchData(tglAwal, tglAkhir);
  };

  const exportToExcel = async () => {
    try {
      if (data.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const wb = XLSX.utils.book_new();

      const reportTitle = "LAPORAN POSISI BARANG WIP (Work In Progress)";
      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${data.length} item`;

      const columnHeaders = [
        "No.",
        "Kode Barang",
        "Nama Barang",
        "Satuan",
        "Jumlah Barang",
        "Keterangan",
      ];

      const dataRows = data.map((item, index) => [
        index + 1,
        item.KodeBarang || "-",
        item.NamaBarang || "-",
        item.Satuan || "-",
        item.SaldoAkhir || 0,
        item.Keterangan || "-",
      ]);

      const totalSaldoAkhir = data.reduce(
        (sum, item) => sum + (item.SaldoAkhir || 0),
        0,
      );

      const totalRows = [
        [],
        ["TOTAL", "", "", "", totalSaldoAkhir.toLocaleString("id-ID"), ""],
        [`Total Item: ${data.length} item`, "", "", "", "", ""],
        [],
        ["*** AKHIR LAPORAN ***"],
      ];

      const wsData = [
        [reportTitle],
        [periode],
        [tanggalCetak],
        [totalData],
        [],
        columnHeaders,
        ...dataRows,
        ...totalRows,
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      if (!ws["!merges"]) ws["!merges"] = [];

      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 4 } });
      ws["!merges"].push({
        s: { r: wsData.length - 3, c: 0 },
        e: { r: wsData.length - 3, c: 3 },
      });
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: 4 },
      });

      const wscols = [
        { wch: 5 },
        { wch: 15 },
        { wch: 40 },
        { wch: 10 },
        { wch: 15 },
        { wch: 30 },
      ];
      ws["!cols"] = wscols;

      ws["!rows"] = [
        { hpt: 30 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 5 },
        { hpt: 25 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "WIP");

      const fileName = `LAPORAN_WIP_${format(new Date(tgl1), "yyyyMMdd")}_${format(new Date(tgl2), "yyyyMMdd")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      await sendTelegramNotification({
        fileName,
        periode: `${format(new Date(tgl1), "dd MMM yyyy")} - ${format(new Date(tgl2), "dd MMM yyyy")}`,
        totalData: data.length,
        totalSaldoAkhir,
        userAgent: navigator.userAgent,
        userName: userInfo.name,
        userBagian: userInfo.bagian,
      });
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengexport data");
    }
  };

  // Hitung total untuk summary
  const totalSaldoAkhir = data.reduce(
    (sum, item) => sum + (item.SaldoAkhir || 0),
    0,
  );

  // Loading state untuk user
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Laporan Posisi Barang WIP</h1>
            <p className="text-muted-foreground">
              {isFirstLoad
                ? "Pilih periode dan klik tampilkan untuk melihat data"
                : hasData && data.length > 0
                  ? `Laporan posisi barang WIP periode ${formatDate(tgl1)} - ${formatDate(tgl2)}`
                  : "Pilih periode dan klik tampilkan untuk melihat data"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isFirstLoad && hasData) {
                  fetchData(tgl1, tgl2);
                }
              }}
              disabled={loading || isFirstLoad || !hasData}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={data.length === 0 || loading || isFirstLoad || !hasData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filter Tanggal */}
        <FilterTanggal
          onFilter={handleFilter}
          isLoading={loading}
          defaultTgl1={tgl1}
          defaultTgl2={tgl2}
        />

        {/* Loading */}
        {loading ? (
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-800 border-t-transparent mb-3"></div>
              <h3 className="text-sm font-semibold text-slate-800">
                Memuat Data...
              </h3>
              <p className="text-xs text-slate-500">
                Mohon tunggu sebentar
              </p>
            </CardContent>
          </Card>
        ) : isFirstLoad ? (
          /* First Load */
          <Card className="border border-dashed border-slate-200/90 shadow-xs bg-white/70">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                Belum Memilih Periode
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Silakan pilih periode tanggal di atas dan klik tombol
                <span className="font-semibold text-slate-700 mx-1">
                  &quot;Tampilkan&quot;
                </span>
                untuk melihat laporan posisi barang WIP.
              </p>
            </CardContent>
          </Card>
        ) : hasData && data.length > 0 ? (
          /* Ada Data */
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Item
                  </CardTitle>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200/60">
                    <Package className="h-3.5 w-3.5" />
                  </div>
                </CardHeader>
                <CardContent className="px-4.5 pb-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900">{data.length}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Jumlah Barang WIP
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Jumlah Barang
                  </CardTitle>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                    <TrendingDown className="h-3.5 w-3.5" />
                  </div>
                </CardHeader>
                <CardContent className="px-4.5 pb-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-purple-600">
                    {formatNumber(totalSaldoAkhir)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Total quantity WIP (Saldo Akhir)
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Periode Laporan
                  </CardTitle>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </CardHeader>
                <CardContent className="px-4.5 pb-4 pt-0">
                  <p className="text-sm font-bold tracking-tight text-slate-900 mt-1">
                    {formatDate(tgl1)} - {formatDate(tgl2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Rentang tanggal aktif
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* DataTable */}
            <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <DataTableMutasi
                  columns={columns}
                  data={data}
                  searchKey="NamaBarang"
                  searchPlaceholder="Cari nama barang..."
                />
              </CardContent>
            </Card>
          </>
        ) : (
          /* Data Kosong */
          <Card className="border border-dashed border-slate-200/90 shadow-xs bg-white/70">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                Tidak Ada Data
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Tidak ditemukan data untuk periode yang dipilih. Coba pilih rentang tanggal yang berbeda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
