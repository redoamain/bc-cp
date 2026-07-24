// app/mutasi/barang-jadi/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MutasiType } from "@/lib/types";
import { columns } from "@/components/mutasi/columns";
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
  MinusCircle,
  PlusCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import { getBarangJadi } from "@/lib/services/mutasiService";
import { useUser } from "../../../contexts/UserContext";

const formatDate = (date: Date | string) => {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};

const formatNumber = (value: number) => {
  if (!value && value !== 0) return "-";
  return value.toLocaleString("id-ID");
};

// Helper function untuk parsing Penyesuaian (string dengan tanda + atau -)
const parsePenyesuaian = (
  value: string | number | null | undefined,
): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Hilangkan tanda + atau - dan parse ke number
    const cleaned = value.replace(/[+]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Fungsi untuk mengirim notifikasi ke Telegram
const sendTelegramNotification = async (exportData: {
  fileName: string;
  periode: string;
  totalData: number;
  totalSaldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalSaldoAkhir: number;
  totalSelisih: number;
  userAgent?: string;
  userName?: string;
  userBagian?: string;
}) => {
  try {
    const selisihStatus =
      exportData.totalSelisih > 0
        ? "⚠️ Lebih"
        : exportData.totalSelisih < 0
          ? "⚠️ Kurang"
          : "✓ Sesuai";

    const response = await fetch("/api/notif", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          `📦 |LAPORAN MUTASI BARANG JADI DIEXPORT\n\n` +
          `📁 |File: ${exportData.fileName}\n` +
          `📅 |Periode: ${exportData.periode}\n` +
          `📊 |Total Item: ${exportData.totalData} barang jadi\n\n` +
          `📈 |Saldo Awal: ${exportData.totalSaldoAwal.toLocaleString("id-ID")}\n` +
          `➕ |Pemasukan: ${exportData.totalPemasukan.toLocaleString("id-ID")}\n` +
          `➖ |Pengeluaran: ${exportData.totalPengeluaran.toLocaleString("id-ID")}\n` +
          `📉 |Saldo Akhir: ${exportData.totalSaldoAkhir.toLocaleString("id-ID")}\n\n` +
          `⚠️ |Selisih Stok: ${exportData.totalSelisih.toLocaleString("id-ID")} (${selisihStatus})\n` +
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

export default function BarangJadiPage() {
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

  // Mendapatkan informasi user dengan berbagai kemungkinan field name
  const getUserInfo = useCallback(() => {
    if (!user) return { name: "Unknown", bagian: "Unknown" };

    // Coba berbagai kemungkinan field name
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
      const response = await getBarangJadi(tglAwal, tglAkhir);

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

  // Hapus useEffect agar tidak auto-fetch
  // useEffect(() => {
  //   fetchData(defaultTgl1, defaultTgl2);
  // }, [fetchData]);

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

      const reportTitle = "LAPORAN MUTASI BARANG JADI";
      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${data.length} item`;

      // HEADER KOLOM - SESUAIKAN DENGAN DATA
      const columnHeaders = [
        "No.",
        "Kode Barang",
        "Nama Barang",
        "Satuan",
        "Saldo Awal",
        "Pemasukan",
        "Pengembalian Produksi",
        "Penggunaan",
        "Pengeluaran",
        "Penyesuaian",
        "Saldo Akhir",
        "Hasil Pencacahan",
        "Selisih",
        "Keterangan",
      ];

      // DATA ROWS - SESUAIKAN URUTAN
      const dataRows = data.map((item, index) => [
        index + 1,
        item.KodeBarang || "-",
        item.NamaBarang || "-",
        item.Satuan || "-",
        item.saldoawal || 0,
        item.Pemasukan || 0,
        item.Retur || 0,
        item.Penggunaan || 0,
        item.Pengeluaran || 0,
        item.Penyesuaian || "0",
        item.SaldoAkhir || 0,
        item.Pencacahan || 0,
        item.selisih || 0,
        item.Keterangan || "-",
      ]);

      // HITUNG TOTAL DENGAN BENAR
      const totalSaldoAwal = data.reduce(
        (sum, item) => sum + (item.saldoawal || 0),
        0,
      );
      const totalPemasukan = data.reduce(
        (sum, item) => sum + (item.Pemasukan || 0),
        0,
      );
      const totalRetur = data.reduce((sum, item) => sum + (item.Retur || 0), 0);
      const totalPenggunaan = data.reduce(
        (sum, item) => sum + (item.Penggunaan || 0),
        0,
      );
      const totalPengeluaran = data.reduce(
        (sum, item) => sum + (item.Pengeluaran || 0),
        0,
      );
      const totalPenyesuaian = data.reduce(
        (sum, item) => sum + parsePenyesuaian(item.Penyesuaian),
        0,
      );
      const totalSaldoAkhir = data.reduce(
        (sum, item) => sum + (item.SaldoAkhir || 0),
        0,
      );
      const totalPencacahan = data.reduce(
        (sum, item) => sum + (item.Pencacahan || 0),
        0,
      );
      const totalSelisih = data.reduce(
        (sum, item) => sum + (item.selisih || 0),
        0,
      );

      // BARIS TOTAL - SESUAIKAN DENGAN JUMLAH KOLOM
      const totalRows = [
        [], // Baris kosong
        [
          "TOTAL",
          "",
          "",
          "",
          totalSaldoAwal.toLocaleString("id-ID"),
          totalPemasukan.toLocaleString("id-ID"),
          totalRetur.toLocaleString("id-ID"),
          totalPenggunaan.toLocaleString("id-ID"),
          totalPengeluaran.toLocaleString("id-ID"),
          totalPenyesuaian.toLocaleString("id-ID"),
          totalSaldoAkhir.toLocaleString("id-ID"),
          totalPencacahan.toLocaleString("id-ID"),
          totalSelisih.toLocaleString("id-ID"),
          "",
        ],
        [],
        ["*** AKHIR LAPORAN ***"],
      ];

      // GABUNGKAN SEMUA DATA
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

      // MERGE CELLS - SESUAIKAN DENGAN JUMLAH KOLOM (14 kolom = index 13)
      if (!ws["!merges"]) ws["!merges"] = [];
      const lastColIndex = 13; // Karena ada 14 kolom (0-13)

      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } });

      // Merge untuk baris TOTAL (4 kolom pertama)
      ws["!merges"].push({
        s: { r: wsData.length - 2, c: 0 },
        e: { r: wsData.length - 2, c: 3 },
      });

      // Merge untuk akhir laporan
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: lastColIndex },
      });

      // LEBAR KOLOM - SESUAIKAN
      ws["!cols"] = [
        { wch: 5 }, // No.
        { wch: 15 }, // Kode Barang
        { wch: 40 }, // Nama Barang
        { wch: 10 }, // Satuan
        { wch: 15 }, // Saldo Awal
        { wch: 12 }, // Pemasukan
        { wch: 12 }, // Pengembalian Produksi
        { wch: 12 }, // Penggunaan
        { wch: 12 }, // Pengeluaran
        { wch: 12 }, // Penyesuaian
        { wch: 15 }, // Saldo Akhir
        { wch: 15 }, // Hasil Pencacahan
        { wch: 12 }, // Selisih
        { wch: 30 }, // Keterangan
      ];

      // TINGGI BARIS
      ws["!rows"] = [
        { hpt: 30 }, // Baris 1 (judul)
        { hpt: 20 }, // Baris 2 (periode)
        { hpt: 20 }, // Baris 3 (tanggal cetak)
        { hpt: 20 }, // Baris 4 (total data)
        { hpt: 5 }, // Baris 5 (baris kosong)
        { hpt: 25 }, // Baris 6 (header kolom)
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Barang Jadi");

      const fileName = `LAPORAN_BARANG_JADI_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // NOTIFIKASI - UPDATE DENGAN DATA YANG LENGKAP
      await sendTelegramNotification({
        fileName,
        periode: `${format(new Date(tgl1), "dd MMM yyyy")} - ${format(new Date(tgl2), "dd MMM yyyy")}`,
        totalData: data.length,
        totalSaldoAwal,
        totalPemasukan,
        totalPengeluaran,
        totalSaldoAkhir,
        totalSelisih,
        userAgent: navigator.userAgent,
        userName: userInfo.name,
        userBagian: userInfo.bagian,
      });
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengexport data");
    }
  };

  // Hitung total untuk summary (hanya jika ada data)
  const totalSaldoAwal = data.reduce(
    (sum, item) => sum + (item.saldoawal || 0),
    0,
  );
  const totalPemasukan = data.reduce(
    (sum, item) => sum + (item.Pemasukan || 0),
    0,
  );
  const totalPengeluaran = data.reduce(
    (sum, item) => sum + (item.Pengeluaran || 0),
    0,
  );
  const totalSaldoAkhir = data.reduce(
    (sum, item) => sum + (item.SaldoAkhir || 0),
    0,
  );
  const totalSelisih = data.reduce((sum, item) => sum + (item.selisih || 0), 0);

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
        {/* Header dengan informasi user */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mutasi Barang Jadi</h1>
            <p className="text-muted-foreground">
              {isFirstLoad
                ? "Pilih periode dan klik tampilkan untuk melihat data"
                : hasData && data.length > 0
                  ? `Laporan mutasi barang jadi periode ${formatDate(tgl1)} - ${formatDate(tgl2)}`
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

        {/* Kondisi Loading - Tampilkan loading spinner saja */}
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                Memuat Data...
              </h3>
              <p className="text-muted-foreground text-sm">
                Mohon tunggu sebentar
              </p>
            </CardContent>
          </Card>
        ) : isFirstLoad ? (
          /* Kondisi First Load - Belum pernah fetch data sama sekali */
          <Card className="border-2 border-dashed border-muted-foreground/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                Belum Ada Data
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Silakan pilih periode tanggal di atas dan klik tombol
                <span className="font-medium text-primary mx-1">
                  "Tampilkan"
                </span>
                untuk melihat laporan mutasi barang jadi.
              </p>
            </CardContent>
          </Card>
        ) : hasData && data.length > 0 ? (
          /* Kondisi Ada Data - Tampilkan semua konten */
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    Jumlah barang jadi
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo Awal
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(totalSaldoAwal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total stok awal
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pemasukan
                  </CardTitle>
                  <PlusCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(totalPemasukan)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total barang masuk
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pengeluaran
                  </CardTitle>
                  <MinusCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(totalPengeluaran)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total barang keluar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo Akhir
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(totalSaldoAkhir)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total stok akhir
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Selisih Alert */}
            {totalSelisih !== 0 && (
              <Alert variant={totalSelisih > 0 ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Terdapat selisih stok sebesar{" "}
                  {formatNumber(Math.abs(totalSelisih))}.
                  {totalSelisih > 0
                    ? " Stok fisik lebih banyak"
                    : " Stok fisik lebih sedikit"}{" "}
                  dari catatan.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* DataTable */}
            <Card>
              <CardContent className="p-6">
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
          /* Kondisi Data Kosong - Sudah fetch tapi tidak ada data */
          <Card className="border-2 border-dashed border-muted-foreground/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                Tidak Ada Data
              </h3>
              <p className="text-muted-foreground text-center">
                Tidak ditemukan data untuk periode yang dipilih.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Coba pilih rentang tanggal yang berbeda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
