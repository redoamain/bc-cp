/* eslint-disable @typescript-eslint/no-unused-vars */
// app/mutasi/barang-jadi/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { getWIP } from "@/lib/services/mutasiService";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tgl1, setTgl1] = useState(defaultTgl1);
  const [tgl2, setTgl2] = useState(defaultTgl2);

  const fetchData = useCallback(async (tglAwal: string, tglAkhir: string) => {
    setLoading(true);
    setError(null);

    try {
       const response = await getWIP(tglAwal, tglAkhir);
      if (response.success && response.data) {
        setData(response.data);
        setTgl1(tglAwal);
        setTgl2(tglAkhir);
      } else {
        setError(response.error || "Gagal mengambil data");
        setData([]);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengambil data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(defaultTgl1, defaultTgl2);
  }, [defaultTgl1, defaultTgl2, fetchData]);

  const handleFilter = (tglAwal: string, tglAkhir: string) => {
    fetchData(tglAwal, tglAkhir);
  };

  // app/mutasi/bahan-baku/page.tsx
  // Perbaiki fungsi exportToExcel

  const exportToExcel = async () => {
    try {
      if (data.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      // Buat workbook baru
      const wb = XLSX.utils.book_new();

      // Data untuk header laporan
      const reportTitle = "LAPORAN POSISI BARANG WIP (Work In Progress)";
      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${data.length} item`;

      // Header kolom
      const columnHeaders = [
        "No.",
        "Kode Barang",
        "Nama Barang",
        "Satuan",
        "Jumlah Barang",
        "Keterangan",
      ];

      // Data rows
      const dataRows = data.map((item, index) => [
        index + 1,
        item.KodeBarang || "-",
        item.NamaBarang || "-",
        item.Satuan || "-",
        item.SaldoAkhir || 0,
        item.Keterangan || "-",
      ]);

      //
      const totalSaldoAkhir = data.reduce(
        (sum, item) => sum + (item.SaldoAkhir || 0),
        0,
      );

      // Baris total
      const totalRows = [
        [], // Baris kosong
        [
          "TOTAL",
          "",
          "",
          "",
       
       
        
          totalSaldoAkhir.toLocaleString("id-ID"),
       
  
          "",
        ],
        [], // Baris kosong
        ["*** AKHIR LAPORAN ***"],
      ];

      // Gabungkan semua data
      const wsData = [
        [reportTitle],
        [periode],
        [tanggalCetak],
        [totalData],
        [], // Baris kosong
        columnHeaders,
        ...dataRows,
        ...totalRows,
      ];

      // Buat worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge cells untuk header laporan
      if (!ws["!merges"]) ws["!merges"] = [];

      // Merge untuk judul laporan (baris 1)
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } });
      // Merge untuk periode (baris 2)
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 11 } });
      // Merge untuk tanggal cetak (baris 3)
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 11 } });
      // Merge untuk total data (baris 4)
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 11 } });
      // Merge untuk baris TOTAL (baris terakhir - 2)
      ws["!merges"].push({
        s: { r: wsData.length - 2, c: 0 },
        e: { r: wsData.length - 2, c: 3 },
      });
      // Merge untuk akhir laporan (baris terakhir)
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: 11 },
      });

      // Atur lebar kolom
      const wscols = [
        { wch: 5 }, // No.
        { wch: 15 }, // Kode Barang
        { wch: 40 }, // Nama Barang
        { wch: 10 }, // Satuan
        { wch: 15 }, // Saldo Awal
        { wch: 12 }, // Pemasukan
        { wch: 12 }, // Pengeluaran
        { wch: 12 }, // Penyesuaian
        { wch: 15 }, // Saldo Akhir
        { wch: 12 }, // Stok Opname
        { wch: 12 }, // Selisih
        { wch: 30 }, // Keterangan
      ];
      ws["!cols"] = wscols;

      // Set row heights untuk header
      ws["!rows"] = [
        { hpt: 30 }, // Baris 1 (judul)
        { hpt: 20 }, // Baris 2 (periode)
        { hpt: 20 }, // Baris 3 (tanggal cetak)
        { hpt: 20 }, // Baris 4 (total data)
        { hpt: 5 }, // Baris 5 (baris kosong)
        { hpt: 25 }, // Baris 6 (header kolom)
      ];

      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(wb, ws, "Bahan Baku");

      // Download file
      const fileName = `LAPORAN_POSISI_BARANG_WIP_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);
      // Kirim notifikasi ke Telegram
                  await sendTelegramNotification({
                    fileName,
                    periode: `${format(new Date(tgl1), "dd MMM yyyy")} - ${format(new Date(tgl2), "dd MMM yyyy")}`,
                    totalData: data.length,
                
                    totalSaldoAkhir,
                   
                    userAgent: navigator.userAgent,
                  });
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengexport data");
    }
  };
 
  const totalSaldoAkhir = data.reduce(
    (sum, item) => sum + (item.SaldoAkhir || 0),
    0,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Laporan Posisi Barang WIP</h1>
            <p className="text-muted-foreground">
              Laporan posisi barang WIP periode {formatDate(tgl1)} -{" "}
              {formatDate(tgl2)}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Item
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Jumlah Barang WIP
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jumlah Barang
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(totalSaldoAkhir)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total jumlah barang WIP (Saldo Akhir)
              </p>
            </CardContent>
          </Card>
        </div>

     

   

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DataTableMutasi
                columns={columns}
                data={data}
                searchKey="NamaBarang"
                searchPlaceholder="Cari nama barang..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
