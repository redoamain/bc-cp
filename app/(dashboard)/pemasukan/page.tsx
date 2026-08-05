/* eslint-disable @typescript-eslint/no-explicit-any */
// app/pemasukan/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PemasukanType } from "@/lib/types";
import { getPemasukan } from "@/lib/services/pemasukanService";
import { columns } from "../../../components/pemasukan/columns";
import { DataTable } from "@/components/data-table";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../contexts/UserContext";

const formatDate = (date: Date | string) => {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};

// Fungsi untuk mengirim notifikasi Telegram (async, tidak blocking)
const sendTelegramNotification = async (data: {
  type: "export" | "empty_data_check";
  periode?: string;
  totalData?: number;
  totalUSD?: number;
  totalIDR?: number;
  totalJumlah?: number;
  fileName?: string;
  userAgent?: string;
  userName?: string;
  userBagian?: string;
  emptyFields?: {
    field: string;
    count: number;
    examples: any[];
  }[];
  emptyDataCount?: number;
  totalDataChecked?: number;
}) => {
  try {
    let message = "";

    if (data.type === "export") {
      message =
        `📊 |LAPORAN PEMASUKAN DIEXPORT\n\n` +
        `📁 |File: ${data.fileName || "Unknown"}\n` +
        `📅 |Periode: ${data.periode || "Unknown"}\n` +
        `📦 |Total Data: ${data.totalData || 0} transaksi\n` +
        `📦 |Total Quantity: ${(data.totalJumlah || 0).toLocaleString()}\n` +
        `💵 |Total USD: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.totalUSD || 0)}\n` +
        `💰 |Total IDR: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(data.totalIDR || 0)}\n` +
        `🕐 |Waktu Export: ${format(new Date(), "dd MMM yyyy HH:mm:ss", { locale: id })}\n` +
        `👤 |Diekspor oleh: ${data.userName || "Unknown"} ${data.userBagian ? `(${data.userBagian})` : ""}\n` +
        `💻 |User Agent: ${data.userAgent || "Unknown"}`;
    } else if (data.type === "empty_data_check") {
      message =
        `⚠️ |PENGECEKAN DATA KOSONG\n\n` +
        `📅 |Periode: ${data.periode || "Unknown"}\n` +
        `📊 |Total Data Dicek: ${data.totalDataChecked || 0} transaksi\n` +
        `🚨 |Data Bermasalah: ${data.emptyDataCount || 0} transaksi\n\n` +
        `📋 |DETAIL FIELD KOSONG:\n`;

      if (data.emptyFields && data.emptyFields.length > 0) {
        data.emptyFields.forEach((field) => {
          message += `\n• ${field.field}: ${field.count} data kosong\n`;
          if (field.examples && field.examples.length > 0) {
            message += `  Contoh No. Dokumen: ${field.examples
              .slice(0, 3)
              .map((ex: any) => ex.NomorDokPabean || "-")
              .join(", ")}\n`;
          }
        });
      }

      message += `\n🕐 |Waktu Pengecekan: ${format(new Date(), "dd MMM yyyy HH:mm:ss", { locale: id })}\n`;
      message += `👤 |Dicek oleh: ${data.userName || "Unknown"} ${data.userBagian ? `(${data.userBagian})` : ""}`;
    }

    // Kirim notifikasi tanpa blocking
    fetch("/api/notif", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        parseMode: "Markdown",
      }),
    }).catch((error) => {
      console.error("Error sending Telegram notification:", error);
    });
  } catch (error) {
    console.error("Error in sendTelegramNotification:", error);
  }
};

// Fungsi untuk mengecek data kosong (dioptimasi)
const checkEmptyFields = (data: PemasukanType[]) => {
  if (!data || data.length === 0) {
    return [];
  }

  const fieldsToCheck = [
    { key: "NomorDokPabean", label: "No. Dokumen" },
    { key: "TanggalDokPabean", label: "Tgl Dokumen" },
    { key: "NomorBPB", label: "No. BPB" },
    { key: "TanggalBPB", label: "Tgl BPB" },
    { key: "PemasokPengirim", label: "Pemasok/Pengirim" },
    { key: "kodebarang", label: "Kode Barang" },
    { key: "Namabarang", label: "Nama Barang" },
    { key: "Jumlah", label: "Jumlah" },
    { key: "Satuan", label: "Satuan" },
    { key: "NilaiBarang", label: "Nilai Barang" },
    { key: "CURR", label: "Currency" },
    { key: "Nopol", label: "No. Container/Plate" },
  ];

  const emptyFields = [];

  // Optimasi: gunakan for loop biasa untuk performance
  for (const field of fieldsToCheck) {
    const key = field.key as keyof PemasukanType;
    let count = 0;
    const examples = [];

    // Single pass untuk menghitung dan mengambil contoh
    for (const item of data) {
      const value = item[key];
      const isEmpty =
        !value ||
        value === "" ||
        value === 0 ||
        value === null ||
        value === undefined;

      if (isEmpty) {
        count++;
        if (examples.length < 5) {
          examples.push(item);
        }
      }
    }

    if (count > 0) {
      emptyFields.push({
        field: field.label,
        key: field.key,
        count,
        examples,
      });
    }
  }

  return emptyFields;
};

export default function PemasukanPage() {
  // Initialize dengan tanggal default
  const today = new Date();
  const defaultTgl2 = format(today, "yyyy-MM-dd");
  const defaultTgl1 = format(
    new Date(today.getFullYear(), today.getMonth(), 1),
    "yyyy-MM-dd",
  );

  const [data, setData] = useState<PemasukanType[]>([]);
  const [filteredData, setFilteredData] = useState<PemasukanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tgl1, setTgl1] = useState(defaultTgl1);
  const [tgl2, setTgl2] = useState(defaultTgl2);
  const [jenisFilter, setJenisFilter] = useState("");

  // Ref untuk mencegah multiple fetch
  const isFetchingRef = useRef(false);
  const isCheckingEmptyRef = useRef(false);

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

  // Fungsi untuk melakukan pengecekan data kosong (async, tidak blocking)
  const checkAndNotifyEmptyData = useCallback(
    async (
      dataToCheck: PemasukanType[] | undefined,
      periodStart: string,
      periodEnd: string,
    ) => {
      // Prevent multiple concurrent checks
      if (isCheckingEmptyRef.current) return;
      isCheckingEmptyRef.current = true;

      try {
        // Cek apakah data valid
        if (!dataToCheck || dataToCheck.length === 0) {
          isCheckingEmptyRef.current = false;
          return;
        }

        // Gunakan setTimeout untuk tidak blocking UI
        await new Promise((resolve) => setTimeout(resolve, 100));

        const emptyFieldsResult = checkEmptyFields(dataToCheck);
        const totalEmptyData = emptyFieldsResult.reduce(
          (sum, field) => sum + field.count,
          0,
        );

        if (emptyFieldsResult.length > 0) {
          // Kirim notifikasi di background
          await sendTelegramNotification({
            type: "empty_data_check",
            periode: `${formatDate(periodStart)} - ${formatDate(periodEnd)}`,
            totalDataChecked: dataToCheck.length,
            emptyDataCount: totalEmptyData,
            emptyFields: emptyFieldsResult,
            userName: userInfo.name,
            userBagian: userInfo.bagian,
            userAgent: navigator.userAgent,
          });
        } else {
          console.log("✅ Tidak ada data kosong pada periode ini");
        }
      } catch (error) {
        console.error("Error checking empty data:", error);
      } finally {
        isCheckingEmptyRef.current = false;
      }
    },
    [userInfo],
  );

  const fetchData = useCallback(
    async (tglAwal: string, tglAkhir: string) => {
      // Prevent multiple concurrent fetches
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      setLoading(true);
      setError(null);

      try {
        console.log("📅 Fetching data for period:", tglAwal, "to", tglAkhir);

        const response = await getPemasukan(tglAwal, tglAkhir);

        console.log("📦 API Response:", response);

        if (response.success && response.data) {
          // Pastikan response.data adalah array
          const responseData = response.data || [];
          setData(responseData);
          setFilteredData(responseData);
          setTgl1(tglAwal);
          setTgl2(tglAkhir);

          // Lakukan pengecekan data kosong di background (tidak blocking UI)
          // Gunakan requestAnimationFrame atau setTimeout untuk defer
          requestAnimationFrame(() => {
            checkAndNotifyEmptyData(responseData, tglAwal, tglAkhir);
          });
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
        isFetchingRef.current = false;
      }
    },
    [checkAndNotifyEmptyData],
  );

  // Initial fetch
  useEffect(() => {
    fetchData(defaultTgl1, defaultTgl2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filter when jenisFilter changes (optimasi)
  useEffect(() => {
    if (jenisFilter && data && data.length > 0) {
      const filtered = data.filter(
        (item) =>
          item.JenisDokPabean?.toLowerCase() === jenisFilter.toLowerCase(),
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data || []);
    }
  }, [jenisFilter, data]);

  const handleFilter = (tglAwal: string, tglAkhir: string) => {
    fetchData(tglAwal, tglAkhir);
  };

  const totalJumlah = filteredData.reduce(
    (sum, item) => sum + (item.Jumlah || 0),
    0,
  );

  // Fungsi export
  const exportToExcel = async () => {
    try {
      if (filteredData.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const wb = XLSX.utils.book_new();
      let ws: XLSX.WorkSheet;

      const reportTitle = "LAPORAN PEMASUKAN BARANG";
      const periode = `Periode: ${formatDate(tgl1)} - ${formatDate(tgl2)}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm")}`;
      const totalData = `Total Data: ${filteredData.length} transaksi`;

      const headerRows = [
        [reportTitle],
        [periode],
        [tanggalCetak],
        [totalData],
        [],
      ];

      const columnHeaders = [
        "No.",
        "Jenis Dokumen",
        "No. Dokumen",
        "Tgl Dokumen",
        "No. BPB",
        "Tgl BPB",
        "Pemasok/Pengirim",
        "Kode Barang",
        "Nama Barang",
        "Jumlah",
        "Satuan",
        "Curr",
        "Nilai Barang",
        "No. Container / Plate Number",
      ];

      const dataRows = filteredData.map((item, index) => [
        index + 1,
        item.JenisDokPabean || "-",
        item.NomorDokPabean || "-",
        item.TanggalDokPabean
          ? format(new Date(item.TanggalDokPabean), "dd/MM/yyyy")
          : "-",
        item.NomorBPB || "-",
        item.TanggalBPB ? format(new Date(item.TanggalBPB), "dd/MM/yyyy") : "-",
        item.PemasokPengirim || "-",
        item.kodebarang || "-",
        item.Namabarang || "-",
        item.Jumlah || 0,
        item.Satuan || "-",
        item.CURR || "USD",
        item.NilaiBarang || 0,
        item.Nopol || "-",
      ]);

      const wsData = [...headerRows, columnHeaders, ...dataRows, []];
      ws = XLSX.utils.aoa_to_sheet(wsData);

      if (!ws["!merges"]) ws["!merges"] = [];
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 14 } });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 14 } });
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 14 } });
      ws["!merges"].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 14 } });
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: 14 },
      });

      ws["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 35 },
        { wch: 15 },
        { wch: 45 },
        { wch: 12 },
        { wch: 8 },
        { wch: 8 },
        { wch: 18 },
        { wch: 15 },
      ];

      ws["!rows"] = [
        { hpt: 30 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 5 },
        { hpt: 25 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Pemasukan");
      const fileName = `LAPORAN_PEMASUKAN_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);

      const totalUSD = filteredData
        .filter((item) => item.CURR === "USD")
        .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

      const totalIDR = filteredData
        .filter((item) => item.CURR === "IDR")
        .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

      await sendTelegramNotification({
        type: "export",
        fileName,
        periode: `${formatDate(tgl1)} - ${formatDate(tgl2)}`,
        totalData: filteredData.length,
        totalUSD,
        totalIDR,
        totalJumlah,
        userAgent: navigator.userAgent,
        userName: userInfo.name,
        userBagian: userInfo.bagian,
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
    .filter((item) => item.CURR === "USD")
    .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

  const totalIDR = filteredData
    .filter((item) => item.CURR === "IDR")
    .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

  const countUSD = filteredData.filter((item) => item.CURR === "USD").length;
  const countIDR = filteredData.filter((item) => item.CURR === "IDR").length;

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
            <h1 className="text-3xl font-bold">Data Pemasukan</h1>
            <p className="text-muted-foreground">
              Laporan pemasukan barang periode {formatDate(tgl1)} -{" "}
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total USD
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total IDR
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
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
            Menampilkan {filteredData.length} data pemasukan
            {jenisFilter && ` (filter: ${jenisFilter})`}
          </div>
        )}
      </div>
    </div>
  );
}
