// app/log/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LogType } from "@/lib/types";
import { getLog } from "@/lib/services/logService";
import { columns } from "@/components/log/columns";
import { DataTableLog } from "@/components/data-table-log";
import { FilterTanggal } from "@/components/filter-tanggal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Download,
  Clock,
  Users,
  FileText,
  Package,
  Activity,
} from "lucide-react";

const formatDate = (date: Date | string) => {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};

export default function LogPage() {
  // Initialize dengan tanggal default (7 hari terakhir)
  const today = new Date();
  const defaultTgl2 = format(today, "yyyy-MM-dd");
  const defaultTgl1 = format(
    new Date(today.setDate(today.getDate() - 7)),
    "yyyy-MM-dd",
  );

  const [data, setData] = useState<LogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tgl1, setTgl1] = useState(defaultTgl1);
  const [tgl2, setTgl2] = useState(defaultTgl2);

  const fetchData = useCallback(async (tglAwal: string, tglAkhir: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📅 Fetching log data for period:", tglAwal, "to", tglAkhir);

      const response = await getLog(tglAwal, tglAkhir);

      if (response.success && response.data) {
        setData(response.data);
        setTgl1(tglAwal);
        setTgl2(tglAkhir);
      } else {
        setError(response.error || "Gagal mengambil data");
        setData([]);
      }
    } catch (err) {
      console.error("❌ Error fetching log:", err);
      setError("Terjadi kesalahan saat mengambil data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData(defaultTgl1, defaultTgl2);
  }, [fetchData]);

  const handleFilter = (tglAwal: string, tglAkhir: string) => {
    fetchData(tglAwal, tglAkhir);
  };

  const exportToExcel = () => {
    try {
      if (data.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const excelData = data.map((item, index) => ({
        "No.": index + 1,
        Username: item.Username || "-",
        "No. Transaksi": item.TransNo || "-",
        "Item ID": item.ItemID || "-",
        KGS: item.kgs || 0,
        Keterangan: item.Remark || "-",
        "Waktu Transaksi": item.TransDateTime
          ? format(new Date(item.TransDateTime), "dd/MM/yyyy HH:mm:ss")
          : "-",
        "IP Address": item.IpAddr || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wscols = [
        { wch: 5 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 50 },
        { wch: 20 },
      ];
      ws["!cols"] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Log Activity");
      const fileName = `log_activity_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengexport data");
    }
  };

  // Hitung statistik
  const uniqueUsers = new Set(data.map((item) => item.Username).filter(Boolean))
    .size;
  const totalKGS = data.reduce((sum, item) => sum + (item.kgs || 0), 0);
  const uniqueItems = new Set(data.map((item) => item.ItemID).filter(Boolean))
    .size;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Log Activity</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Catatan aktivitas user dalam sistem
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchData(tgl1, tgl2)}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={data.length === 0 || loading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filter Component */}
        <FilterTanggal
          onFilter={handleFilter}
          isLoading={loading}
          defaultTgl1={tgl1}
          defaultTgl2={tgl2}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Log
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <FileText className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{data.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                Jumlah rekaman aktivitas
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pengguna Aktif
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Users className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{uniqueUsers}</p>
              <p className="text-xs text-slate-500 mt-1">
                User yang bertransaksi
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total KGS
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Package className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{totalKGS.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">
                Total berat / kuantitas
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Item Unik
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{uniqueItems}</p>
              <p className="text-xs text-slate-500 mt-1">Total jenis barang berbeda</p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* DataTable Log */}
        <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-800 border-t-transparent" />
                  <p className="text-xs text-slate-500">
                    Memuat data log...
                  </p>
                </div>
              </div>
            ) : (
              <DataTableLog
                columns={columns}
                data={data}
                searchKey="Remark"
                searchPlaceholder="Cari berdasarkan keterangan..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
