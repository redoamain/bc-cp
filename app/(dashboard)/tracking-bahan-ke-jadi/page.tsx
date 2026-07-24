"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { FilterTanggal } from "@/components/filter-tanggal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import {
  RefreshCw,
  Package,
  AlertTriangle,
  Info,
  PackageX,
  Download,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  MinusCircle,
  AlertCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "../../contexts/UserContext";

// ============================================
// TYPE DEFINITIONS
// ============================================
interface ProduksiUsage {
  ProdID_Bahan: string;
  SPK: string;
  Tanggal_Produksi: string;
  Jumlah_Bahan: number;
  PIC_Bahan: string;
}

interface BarangJadi {
  ProdID_Hasil: string;
  ItemID: string;
  NamaBarang: string;
  Jumlah_Kgs: number;
  Tanggal_Produksi: string;
  SPK: string;
  PIC_Hasil: string;
}

interface TrackingItem {
  ItemID_Bahan: string;
  NamaBahan: string;
  JenisDokumen: string;
  NomorBPB: string;
  TanggalBPB: string | null;
  Pemasok: string;
  JumlahMasuk_Kgs: number;
  StokAwal: number;
  TotalStokTersedia: number;
  StockSekarang: number;
  DigunakanDiProduksi: ProduksiUsage[];
  TotalKgsTerpakai: number;
  PersentaseTerpakai: number;
  MenghasilkanBarangJadi: BarangJadi[];
  TotalBarangJadi: number;
  StatusStock: string;
  StatusBg: string;
  IsOverUsed: boolean;
}

// ============================================
// KOMPONEN CHILD
// ============================================

// Component untuk menampilkan detail stock
const StockDetail = ({ item }: { item: TrackingItem }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        <Info className="h-3 w-3" />
        {expanded ? "▼" : "▶"} Detail
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 text-xs bg-gray-50 p-2 rounded-lg min-w-50">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-500">Stok Awal:</span>
            <span className="font-medium">
              {(item.StokAwal || 0).toLocaleString()} 
            </span>
            <span className="text-gray-500">+ Masuk:</span>
            <span className="font-medium text-green-600">
              + {(item.JumlahMasuk_Kgs || 0).toLocaleString()} 
            </span>
            <span className="text-gray-500">= Tersedia:</span>
            <span className="font-medium">
              {(item.TotalStokTersedia || 0).toLocaleString()} 
            </span>
            <span className="text-gray-500">- Terpakai:</span>
            <span className="font-medium text-red-600">
              - {(item.TotalKgsTerpakai || 0).toLocaleString()} 
            </span>
            <div className="border-t pt-1 mt-1 col-span-2">
              <span className="font-bold">Stock Sekarang:</span>
              <span
                className={`font-bold ml-2 ${(item.StockSekarang || 0) < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {(item.StockSekarang || 0).toLocaleString()} 
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component untuk menampilkan pemakaian bahan di produksi
const ProduksiList = ({ produksiList }: { produksiList: ProduksiUsage[] }) => {
  const [expanded, setExpanded] = useState(false);

  if (!produksiList || produksiList.length === 0) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const totalKgs = produksiList.reduce(
    (sum, p) => sum + (p.Jumlah_Bahan || 0),
    0,
  );

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline"
      >
        {expanded ? "▼" : "▶"} {produksiList.length} produksi (
        {totalKgs.toLocaleString()} )
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto">
          {produksiList.map((prod, idx) => (
            <div
              key={idx}
              className="text-xs border-l-2 border-blue-300 pl-2 py-1"
            >
              <div className="font-medium">
                ProdID: {prod.ProdID_Bahan || "-"}
              </div>
              <div className="text-gray-500">SPK: {prod.SPK || "-"}</div>
              <div className="text-gray-700 font-medium">
                Jumlah: {(prod.Jumlah_Bahan || 0).toLocaleString()} 
              </div>
              <div className="text-gray-400">PIC: {prod.PIC_Bahan || "-"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component untuk menampilkan Barang Jadi
const BarangJadiList = ({
  barangJadiList,
}: {
  barangJadiList: BarangJadi[];
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!barangJadiList || barangJadiList.length === 0) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const totalJadi = barangJadiList.reduce(
    (sum, b) => sum + (b.Jumlah_Kgs || 0),
    0,
  );

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-green-600 hover:underline font-medium"
      >
        {expanded ? "▼" : "▶"} {barangJadiList.length} barang jadi (
        {totalJadi.toLocaleString()} )
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto">
          {barangJadiList.map((bj, idx) => (
            <div
              key={idx}
              className="text-xs border-l-2 border-green-300 pl-2 py-1"
            >
              <div className="font-medium text-green-700">
                {bj.NamaBarang || bj.ItemID}
              </div>
              <div className="text-gray-500">SPK: {bj.SPK || "-"}</div>
              <div className="text-gray-500">
                ProdID: {bj.ProdID_Hasil || "-"}
              </div>
              <div className="text-gray-700 font-medium">
                Jumlah: {(bj.Jumlah_Kgs || 0).toLocaleString()} 
              </div>
              <div className="text-gray-400">PIC: {bj.PIC_Hasil || "-"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// FUNGSI NOTIFIKASI TELEGRAM
// ============================================
const sendTelegramNotification = async (exportData: {
  fileName: string;
  periode: string;
  totalData: number;
  totalMasuk: number;
  totalTerpakai: number;
  totalBarangJadi: number;
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
          `📦 |TRACKING BAHAN BAKU → BARANG JADI DIEXPORT\n\n` +
          `📁 |File: ${exportData.fileName}\n` +
          `📅 |Periode: ${exportData.periode}\n` +
          `📊 |Total Item: ${exportData.totalData} bahan baku\n\n` +
          `📥 |Total Masuk: ${exportData.totalMasuk.toLocaleString("id-ID")} \n` +
          `⚙️ |Total Terpakai: ${exportData.totalTerpakai.toLocaleString("id-ID")} \n` +
          `📦 |Total Barang Jadi: ${exportData.totalBarangJadi.toLocaleString("id-ID")} \n\n` +
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

// ============================================
// KOLOM TABEL (SESUAI FRONTEND)
// ============================================
const columns: ColumnDef<TrackingItem>[] = [
  {
    accessorKey: "ItemID_Bahan",
    header: "Kode Bahan",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.ItemID_Bahan || "-"}
      </span>
    ),
  },
  {
    accessorKey: "NamaBahan",
    header: "Nama Bahan",
    size: 180,
    cell: ({ row }) => row.original.NamaBahan || "-",
  },
  {
    accessorKey: "JenisDokumen",
    header: "Jenis Dokumen",
    size: 120,
    cell: ({ row }) => row.original.JenisDokumen || "-",
  },
  {
    accessorKey: "NomorBPB",
    header: "No. BPB",
    size: 120,
    cell: ({ row }) => row.original.NomorBPB || "-",
  },
  {
    accessorKey: "TanggalBPB",
    header: "Tgl Masuk",
    size: 100,
    cell: ({ row }) => row.original.TanggalBPB || "-",
  },
  {
    accessorKey: "Pemasok",
    header: "Pemasok",
    size: 150,
    cell: ({ row }) => row.original.Pemasok || "-",
  },
  {
    accessorKey: "JumlahMasuk_Kgs",
    header: "Masuk ()",
    size: 100,
    cell: ({ row }) => (
      <span className="font-medium text-blue-600">
        {(row.original.JumlahMasuk_Kgs || 0).toLocaleString()}
      </span>
    ),
  },
  {
    id: "stok_awal",
    header: "Stok Awal",
    size: 80,
    cell: ({ row }) => {
      const stokAwal = row.original.StokAwal || 0;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span
                className={stokAwal > 0 ? "text-blue-600" : "text-gray-400"}
              >
                {stokAwal.toLocaleString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stock sebelum pemasukan periode ini</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "pemakaian",
    header: "Pemakaian",
    size: 180,
    cell: ({ row }) => {
      const item = row.original;
      const isOver = item.IsOverUsed || false;
      const totalTerpakai = item.TotalKgsTerpakai || 0;
      const totalTersedia = item.TotalStokTersedia || 0;
      const persentase = item.PersentaseTerpakai || 0;
      const safePersentase = Math.min(persentase, 100);

      if (totalTerpakai === 0 && totalTersedia === 0) {
        return (
          <span className="text-gray-400 text-xs">Belum ada pemakaian</span>
        );
      }

      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={isOver ? "text-red-600 font-bold" : ""}>
              {totalTerpakai.toLocaleString()} /{" "}
              {totalTersedia.toLocaleString()}
            </span>
            <span className={isOver ? "text-red-600 font-bold" : ""}>
              {persentase}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                isOver ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${safePersentase}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "produksi_detail",
    header: "Detail Produksi",
    size: 150,
    cell: ({ row }) => (
      <ProduksiList produksiList={row.original.DigunakanDiProduksi || []} />
    ),
  },
  {
    id: "menghasilkan",
    header: "Barang Jadi",
    size: 220,
    cell: ({ row }) => (
      <BarangJadiList
        barangJadiList={row.original.MenghasilkanBarangJadi || []}
      />
    ),
  },
  {
    id: "total_jadi",
    header: "Total Jadi",
    size: 80,
    cell: ({ row }) => (
      <span className="font-medium text-green-600">
        {(row.original.TotalBarangJadi || 0).toLocaleString()}
      </span>
    ),
  },
];

// ============================================
// COMPONENT UTAMA
// ============================================
export default function TrackingBahanKeJadiPage() {
  const today = new Date();
  const defaultTgl1 = format(
    new Date(today.getFullYear(), today.getMonth(), 1),
    "yyyy-MM-dd",
  );
  const defaultTgl2 = format(today, "yyyy-MM-dd");

  const [data, setData] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tgl1, setTgl1] = useState(defaultTgl1);
  const [tgl2, setTgl2] = useState(defaultTgl2);
  const [summary, setSummary] = useState({
    total_bahan: 0,
    total_jumlah_masuk: 0,
    total_terpakai: 0,
    total_barang_jadi: 0,
  });

  // User Context
  const { user, isLoading: userLoading } = useUser();

  const getUserInfo = useCallback(() => {
    if (!user) return { name: "Unknown", bagian: "Unknown" };
    const name =
      user.Nama || user.name || user.UserName || user.username || "Unknown";
    const bagian = user.Bagian || user.role || user.jabatan || "Unknown";
    return { name, bagian };
  }, [user]);

  const userInfo = getUserInfo();

  const fetchData = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tracking-bahan-ke-jadi?startDate=${startDate}&endDate=${endDate}`,
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setTgl1(startDate);
        setTgl2(endDate);
        setSummary(
          result.summary || {
            total_bahan: 0,
            total_jumlah_masuk: 0,
            total_terpakai: 0,
            total_barang_jadi: 0,
          },
        );
      } else {
        setError(result.error || "Gagal mengambil data");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(defaultTgl1, defaultTgl2);
  }, [fetchData, defaultTgl1, defaultTgl2]);

  const handleFilter = (startDate: string, endDate: string) => {
    fetchData(startDate, endDate);
  };

  // ============================================
  // FUNGSI EXPORT EXCEL (SIMPEL)
  // ============================================
  const exportToExcel = async () => {
    try {
      if (data.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const wb = XLSX.utils.book_new();

      // Header Laporan
      const reportTitle = "LAPORAN TRACKING BAHAN BAKU → BARANG JADI";
      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${data.length} item bahan baku`;

      // Header Kolom (SESUAI FRONTEND - Tanpa Status Stok & Over Used)
      const columnHeaders = [
        "No.",
        "Kode Bahan",
        "Nama Bahan",
        "Jenis Dokumen",
        "No. BPB",
        "Tgl Masuk",
        "Pemasok",
        "Pembelian",
        "Stok Awal",
        "Total Tersedia",
        "Terpakai",
        "Persentase",
        "Detail Produksi",
        "Barang Jadi",
        "Total Jadi",
      ];

      // Data Rows
      const dataRows = data.map((item, index) => {
        // Format Barang Jadi dengan rapi - per item di baris baru
        let barangJadiText = "-";
        if (
          item.MenghasilkanBarangJadi &&
          item.MenghasilkanBarangJadi.length > 0
        ) {
          barangJadiText = item.MenghasilkanBarangJadi.map((bj, idx) => {
            const nama = bj.NamaBarang || bj.ItemID || "-";
            const jumlah = (bj.Jumlah_Kgs || 0).toLocaleString();
            const spk = bj.SPK || "-";
            const pic = bj.PIC_Hasil || "-";
            // Format: [1] Nama Barang: 100  | SPK: SPK-001 | PIC: John
            return `[${idx + 1}] ${nama}: ${jumlah}  | SPK: ${spk} | PIC: ${pic}`;
          }).join("\n"); // Baris baru untuk setiap item
        }

        // Format Detail Produksi
        let produksiText = "-";
        if (item.DigunakanDiProduksi && item.DigunakanDiProduksi.length > 0) {
          produksiText = item.DigunakanDiProduksi.map((prod, idx) => {
            const jumlah = (prod.Jumlah_Bahan || 0).toLocaleString();
            const spk = prod.SPK || "-";
            const pic = prod.PIC_Bahan || "-";
            return `[${idx + 1}] SPK: ${spk} | ${jumlah}  | PIC: ${pic}`;
          }).join("\n");
        }

        return [
          index + 1,
          item.ItemID_Bahan || "-",
          item.NamaBahan || "-",
          item.JenisDokumen || "-",
          item.NomorBPB || "-",
          item.TanggalBPB || "-",
          item.Pemasok || "-",
          item.JumlahMasuk_Kgs || 0,
          item.StokAwal || 0,
          item.TotalStokTersedia || 0,
          item.TotalKgsTerpakai || 0,
          `${item.PersentaseTerpakai || 0}%`,
          produksiText,
          barangJadiText,
          item.TotalBarangJadi || 0,
        ];
      });

      // Hitung Total
      const totalMasuk = data.reduce(
        (sum, item) => sum + (item.JumlahMasuk_Kgs || 0),
        0,
      );
      const totalStokAwal = data.reduce(
        (sum, item) => sum + (item.StokAwal || 0),
        0,
      );
      const totalTersedia = data.reduce(
        (sum, item) => sum + (item.TotalStokTersedia || 0),
        0,
      );
      const totalTerpakai = data.reduce(
        (sum, item) => sum + (item.TotalKgsTerpakai || 0),
        0,
      );
      const totalBarangJadi = data.reduce(
        (sum, item) => sum + (item.TotalBarangJadi || 0),
        0,
      );

      // Baris Total
      const totalRows = [
        [], // Baris kosong
        [
          "TOTAL",
          "",
          "",
          "",
          "",
          "",
          "",
          totalMasuk.toLocaleString("id-ID"),
          totalStokAwal.toLocaleString("id-ID"),
          totalTersedia.toLocaleString("id-ID"),
          totalTerpakai.toLocaleString("id-ID"),
          "",
          "",
          "",
          totalBarangJadi.toLocaleString("id-ID"),
        ],
        [],
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

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge Cells
      if (!ws["!merges"]) ws["!merges"] = [];
      const lastColIndex = 14; // 15 kolom (0-14)

      // Merge header laporan
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } });

      // Merge baris TOTAL
      ws["!merges"].push({
        s: { r: wsData.length - 3, c: 0 },
        e: { r: wsData.length - 3, c: 6 },
      });

      // Merge akhir laporan
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: lastColIndex },
      });

      // Lebar Kolom
      ws["!cols"] = [
        { wch: 6 }, // No.
        { wch: 15 }, // Kode Bahan
        { wch: 30 }, // Nama Bahan
        { wch: 15 }, // Jenis Dokumen
        { wch: 15 }, // No. BPB
        { wch: 15 }, // Tgl Masuk
        { wch: 25 }, // Pemasok
        { wch: 15 }, // Masuk ()
        { wch: 18 }, // Stok Awal ()
        { wch: 18 }, // Total Tersedia ()
        { wch: 18 }, // Terpakai ()
        { wch: 15 }, // Persentase
        { wch: 60 }, // Detail Produksi
        { wch: 80 }, // Barang Jadi (diperbesar untuk multi-line)
        { wch: 18 }, // Total Jadi ()
      ];

      // Set row heights - penting untuk wrap text
      ws["!rows"] = [
        { hpt: 30 }, // Baris 1 (judul)
        { hpt: 20 }, // Baris 2 (periode)
        { hpt: 20 }, // Baris 3 (tanggal cetak)
        { hpt: 20 }, // Baris 4 (total data)
        { hpt: 5 }, // Baris 5 (kosong)
        { hpt: 25 }, // Baris 6 (header)
      ];

      // Enable wrap text untuk kolom Barang Jadi dan Detail Produksi
      // (Ini akan membuat teks dengan \n terbaca sebagai new line)
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) continue;
          if (!ws[addr].s) ws[addr].s = {};
          // Apply wrap text for columns: Detail Produksi (col 12) dan Barang Jadi (col 13)
          if (C === 12 || C === 13) {
            ws[addr].s.alignment = { wrapText: true, vertical: "top" };
          } else {
            ws[addr].s.alignment = { wrapText: false, vertical: "center" };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Tracking Bahan");

      const fileName = `TRACKING_BAHAN_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // Kirim notifikasi Telegram
      await sendTelegramNotification({
        fileName,
        periode: `${format(new Date(tgl1), "dd MMM yyyy")} - ${format(new Date(tgl2), "dd MMM yyyy")}`,
        totalData: data.length,
        totalMasuk,
        totalTerpakai,
        totalBarangJadi,
        userAgent: navigator.userAgent,
        userName: userInfo.name,
        userBagian: userInfo.bagian,
      });
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengexport data");
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Loading state
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
            <h1 className="text-3xl font-bold">
              Tracking Bahan Baku → Barang Jadi
            </h1>
            <p className="text-muted-foreground">
              Bahan dari pemasukan yang dipakai di produksi dan barang jadi yang
              dihasilkan
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

        {/* Filter */}
        <FilterTanggal
          onFilter={handleFilter}
          isLoading={loading}
          defaultTgl1={tgl1}
          defaultTgl2={tgl2}
        />

        {/* Info Card - Panduan */}
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Panduan Tracking Bahan Baku → Barang Jadi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50">
                <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Kode & Nama Bahan</p>
                  <p className="text-xs text-muted-foreground">
                    Identitas bahan baku yang dilacak
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50">
                <PlusCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Masuk & Stok</p>
                  <p className="text-xs text-muted-foreground">
                    Jumlah masuk, stok awal, dan total tersedia
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50">
                <MinusCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Pemakaian</p>
                  <p className="text-xs text-muted-foreground">
                    Total terpakai dan persentase pemakaian
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-50">
                <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Detail Produksi</p>
                  <p className="text-xs text-muted-foreground">
                    Rincian pemakaian di setiap produksi
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50">
                <Package className="h-4 w-4 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Barang Jadi</p>
                  <p className="text-xs text-muted-foreground">
                    Hasil produksi dari bahan baku
                  </p>
                </div>
              </div>
            </div>
        
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Bahan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{summary.total_bahan || 0}</p>
              <p className="text-xs text-muted-foreground">Item bahan baku</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {(summary.total_jumlah_masuk || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground"></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">
                Total Terpakai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {(summary.total_terpakai || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground"></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Barang Jadi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {(summary.total_barang_jadi || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground"></p>
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

        {/* Data Table */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PackageX className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada data untuk periode yang dipilih</p>
                <p className="text-xs mt-1">
                  Coba pilih rentang tanggal yang berbeda
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                searchKey="NamaBahan"
                searchPlaceholder="Cari nama bahan, kode item, atau jenis dokumen..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
