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
import { Badge } from "@/components/ui/badge";

// ============================================
// TYPE DEFINITIONS
// ============================================
interface PemakaianDetail {
  No_Transaksi: string;
  SPK: string;
  Tanggal: string;
  Jumlah: number;
  PIC: string;
  Keterangan: string;
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
  ItemID_Original: string;
  ItemID_Bahan: string;
  NamaBahan: string;
  Kategori: string;
  JenisDokumen: string;
  NomorBPB: string;
  TanggalBPB: string | null;
  Pemasok: string;
  JumlahMasuk_Kgs: number;
  StokAwal: number; // <-- TAMBAHKAN STOK AWAL
  DigunakanDiProduksi: PemakaianDetail[];
  TotalKgsTerpakai: number;
  MenghasilkanBarangJadi: BarangJadi[];
  TotalBarangJadi: number;
  HasPemakaian: boolean;
  JumlahPemakaian: number;
}

// ============================================
// KOMPONEN CHILD
// ============================================

// Component untuk menampilkan pemakaian
const PemakaianList = ({
  pemakaianList,
}: {
  pemakaianList: PemakaianDetail[];
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!pemakaianList || pemakaianList.length === 0) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const totalKgs = pemakaianList.reduce((sum, p) => sum + (p.Jumlah || 0), 0);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline"
      >
        {expanded ? "▼" : "▶"} {pemakaianList.length} pemakaian (
        {totalKgs.toLocaleString()} )
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto">
          {pemakaianList.map((item, idx) => (
            <div
              key={idx}
              className="text-xs border-l-2 border-blue-300 pl-2 py-1"
            >
              <div className="font-medium">{item.No_Transaksi || "-"}</div>
              {item.SPK && item.SPK !== "-" && (
                <div className="text-gray-500">SPK: {item.SPK}</div>
              )}
              <div className="text-gray-700 font-medium">
                Jumlah: {(item.Jumlah || 0).toLocaleString()} 
              </div>
              {item.Keterangan && item.Keterangan !== "-" && (
                <div className="text-gray-400 text-[10px]">
                  {item.Keterangan}
                </div>
              )}
              <div className="text-gray-400">PIC: {item.PIC || "-"}</div>
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
// KOLOM TABEL
// ============================================
const columns: ColumnDef<TrackingItem>[] = [
  {
    accessorKey: "ItemID_Bahan",
    header: "Kode Bahan",
    size: 100,
    cell: ({ row }) => {
      const itemId = row.original.ItemID_Bahan || "-";
      const itemIdOriginal = row.original.ItemID_Original || "";

      if (itemIdOriginal.includes(", ")) {
        const parts = itemIdOriginal.split(", ");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="font-mono text-xs font-bold uppercase cursor-help">
                  {itemId}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Item ID Asli:</p>
                  {parts.map((p, i) => (
                    <div key={i}>• {p}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <span className="font-mono text-xs font-bold uppercase">{itemId}</span>
      );
    },
  },
  {
    accessorKey: "NamaBahan",
    header: "Nama Bahan",
    size: 180,
    cell: ({ row }) => row.original.NamaBahan || "-",
  },
  {
    accessorKey: "Kategori",
    header: "Kategori",
    size: 130,
    cell: ({ row }) => {
      const kategori = row.original.Kategori || "-";
      let badgeVariant = "bg-blue-50 text-blue-700 border-blue-200";
      if (kategori.toUpperCase() === "BAHAN BAKU") {
        badgeVariant = "bg-green-50 text-green-700 border-green-200";
      } else if (kategori.toUpperCase() === "BAHAN PENOLONG") {
        badgeVariant = "bg-yellow-50 text-yellow-700 border-yellow-200";
      }
      return (
        <Badge variant="outline" className={badgeVariant}>
          {kategori}
        </Badge>
      );
    },
  },
  {
    accessorKey: "JenisDokumen",
    header: "Jenis Dokumen",
    size: 150,
    cell: ({ row }) => {
      const text = row.original.JenisDokumen || "-";
      if (text.includes(" | ")) {
        const parts = text.split(" | ");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 cursor-help"
                >
                  {parts.length} jenis
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs space-y-1">
                  {parts.map((p, i) => (
                    <div key={i}>• {p}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return <span className="text-sm">{text}</span>;
    },
  },
  {
    accessorKey: "NomorBPB",
    header: "No. BPB",
    size: 120,
    cell: ({ row }) => {
      const text = row.original.NomorBPB || "-";
      if (text.includes(", ")) {
        const parts = text.split(", ");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 cursor-help"
                >
                  {parts.length} BPB
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Nomor BPB:</p>
                  {parts.map((p, i) => (
                    <div key={i}>• {p}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return <span className="text-sm font-mono">{text}</span>;
    },
  },
  {
    accessorKey: "TanggalBPB",
    header: "Tgl Masuk",
    size: 150,
    cell: ({ row }) => {
      const text = row.original.TanggalBPB || "-";
      if (text.includes(", ")) {
        const parts = text.split(", ");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 cursor-help"
                >
                  {parts.length} tanggal
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Tanggal Masuk:</p>
                  {parts.map((p, i) => (
                    <div key={i}>• {p}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return <span className="text-sm">{text}</span>;
    },
  },
  {
    accessorKey: "Pemasok",
    header: "Pemasok",
    size: 150,
    cell: ({ row }) => {
      const text = row.original.Pemasok || "-";
      if (text.includes(" | ")) {
        const parts = text.split(" | ");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 cursor-help"
                >
                  {parts.length} pemasok
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Pemasok:</p>
                  {parts.map((p, i) => (
                    <div key={i}>• {p}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return <span className="text-sm">{text}</span>;
    },
  },
  {
    accessorKey: "JumlahMasuk_Kgs",
    header: "Masuk ",
    size: 100,
    cell: ({ row }) => (
      <span className="font-medium text-blue-600">
        {(row.original.JumlahMasuk_Kgs || 0).toLocaleString()}
      </span>
    ),
  },
  // ============ KOLOM STOK AWAL ============
  {
    accessorKey: "StokAwal",
    header: "Stok Awal ",
    size: 100,
    cell: ({ row }) => {
      const stokAwal = row.original.StokAwal || 0;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span
                className={
                  stokAwal > 0 ? "text-blue-600 font-medium" : "text-gray-400"
                }
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
  // ==========================================
  {
    id: "pemakaian_detail",
    header: "Detail Pemakaian",
    size: 200,
    cell: ({ row }) => (
      <PemakaianList pemakaianList={row.original.DigunakanDiProduksi || []} />
    ),
  },
  {
    id: "total_terpakai",
    header: "Total Terpakai ",
    size: 120,
    cell: ({ row }) => (
      <span className="font-medium text-purple-600">
        {(row.original.TotalKgsTerpakai || 0).toLocaleString()}
      </span>
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
    header: "Total Jadi ",
    size: 100,
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
        console.log("📊 Data dari API:", result.data?.length);
        if (result.data && result.data.length > 0) {
          console.log("📊 Sample item:", result.data[0]);
        }
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
  // FUNGSI EXPORT EXCEL
  // ============================================
  const exportToExcel = async () => {
    try {
      if (data.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const wb = XLSX.utils.book_new();

      const reportTitle = "LAPORAN TRACKING BAHAN BAKU → BARANG JADI";
      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${data.length} item bahan baku`;

      const columnHeaders = [
        "No.",
        "Kode Bahan",
        "Nama Bahan",
        "Kategori",
        "Jenis Dokumen",
        "No. BPB",
        "Tgl Masuk",
        "Pemasok",
        "Masuk ",
        "Stok Awal ",
        "Detail Pemakaian",
        "Total Terpakai ",
        "Barang Jadi",
        "Total Jadi ",
      ];

      const dataRows = data.map((item, index) => {
        // Format Barang Jadi
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
            return `[${idx + 1}] ${nama}: ${jumlah}  | SPK: ${spk} | PIC: ${pic}`;
          }).join("\n");
        }

        // Format Detail Pemakaian
        let pemakaianText = "-";
        if (item.DigunakanDiProduksi && item.DigunakanDiProduksi.length > 0) {
          pemakaianText = item.DigunakanDiProduksi.map((p, idx) => {
            const spk = p.SPK !== "-" ? `SPK: ${p.SPK}` : "";
            const ket = p.Keterangan !== "-" ? ` | ${p.Keterangan}` : "";
            return `[${idx + 1}] ${p.No_Transaksi} ${spk} | ${p.Jumlah.toLocaleString()}  | PIC: ${p.PIC}${ket}`;
          }).join("\n");
        }

        return [
          index + 1,
          item.ItemID_Bahan || "-",
          item.NamaBahan || "-",
          item.Kategori || "-",
          item.JenisDokumen || "-",
          item.NomorBPB || "-",
          item.TanggalBPB || "-",
          item.Pemasok || "-",
          item.JumlahMasuk_Kgs || 0,
          item.StokAwal || 0,
          pemakaianText,
          item.TotalKgsTerpakai || 0,
          barangJadiText,
          item.TotalBarangJadi || 0,
        ];
      });

      const totalMasuk = data.reduce(
        (sum, item) => sum + (item.JumlahMasuk_Kgs || 0),
        0,
      );
      const totalStokAwal = data.reduce(
        (sum, item) => sum + (item.StokAwal || 0),
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

      const totalRows = [
        [],
        [
          "TOTAL",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          totalMasuk.toLocaleString("id-ID"),
          totalStokAwal.toLocaleString("id-ID"),
          "",
          totalTerpakai.toLocaleString("id-ID"),
          "",
          totalBarangJadi.toLocaleString("id-ID"),
        ],
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
      const lastColIndex = 13;

      if (!ws["!merges"]) ws["!merges"] = [];
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } });
      ws["!merges"].push({
        s: { r: wsData.length - 3, c: 0 },
        e: { r: wsData.length - 3, c: 7 },
      });
      ws["!merges"].push({
        s: { r: wsData.length - 1, c: 0 },
        e: { r: wsData.length - 1, c: lastColIndex },
      });

      ws["!cols"] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 60 },
        { wch: 18 },
        { wch: 80 },
        { wch: 18 },
      ];

      ws["!rows"] = [
        { hpt: 30 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 5 },
        { hpt: 25 },
      ];

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) continue;
          if (!ws[addr].s) ws[addr].s = {};
          if (C === 10 || C === 12) {
            ws[addr].s.alignment = { wrapText: true, vertical: "top" };
          } else {
            ws[addr].s.alignment = { wrapText: false, vertical: "center" };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Tracking Bahan");
      const fileName = `TRACKING_BAHAN_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);

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

        <FilterTanggal
          onFilter={handleFilter}
          isLoading={loading}
          defaultTgl1={tgl1}
          defaultTgl2={tgl2}
        />

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
                  <p className="font-medium text-sm">Masuk & Stok Awal</p>
                  <p className="text-xs text-muted-foreground">
                    Jumlah pemasukan dan stok awal 
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50">
                <MinusCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Pemakaian</p>
                  <p className="text-xs text-muted-foreground">
                    Total dan detail pemakaian di produksi 
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-50">
                <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Detail Pemakaian</p>
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
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
