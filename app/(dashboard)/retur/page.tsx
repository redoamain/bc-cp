/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ReturPembelianType } from "@/lib/types";
import { getRetur } from "@/lib/services/returServices";
import { columns } from "@/components/retur/columns";
import { DataTable } from "@/components/data-table2";
import { FilterTanggal } from "@/components/filter-tanggal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Download,
  FileSpreadsheet,
  Package,
  DollarSign,
  Bug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formatDate = (date: Date | string) => {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};
const sendTelegramNotification = async (exportData: {
  fileName: string;
  periode: string;
  totalData: number;
  totalUSD: number;
  totalIDR: number;
  totalJumlah: number;
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
          `📊 |LAPORAN RETUR PEMBELIAN DIEXPORT\n\n` +
          `📁 |File: ${exportData.fileName}\n` +
          `📅 |Periode: ${exportData.periode}\n` +
          `📦 |Total Data: ${exportData.totalData} transaksi\n` +
          `📦 |Total Quantity: ${exportData.totalJumlah.toLocaleString()}\n` +
          `💵 |Total USD: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(exportData.totalUSD)}\n` +
          `💰 |Total IDR: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(exportData.totalIDR)}\n` +
          `🕐 |Waktu Export: ${format(new Date(), "dd MMM yyyy HH:mm:ss", { locale: id })}\n` +
          `💻 *User Agent:* ${exportData.userAgent || "Unknown"}`,
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
export default function PengeluaranPage() {
  // Initialize dengan tanggal default
  const today = new Date();
  const defaultTgl2 = format(today, "yyyy-MM-dd");
  const defaultTgl1 = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd");

  const [data, setData] = useState<ReturPembelianType[]>([]);
  const [filteredData, setFilteredData] = useState<ReturPembelianType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tgl1, setTgl1] = useState(defaultTgl1);
  const [tgl2, setTgl2] = useState(defaultTgl2);
  const [jenisFilter, setJenisFilter] = useState("");

  const [showDebug, setShowDebug] = useState(false);

  const fetchData = useCallback(async (tglAwal: string, tglAkhir: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📅 Fetching data for period:", tglAwal, "to", tglAkhir);

      const response = await getRetur(tglAwal, tglAkhir);

      console.log("📦 API Response:", response);

      if (response.success && response.data) {
        setData(response.data);
        setFilteredData(response.data);
        setTgl1(tglAwal);
        setTgl2(tglAkhir);
      } else {
        setError(response.error || "Gagal mengambil data");
        setData([]);
        setFilteredData([]);
      }
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Terjadi kesalahan saat mengambil data");
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData(defaultTgl1, defaultTgl2);
  }, [fetchData]);

  // Apply filter when jenisFilter changes
  useEffect(() => {
    if (jenisFilter) {
      const filtered = data.filter(
        (item) =>
          item.JenisDokPabean?.toLowerCase() === jenisFilter.toLowerCase(),
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [jenisFilter, data]);

  

  const handleFilter = (tglAwal: string, tglAkhir: string) => {
    fetchData(tglAwal, tglAkhir);
  };

  // const totalNilai = filteredData.reduce(
  //   (sum, item) => sum + (item.NilaiBarang || 0),
  //   0,
  // );
  const totalJumlah = filteredData.reduce(
    (sum, item) => sum + (item.Jumlah || 0),
    0,
  );
  // app/pengeluaran/page.tsx
  // Fungsi export dengan header laporan

  const exportToExcel = async () => {
    try {
      console.log("Exporting data...", filteredData.length);

      if (filteredData.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      // Buat workbook baru
      const wb = XLSX.utils.book_new();

      // Buat worksheet
      let ws: XLSX.WorkSheet;

      // Data untuk header laporan
      const reportTitle = "LAPORAN RETUR PEMBELIAN";
      const periode = `Periode: ${formatDate(tgl1)} - ${formatDate(tgl2)}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm")}`;
      const totalData = `Total Data: ${filteredData.length} transaksi`;

      // Header laporan (4 baris pertama)
      const headerRows = [
        [reportTitle],
        [periode],
        [tanggalCetak],
        [totalData],
        [], // Baris kosong
      ];

      // Header kolom
      const columnHeaders = [
        "No.",
        "Jenis Dokumen",
        "No. Dokumen",
        "Tgl Dokumen",
        "No. Surat Jalan",
        "Tgl Surat Jalan",
        "Penerima",
        "Kode Barang",
        "Nama Barang",
        "Jumlah",
        "Satuan",
        "Curr",
        "Nilai Barang",
      ];

      // Data rows
      const dataRows = filteredData.map((item, index) => [
        index + 1,
        item.JenisDokPabean || "-",
        item.NomorDokPabean || "-",
        item.TanggalDokPabean
          ? format(new Date(item.TanggalDokPabean), "dd/MM/yyyy")
          : "-",
        item.NomorSuratJalan || "-",
        item.TanggalSuratJalan
          ? format(new Date(item.TanggalSuratJalan), "dd/MM/yyyy")
          : "-",
        item.PembeliPeneima || "-",
        item.KodeBarang || "-",
        item.NamaBarang || "-",
        item.Jumlah || 0,
        item.Satuan || "-",
        item.Curr || "USD",
        item.NilaiBarang || 0,
      ]);

      // Gabungkan semua data
      const wsData = [
        ...headerRows,
        columnHeaders,
        ...dataRows,
        [], // Baris kosong
      ];

      // Buat worksheet dari data
      // eslint-disable-next-line prefer-const
      ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge cells untuk header laporan (baris 1-4, kolom A-O)
      if (!ws["!merges"]) ws["!merges"] = [];

      // Merge untuk judul laporan (baris 1)
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } });
      // Merge untuk periode (baris 2)
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 14 } });
      // Merge untuk tanggal cetak (baris 3)
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 14 } });
      // Merge untuk total data (baris 4)
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 14 } });
      // Merge untuk akhir laporan
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: 14 },
      });

      // Style untuk header (akan diterapkan di Excel)
      // Atur lebar kolom
      const wscols = [
        { wch: 5 }, // No.
        { wch: 15 }, // Jenis Dokumen
        { wch: 15 }, // No. Dokumen
        { wch: 12 }, // Tgl Dokumen
        { wch: 10 }, // No. BPB
        { wch: 12 }, // Tgl BPB
        { wch: 35 }, // Pemasok/Pengirim
        { wch: 15 }, // Kode Barang
        { wch: 45 }, // Nama Barang
        { wch: 12 }, // Jumlah
        { wch: 8 }, // Satuan
        { wch: 8 }, // Curr
        { wch: 18 }, // Nilai Barang
        { wch: 15 }, // No. Container
        { wch: 15 }, // No. Invoice
      ];
      ws["!cols"] = wscols;

      // Set row heights (opsional)
      ws["!rows"] = [
        { hpt: 30 }, // Baris 1 (judul) - tinggi 30 points
        { hpt: 20 }, // Baris 2 (periode)
        { hpt: 20 }, // Baris 3 (tanggal cetak)
        { hpt: 20 }, // Baris 4 (total data)
        { hpt: 5 }, // Baris 5 (baris kosong)
        { hpt: 25 }, // Baris 6 (header kolom)
      ];

      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran Retur");

      // Download file
      const fileName = `LAPORAN_RETUR_PEMBELIAN_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);

      console.log("Export successful:", fileName);
      // Kirim notifikasi ke Telegram
      await sendTelegramNotification({
        fileName,
        periode: `${formatDate(tgl1)} - ${formatDate(tgl2)}`,
        totalData: filteredData.length,
        totalUSD,
        totalIDR,
        totalJumlah,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Export error:", error);
      alert(
        "Gagal mengexport data: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };
     const totalUSD = filteredData
       .filter((item) => item.Curr === "USD")
       .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

     const totalIDR = filteredData
       .filter((item) => item.Curr === "IDR")
       .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

     const countUSD = filteredData.filter((item) => item.Curr === "USD").length;
     const countIDR = filteredData.filter((item) => item.Curr === "IDR").length;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header with Debug Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Data Pengeluaran Pembelian</h1>
            <p className="text-muted-foreground">
              Laporan pengeluaran Retur Pembelian barang periode {formatDate(tgl1)} -{" "}
              {formatDate(tgl2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total data: {data.length} item
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
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filter Component */}
        <FilterTanggal
          onFilter={handleFilter}
          onExport={exportToExcel}
          isLoading={loading}
          defaultTgl1={tgl1}
          defaultTgl2={tgl2}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredData.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Dari total {data.length} data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quantity
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {totalJumlah.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total jumlah barang masuk
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card USD */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Transaksi dengan CUR USD
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  }).format(totalUSD)}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {countUSD} transaksi
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    USD
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Card IDR */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Transaksi dengan CUR IDR
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="">
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 2,
                  }).format(totalIDR)}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {countIDR} transaksi
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    IDR
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchKey="Namabarang"
                searchPlaceholder="Cari nama barang..."
                onJenisDokumenFilter={setJenisFilter}
              />
            )}
          </CardContent>
        </Card>

        {/* Info */}
        {filteredData.length > 0 && !loading && (
          <div className="text-sm text-muted-foreground text-right">
            Menampilkan {filteredData.length} data pengeluaran
            {jenisFilter && ` (filter: ${jenisFilter})`}
          </div>
        )}
      </div>
    </div>
  );
}
