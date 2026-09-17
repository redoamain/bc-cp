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
  Satuan_Bahan?: string;
  PIC_Bahan: string;
}

interface BarangJadi {
  ProdID_Hasil: string;
  ItemID: string;
  NamaBarang: string;
  Satuan?: string;
  Jumlah?: number;
  Jumlah_Kgs?: number;
  Tanggal_Produksi: string;
  SPK: string;
  PIC_Hasil: string;
}

interface PemasukanDetail {
  nomorBPB: string;
  tanggalBPB: string | null;
  jumlah: number;
  satuan?: string;
  pemasok: string;
  jenisDokumen: string;
  nomorPO?: string;
  nomorDokumen?: string;
}

interface TrackingItem {
  ItemID_Bahan: string;
  NamaBahan: string;
  Satuan: string;
  JenisDokumen: string;
  NomorBPB: string;
  TanggalBPB: string | null;
  Pemasok: string;
  JumlahMasuk: number;
  JumlahMasuk_Kgs?: number;
  DaftarPemasukan?: PemasukanDetail[];
  TotalBPBCount?: number;
  StokAwal: number;
  TotalStokTersedia: number;
  StockSekarang: number;
  DigunakanDiProduksi: ProduksiUsage[];
  TotalTerpakai: number;
  TotalKgsTerpakai?: number;
  PersentaseTerpakai: number;
  MenghasilkanBarangJadi: BarangJadi[];
  TotalBarangJadi?: number;
  SatuanBarangJadi?: string;
  StatusStock: string;
  StatusBg: string;
  IsOverUsed: boolean;
}

interface SummaryData {
  total_bahan: number;
  total_jumlah_masuk: number;
  total_terpakai: number;
  total_barang_jadi?: number;
  breakdown_masuk?: Record<string, number>;
  breakdown_jadi?: Record<string, number>;
}

// ============================================
// KOMPONEN CHILD
// ============================================

// Component untuk menampilkan rincian BPB jika bahan masuk beberapa kali
const BPBList = ({
  bpbList,
  defaultNomorBPB,
  defaultSatuan,
}: {
  bpbList?: PemasukanDetail[];
  defaultNomorBPB: string;
  defaultSatuan?: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!bpbList || bpbList.length <= 1) {
    return <span className="font-mono text-xs">{defaultNomorBPB || "-"}</span>;
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium font-mono"
      >
        {expanded ? "▼" : "▶"} {bpbList.length} BPB
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 max-h-48 overflow-auto bg-slate-50 p-2 rounded-md border border-slate-200 text-xs min-w-52 shadow-xs">
          {bpbList.map((bpb, idx) => (
            <div
              key={idx}
              className="border-b border-slate-200 pb-1.5 last:border-0 last:pb-0"
            >
              <div className="font-semibold text-slate-800 font-mono">
                {bpb.nomorBPB || "-"}
              </div>
              <div className="flex justify-between text-slate-500 mt-0.5">
                <span>{bpb.tanggalBPB || "-"}</span>
                <span className="font-medium text-blue-600">
                  {(bpb.jumlah || 0).toLocaleString()}{" "}
                  {bpb.satuan || defaultSatuan || ""}
                </span>
              </div>
              {bpb.pemasok && bpb.pemasok !== "-" && (
                <div className="text-[10px] text-slate-400 truncate max-w-48">
                  {bpb.pemasok}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component untuk menampilkan pemakaian bahan di produksi
const ProduksiList = ({
  produksiList,
  satuanBahan,
}: {
  produksiList: ProduksiUsage[];
  satuanBahan?: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!produksiList || produksiList.length === 0) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const total = produksiList.reduce(
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
        {total.toLocaleString()} {satuanBahan || ""})
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
                Jumlah: {(prod.Jumlah_Bahan || 0).toLocaleString()}{" "}
                {prod.Satuan_Bahan || satuanBahan || ""}
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
  satuanJadi,
}: {
  barangJadiList: BarangJadi[];
  satuanJadi?: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!barangJadiList || barangJadiList.length === 0) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const totalJadi = barangJadiList.reduce(
    (sum, b) => sum + (b.Jumlah || b.Jumlah_Kgs || 0),
    0,
  );

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-green-600 hover:underline font-medium"
      >
        {expanded ? "▼" : "▶"} {barangJadiList.length} barang jadi (
        {totalJadi.toLocaleString()} {satuanJadi || ""})
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto">
          {barangJadiList.map((bj, idx) => (
            <div
              key={idx}
              className="text-xs border-l-2 border-green-300 pl-2 py-1"
            >
              <div className="font-medium text-green-700">
                {bj.NamaBarang && bj.NamaBarang !== "-"
                  ? bj.NamaBarang
                  : bj.ItemID}
              </div>
              <div className="text-gray-500">SPK: {bj.SPK || "-"}</div>
              <div className="text-gray-500">
                ProdID: {bj.ProdID_Hasil || "-"}
              </div>
              <div className="text-gray-700 font-medium">
                Jumlah: {(bj.Jumlah || bj.Jumlah_Kgs || 0).toLocaleString()}{" "}
                {bj.Satuan || satuanJadi || "PCS"}
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
          `📥 |Total Masuk: ${exportData.totalMasuk.toLocaleString("id-ID")}\n` +
          `⚙️ |Total Terpakai: ${exportData.totalTerpakai.toLocaleString("id-ID")}\n\n` +
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
    size: 110,
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
    accessorKey: "Satuan",
    header: "Satuan",
    size: 80,
    cell: ({ row }) => (
      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-medium">
        {row.original.Satuan || "-"}
      </span>
    ),
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
    size: 130,
    cell: ({ row }) => (
      <BPBList
        bpbList={row.original.DaftarPemasukan}
        defaultNomorBPB={row.original.NomorBPB}
        defaultSatuan={row.original.Satuan}
      />
    ),
  },
  {
    accessorKey: "TanggalBPB",
    header: "Tgl Masuk",
    size: 120,
    cell: ({ row }) => row.original.TanggalBPB || "-",
  },
  {
    accessorKey: "Pemasok",
    header: "Pemasok",
    size: 160,
    cell: ({ row }) => row.original.Pemasok || "-",
  },
  {
    accessorKey: "JumlahMasuk",
    header: "Masuk",
    size: 120,
    cell: ({ row }) => {
      const bpbCount =
        row.original.TotalBPBCount ||
        row.original.DaftarPemasukan?.length ||
        1;
      const jumlah =
        row.original.JumlahMasuk ||
        row.original.JumlahMasuk_Kgs ||
        0;
      return (
        <div>
          <span className="font-medium text-blue-600">
            {jumlah.toLocaleString()} {row.original.Satuan || ""}
          </span>
          {bpbCount > 1 && (
            <span className="block text-[10px] text-slate-400 font-normal">
              ({bpbCount} BPB)
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "stok_awal",
    header: "Stok Awal",
    size: 100,
    cell: ({ row }) => {
      const stokAwal = row.original.StokAwal || 0;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span
                className={stokAwal > 0 ? "text-blue-600 font-medium" : "text-gray-400"}
              >
                {stokAwal.toLocaleString()} {row.original.Satuan || ""}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stok sebelum pemasukan periode ini</p>
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
      const totalTerpakai =
        item.TotalTerpakai !== undefined
          ? item.TotalTerpakai
          : item.TotalKgsTerpakai || 0;
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
              {totalTersedia.toLocaleString()} {item.Satuan || ""}
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
    size: 170,
    cell: ({ row }) => (
      <ProduksiList
        produksiList={row.original.DigunakanDiProduksi || []}
        satuanBahan={row.original.Satuan}
      />
    ),
  },
  {
    id: "menghasilkan",
    header: "Barang Jadi",
    size: 250,
    cell: ({ row }) => (
      <BarangJadiList
        barangJadiList={row.original.MenghasilkanBarangJadi || []}
        satuanJadi={row.original.SatuanBarangJadi}
      />
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
  const [summary, setSummary] = useState<SummaryData>({
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

  // Helper breakdown text
  const formatBreakdown = (breakdown?: Record<string, number>) => {
    if (!breakdown || Object.keys(breakdown).length === 0) return null;
    const entries = Object.entries(breakdown);
    if (entries.length === 1) return null;
    return entries
      .map(([unit, qty]) => `${qty.toLocaleString()} ${unit}`)
      .join(" • ");
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

      // Header Laporan
      const reportTitle = "LAPORAN TRACKING BAHAN BAKU → BARANG JADI";
      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${data.length} item bahan baku`;

      // Header Kolom (Tanpa Total Jadi)
      const columnHeaders = [
        "No.",
        "Kode Bahan",
        "Nama Bahan",
        "Satuan",
        "Jenis Dokumen",
        "No. BPB",
        "Tgl Masuk",
        "Pemasok",
        "Masuk",
        "Stok Awal",
        "Total Tersedia",
        "Terpakai",
        "Persentase",
        "Detail Produksi",
        "Barang Jadi",
      ];

      // Data Rows
      const dataRows = data.map((item, index) => {
        const satuanBahan = item.Satuan || "";
        const satuanJadi = item.SatuanBarangJadi || "PCS";

        // Format Barang Jadi dengan rapi
        let barangJadiText = "-";
        if (
          item.MenghasilkanBarangJadi &&
          item.MenghasilkanBarangJadi.length > 0
        ) {
          barangJadiText = item.MenghasilkanBarangJadi.map((bj, idx) => {
            const nama = bj.NamaBarang || bj.ItemID || "-";
            const jumlah = (bj.Jumlah || bj.Jumlah_Kgs || 0).toLocaleString();
            const unit = bj.Satuan || satuanJadi;
            const spk = bj.SPK || "-";
            const pic = bj.PIC_Hasil || "-";
            return `[${idx + 1}] ${nama}: ${jumlah} ${unit} | SPK: ${spk} | PIC: ${pic}`;
          }).join("\n");
        }

        // Format Detail Produksi
        let produksiText = "-";
        if (item.DigunakanDiProduksi && item.DigunakanDiProduksi.length > 0) {
          produksiText = item.DigunakanDiProduksi.map((prod, idx) => {
            const jumlah = (prod.Jumlah_Bahan || 0).toLocaleString();
            const unit = prod.Satuan_Bahan || satuanBahan;
            const spk = prod.SPK || "-";
            const pic = prod.PIC_Bahan || "-";
            return `[${idx + 1}] SPK: ${spk} | ${jumlah} ${unit} | PIC: ${pic}`;
          }).join("\n");
        }

        // Format No. BPB untuk Excel
        let bpbText = item.NomorBPB || "-";
        if (item.DaftarPemasukan && item.DaftarPemasukan.length > 1) {
          bpbText = item.DaftarPemasukan.map(
            (b, i) =>
              `[${i + 1}] ${b.nomorBPB} (${(b.jumlah || 0).toLocaleString()} ${b.satuan || satuanBahan})`,
          ).join("\n");
        }

        const jumlahMasuk =
          item.JumlahMasuk || item.JumlahMasuk_Kgs || 0;
        const totalTerpakai =
          item.TotalTerpakai !== undefined
            ? item.TotalTerpakai
            : item.TotalKgsTerpakai || 0;

        return [
          index + 1,
          item.ItemID_Bahan || "-",
          item.NamaBahan || "-",
          satuanBahan || "-",
          item.JenisDokumen || "-",
          bpbText,
          item.TanggalBPB || "-",
          item.Pemasok || "-",
          jumlahMasuk,
          item.StokAwal || 0,
          item.TotalStokTersedia || 0,
          totalTerpakai,
          `${item.PersentaseTerpakai || 0}%`,
          produksiText,
          barangJadiText,
        ];
      });

      // Hitung Total
      const totalMasuk = data.reduce(
        (sum, item) => sum + (item.JumlahMasuk || item.JumlahMasuk_Kgs || 0),
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
        (sum, item) =>
          sum +
          (item.TotalTerpakai !== undefined
            ? item.TotalTerpakai
            : item.TotalKgsTerpakai || 0),
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
          "",
          totalMasuk.toLocaleString("id-ID"),
          totalStokAwal.toLocaleString("id-ID"),
          totalTersedia.toLocaleString("id-ID"),
          totalTerpakai.toLocaleString("id-ID"),
          "",
          "",
          "",
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
        [],
        columnHeaders,
        ...dataRows,
        ...totalRows,
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge Cells
      if (!ws["!merges"]) ws["!merges"] = [];
      const lastColIndex = 14;

      // Merge header laporan
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } });
      ws["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } });

      // Merge baris TOTAL
      ws["!merges"].push({
        s: { r: wsData.length - 3, c: 0 },
        e: { r: wsData.length - 3, c: 7 },
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
        { wch: 10 }, // Satuan
        { wch: 15 }, // Jenis Dokumen
        { wch: 25 }, // No. BPB
        { wch: 20 }, // Tgl Masuk
        { wch: 25 }, // Pemasok
        { wch: 15 }, // Masuk
        { wch: 15 }, // Stok Awal
        { wch: 16 }, // Total Tersedia
        { wch: 15 }, // Terpakai
        { wch: 15 }, // Persentase
        { wch: 60 }, // Detail Produksi
        { wch: 80 }, // Barang Jadi
      ];

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

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const breakdownMasukText = formatBreakdown(summary.breakdown_masuk);

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
        <Card className="border border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200/60">
                <Info className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Panduan Tracking Bahan Baku → Barang Jadi
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Package className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-slate-800">
                    Kode & Nama Bahan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Identitas bahan baku dan satuannya (Kg, Pcs, dll)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <PlusCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-slate-800">
                    Masuk & Stok
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Jumlah masuk, stok awal, dan total tersedia per satuan
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <MinusCircle className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-slate-800">
                    Pemakaian
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Total terpakai dan persentase pemakaian
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-slate-800">
                    Detail Produksi
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Rincian pemakaian di setiap nomor SPK produksi
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <Package className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-slate-800">
                    Barang Jadi
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Hasil produksi dari bahan baku beserta satuannya
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards (3 Kartu Alur Bahan Baku) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Bahan
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200/60">
                <Package className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {summary.total_bahan || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Item bahan baku</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Masuk
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <PlusCircle className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-blue-600">
                {(summary.total_jumlah_masuk || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate" title={breakdownMasukText || "Total kuantitas masuk"}>
                {breakdownMasukText || "Total kuantitas masuk"}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Terpakai
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <MinusCircle className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4.5 pb-4 pt-0">
              <p className="text-2xl font-bold tracking-tight text-purple-600">
                {(summary.total_terpakai || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Bahan digunakan produksi
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

        {/* Data Table */}
        <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardContent className="p-4 sm:p-6">
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
