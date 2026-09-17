"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Sumber?: string;
  LocID_Bahan?: string;
  Remark_Bahan?: string;
}

interface BarangJadi {
  ProdID_Hasil: string;
  Departemen?: string;
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
  breakdown_masuk?: Record<string, number>;
}

// ============================================
// KOMPONEN CHILD & HELPER
// ============================================

const formatTgl = (val?: string | Date | null): string => {
  if (!val || val === "-") return "-";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(val);
  }
};

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
                <span>{formatTgl(bpb.tanggalBPB)}</span>
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
    return <span className="text-gray-400 text-xs italic">Belum terpakai</span>;
  }

  const total = produksiList.reduce(
    (sum, p) => sum + (p.Jumlah_Bahan || 0),
    0,
  );

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
      >
        {expanded ? "▼" : "▶"} {produksiList.length}x produksi (
        {total.toLocaleString()} {satuanBahan || ""})
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto bg-blue-50/40 p-2 rounded-md border border-blue-200 text-xs min-w-56 shadow-xs">
          {produksiList.map((prod, idx) => {
            const tgl = formatTgl(prod.Tanggal_Produksi);
            return (
              <div
                key={idx}
                className="border-b border-blue-100 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-blue-900 font-mono">
                    {prod.SPK && prod.SPK !== "-" ? prod.SPK : prod.ProdID_Bahan || "-"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tgl}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {prod.ProdID_Bahan || "-"}
                  </span>
                  <span className="font-semibold text-blue-700">
                    {(prod.Jumlah_Bahan || 0).toLocaleString()}{" "}
                    {prod.Satuan_Bahan || satuanBahan || ""}
                  </span>
                </div>
                {prod.PIC_Bahan && prod.PIC_Bahan !== "-" && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    PIC: {prod.PIC_Bahan}
                  </div>
                )}
              </div>
            );
          })}
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
    return <span className="text-gray-400 text-xs italic">Belum ada hasil</span>;
  }

  const totalJadi = barangJadiList.reduce(
    (sum, b) => sum + (b.Jumlah || b.Jumlah_Kgs || 0),
    0,
  );

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1 font-medium"
      >
        {expanded ? "▼" : "▶"} {barangJadiList.length} item jadi (
        {totalJadi.toLocaleString()} {satuanJadi || ""})
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto bg-emerald-50/40 p-2 rounded-md border border-emerald-200 text-xs min-w-64 shadow-xs">
          {barangJadiList.map((bj, idx) => {
            const tgl = formatTgl(bj.Tanggal_Produksi);
            return (
              <div
                key={idx}
                className="border-b border-emerald-100 pb-2 last:border-0 last:pb-0"
              >
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px]">
                      {bj.ItemID || "-"}
                    </span>
                    {bj.Departemen && bj.Departemen !== "-" && (
                      <span className="font-mono text-[10px] font-semibold bg-emerald-700 text-white px-1.5 py-0.5 rounded shadow-2xs">
                        {bj.Departemen}
                      </span>
                    )}
                    {bj.NamaBarang &&
                      bj.NamaBarang !== "-" &&
                      bj.NamaBarang !== bj.ItemID && (
                        <span className="font-medium text-slate-800 text-xs">
                          {bj.NamaBarang}
                        </span>
                      )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-500 mt-1.5">
                  <span className="text-[11px] font-mono">
                    SPK: {bj.SPK || "-"}
                  </span>
                  <span className="text-[10px] font-mono">{tgl}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {bj.ProdID_Hasil || "-"}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {(bj.Jumlah || bj.Jumlah_Kgs || 0).toLocaleString()}{" "}
                    {bj.Satuan || satuanJadi || "PCS"}
                  </span>
                </div>
                {bj.PIC_Hasil && bj.PIC_Hasil !== "-" && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    PIC: {bj.PIC_Hasil}
                  </div>
                )}
              </div>
            );
          })}
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
  const [jenisDokumenFilter, setJenisDokumenFilter] = useState<string>("all");
  const [summary, setSummary] = useState<SummaryData>({
    total_bahan: 0,
    total_jumlah_masuk: 0,
    total_terpakai: 0,
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

  // Filter data berdasarkan jenis dokumen pabean jika dipilih
  const filteredData = useMemo(() => {
    if (!jenisDokumenFilter || jenisDokumenFilter === "all") {
      return data;
    }
    return data.filter((item) =>
      item.JenisDokumen?.toLowerCase().includes(
        jenisDokumenFilter.toLowerCase(),
      ),
    );
  }, [data, jenisDokumenFilter]);

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
  // FUNGSI EXPORT EXCEL (MULTI-SHEET: RINGKASAN & DETAIL ALUR)
  // ============================================
  const exportToExcel = async () => {
    try {
      if (filteredData.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const wb = XLSX.utils.book_new();

      const periode = `Periode: ${format(new Date(tgl1), "dd MMMM yyyy")} - ${format(new Date(tgl2), "dd MMMM yyyy")}`;
      const tanggalCetak = `Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm:ss")}`;
      const totalData = `Total Data: ${filteredData.length} item bahan baku`;

      // --------------------------------------------
      // SHEET 1: RINGKASAN TRACKING
      // --------------------------------------------
      const sheet1Title = "LAPORAN REKAPITULASI TRACKING BAHAN BAKU → BARANG JADI";
      const sheet1Headers = [
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
        "Rincian Produksi",
        "Rincian Barang Jadi",
      ];

      const dataRows = filteredData.map((item, index) => {
        const satuanBahan = item.Satuan || "";
        const satuanJadi = item.SatuanBarangJadi || "PCS";

        // Format Rincian Produksi yang bersih dan mudah dibaca
        let produksiText = "-";
        if (item.DigunakanDiProduksi && item.DigunakanDiProduksi.length > 0) {
          produksiText = item.DigunakanDiProduksi.map((prod) => {
            const spk =
              prod.SPK && prod.SPK !== "-"
                ? `SPK: ${prod.SPK}`
                : `ID: ${prod.ProdID_Bahan || "-"}`;
            const jumlah = (prod.Jumlah_Bahan || 0).toLocaleString("id-ID");
            const unit = prod.Satuan_Bahan || satuanBahan;
            const tgl = formatTgl(prod.Tanggal_Produksi);
            const pic =
              prod.PIC_Bahan && prod.PIC_Bahan !== "-"
                ? ` (${prod.PIC_Bahan})`
                : "";
            return `• ${spk} | ${jumlah} ${unit} | Tgl: ${tgl}${pic}`;
          }).join("\n");
        }

        // Format Rincian Barang Jadi yang bersih dan mudah dibaca
        let barangJadiText = "-";
        if (
          item.MenghasilkanBarangJadi &&
          item.MenghasilkanBarangJadi.length > 0
        ) {
          barangJadiText = item.MenghasilkanBarangJadi.map((bj) => {
            const kode = bj.ItemID || "-";
            const dept =
              bj.Departemen && bj.Departemen !== "-"
                ? ` [${bj.Departemen}]`
                : "";
            const nama =
              bj.NamaBarang && bj.NamaBarang !== "-" && bj.NamaBarang !== kode
                ? ` - ${bj.NamaBarang}`
                : "";
            const jumlah = (bj.Jumlah || bj.Jumlah_Kgs || 0).toLocaleString(
              "id-ID",
            );
            const unit = bj.Satuan || satuanJadi;
            const spk =
              bj.SPK && bj.SPK !== "-" ? ` | SPK: ${bj.SPK}` : "";
            const tgl = formatTgl(bj.Tanggal_Produksi);
            return `• [${kode}]${dept}${nama}: ${jumlah} ${unit}${spk} | Tgl: ${tgl}`;
          }).join("\n");
        }

        // Format No. BPB
        let bpbText = item.NomorBPB || "-";
        if (item.DaftarPemasukan && item.DaftarPemasukan.length > 1) {
          bpbText = item.DaftarPemasukan.map(
            (b) =>
              `• ${b.nomorBPB} (${(b.jumlah || 0).toLocaleString("id-ID")} ${b.satuan || satuanBahan})`,
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
          formatTgl(item.TanggalBPB),
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

      const totalMasuk = filteredData.reduce(
        (sum, item) => sum + (item.JumlahMasuk || item.JumlahMasuk_Kgs || 0),
        0,
      );
      const totalStokAwal = filteredData.reduce(
        (sum, item) => sum + (item.StokAwal || 0),
        0,
      );
      const totalTersedia = filteredData.reduce(
        (sum, item) => sum + (item.TotalStokTersedia || 0),
        0,
      );
      const totalTerpakai = filteredData.reduce(
        (sum, item) =>
          sum +
          (item.TotalTerpakai !== undefined
            ? item.TotalTerpakai
            : item.TotalKgsTerpakai || 0),
        0,
      );

      const totalRowsSheet1 = [
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
          totalMasuk,
          totalStokAwal,
          totalTersedia,
          totalTerpakai,
          "",
          "",
          "",
        ],
        [],
        ["*** AKHIR RINGKASAN TRACKING ***"],
      ];

      const ws1Data = [
        [sheet1Title],
        [periode],
        [tanggalCetak],
        [totalData],
        [],
        sheet1Headers,
        ...dataRows,
        ...totalRowsSheet1,
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

      if (!ws1["!merges"]) ws1["!merges"] = [];
      const sheet1LastCol = 14;

      ws1["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: sheet1LastCol } });
      ws1["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: sheet1LastCol } });
      ws1["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: sheet1LastCol } });
      ws1["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: sheet1LastCol } });

      ws1["!merges"].push({
        s: { r: ws1Data.length - 3, c: 0 },
        e: { r: ws1Data.length - 3, c: 7 },
      });

      ws1["!merges"].push({
        s: { r: ws1Data.length - 1, c: 0 },
        e: { r: ws1Data.length - 1, c: sheet1LastCol },
      });

      ws1["!cols"] = [
        { wch: 6 },  // No.
        { wch: 16 }, // Kode Bahan
        { wch: 30 }, // Nama Bahan
        { wch: 10 }, // Satuan
        { wch: 15 }, // Jenis Dokumen
        { wch: 25 }, // No. BPB
        { wch: 14 }, // Tgl Masuk
        { wch: 25 }, // Pemasok
        { wch: 15 }, // Masuk
        { wch: 15 }, // Stok Awal
        { wch: 16 }, // Total Tersedia
        { wch: 15 }, // Terpakai
        { wch: 14 }, // Persentase
        { wch: 50 }, // Rincian Produksi
        { wch: 55 }, // Rincian Barang Jadi
      ];

      // --------------------------------------------
      // SHEET 2: DETAIL ALUR PRODUKSI & HASIL
      // --------------------------------------------
      const sheet2Title =
        "RINCIAN DETAIL PEMAKAIAN BAHAN DAN HASIL BARANG JADI";
      const sheet2Subtitle =
        "Tabel ini merinci setiap transaksi pemakaian bahan baku di produksi dan barang jadi yang dihasilkan per SPK / ID Produksi";
      const sheet2Headers = [
        "No.",
        "Kode Bahan",
        "Nama Bahan Baku",
        "Satuan Bahan",
        "No. BPB / Dokumen",
        "Tgl Masuk Bahan",
        "Pemasok",
        "No. SPK",
        "ID Produksi (ProdID)",
        "Tgl Produksi",
        "Pemakaian Bahan (Qty)",
        "Satuan Pemakaian",
        "PIC Pemakaian",
        "Kode Barang Jadi",
        "Dept Hasil",
        "Nama Barang Jadi",
        "Hasil Jadi (Qty)",
        "Satuan Hasil",
        "Tgl Selesai Jadi",
        "PIC Barang Jadi",
      ];

      const detailRows: any[][] = [];
      let detailIndex = 1;
      let totalBahanTerpakaiDetail = 0;
      let totalBarangJadiDetail = 0;

      filteredData.forEach((item) => {
        const satuanBahan = item.Satuan || "KG";
        const bpb =
          item.DaftarPemasukan && item.DaftarPemasukan.length > 1
            ? item.DaftarPemasukan.map((d) => d.nomorBPB).join(", ")
            : item.NomorBPB || "-";
        const tglMasuk = formatTgl(item.TanggalBPB);
        const pemasok = item.Pemasok || "-";

        const pemakaianList = item.DigunakanDiProduksi || [];
        const barangJadiList = item.MenghasilkanBarangJadi || [];

        if (pemakaianList.length === 0) {
          // Bahan baku belum terpakai di produksi
          detailRows.push([
            detailIndex++,
            item.ItemID_Bahan || "-",
            item.NamaBahan || "-",
            satuanBahan,
            bpb,
            tglMasuk,
            pemasok,
            "-",
            "-",
            "-",
            0,
            satuanBahan,
            "-",
            "-",
            "-",
            "(Belum digunakan di produksi)",
            0,
            "-",
            "-",
            "-",
          ]);
        } else {
          // Terdapat transaksi pemakaian bahan
          pemakaianList.forEach((prod) => {
            const spk = prod.SPK || "-";
            const prodId = prod.ProdID_Bahan || "-";
            const tglProd = formatTgl(prod.Tanggal_Produksi);
            const qtyBahan = prod.Jumlah_Bahan || 0;
            const satProd = prod.Satuan_Bahan || satuanBahan;
            const picBahan = prod.PIC_Bahan || "-";

            // Cari barang jadi yang berkorelasi dengan ProdID atau SPK
            const matchingBJ = barangJadiList.filter(
              (bj) =>
                (prodId !== "-" && bj.ProdID_Hasil === prodId) ||
                (spk !== "-" && bj.SPK === spk),
            );

            if (matchingBJ.length === 0) {
              // Pemakaian ada tapi hasil belum tercatat (WIP)
              totalBahanTerpakaiDetail += qtyBahan;
              detailRows.push([
                detailIndex++,
                item.ItemID_Bahan || "-",
                item.NamaBahan || "-",
                satuanBahan,
                bpb,
                tglMasuk,
                pemasok,
                spk,
                prodId,
                tglProd,
                qtyBahan,
                satProd,
                picBahan,
                "-",
                "-",
                "(Dalam proses produksi / WIP)",
                0,
                "-",
                "-",
                "-",
              ]);
            } else {
              // Menghasilkan satu atau beberapa jenis barang jadi
              matchingBJ.forEach((bj, bjIdx) => {
                const qtyBJ = bj.Jumlah || bj.Jumlah_Kgs || 0;
                // Hanya hitung pemakaian bahan sekali jika 1 batch pemakaian menghasilkan lebih dari 1 barang jadi
                const bahanQtyCol = bjIdx === 0 ? qtyBahan : 0;
                if (bjIdx === 0) {
                  totalBahanTerpakaiDetail += qtyBahan;
                }
                totalBarangJadiDetail += qtyBJ;

                detailRows.push([
                  detailIndex++,
                  item.ItemID_Bahan || "-",
                  item.NamaBahan || "-",
                  satuanBahan,
                  bpb,
                  tglMasuk,
                  pemasok,
                  spk,
                  prodId,
                  tglProd,
                  bahanQtyCol,
                  satProd,
                  picBahan,
                  bj.ItemID || "-",
                  bj.Departemen || "-",
                  bj.NamaBarang || bj.ItemID || "-",
                  qtyBJ,
                  bj.Satuan || "PCS",
                  formatTgl(bj.Tanggal_Produksi),
                  bj.PIC_Hasil || "-",
                ]);
              });
            }
          });
        }
      });

      const totalRowsSheet2 = [
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
          "",
          "",
          totalBahanTerpakaiDetail,
          "",
          "",
          "",
          "",
          "",
          totalBarangJadiDetail,
          "",
          "",
          "",
        ],
        [],
        ["*** AKHIR RINCIAN ALUR PRODUKSI ***"],
      ];

      const ws2Data = [
        [sheet2Title],
        [periode],
        [sheet2Subtitle],
        [tanggalCetak],
        [],
        sheet2Headers,
        ...detailRows,
        ...totalRowsSheet2,
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);

      if (!ws2["!merges"]) ws2["!merges"] = [];
      const sheet2LastCol = 19;

      ws2["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: sheet2LastCol } });
      ws2["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: sheet2LastCol } });
      ws2["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: sheet2LastCol } });
      ws2["!merges"].push({ s: { r: 3, c: 0 }, e: { r: 3, c: sheet2LastCol } });

      ws2["!merges"].push({
        s: { r: ws2Data.length - 3, c: 0 },
        e: { r: ws2Data.length - 3, c: 9 },
      });

      ws2["!merges"].push({
        s: { r: ws2Data.length - 1, c: 0 },
        e: { r: ws2Data.length - 1, c: sheet2LastCol },
      });

      ws2["!cols"] = [
        { wch: 6 },  // No.
        { wch: 16 }, // Kode Bahan
        { wch: 32 }, // Nama Bahan Baku
        { wch: 12 }, // Satuan Bahan
        { wch: 22 }, // No. BPB / Dokumen
        { wch: 14 }, // Tgl Masuk Bahan
        { wch: 24 }, // Pemasok
        { wch: 18 }, // No. SPK
        { wch: 18 }, // ID Produksi (ProdID)
        { wch: 14 }, // Tgl Produksi
        { wch: 22 }, // Pemakaian Bahan (Qty)
        { wch: 14 }, // Satuan Pemakaian
        { wch: 16 }, // PIC Pemakaian
        { wch: 18 }, // Kode Barang Jadi
        { wch: 12 }, // Dept Hasil
        { wch: 32 }, // Nama Barang Jadi
        { wch: 20 }, // Hasil Jadi (Qty)
        { wch: 14 }, // Satuan Hasil
        { wch: 14 }, // Tgl Selesai Jadi
        { wch: 16 }, // PIC Barang Jadi
      ];

      // Masukkan kedua sheet ke Workbook
      XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan Tracking");
      XLSX.utils.book_append_sheet(wb, ws2, "Detail Alur Produksi");

      const fileName = `TRACKING_BAHAN_${tgl1}_${tgl2}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // Kirim notifikasi Telegram
      await sendTelegramNotification({
        fileName,
        periode: `${format(new Date(tgl1), "dd MMM yyyy")} - ${format(new Date(tgl2), "dd MMM yyyy")}`,
        totalData: filteredData.length,
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
              disabled={filteredData.length === 0 || loading}
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
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PackageX className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada data untuk filter yang dipilih</p>
                <p className="text-xs mt-1">
                  Coba pilih rentang tanggal atau jenis dokumen yang berbeda
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchKey="NamaBahan"
                searchPlaceholder="Cari nama bahan, kode item, atau jenis dokumen..."
                onJenisDokumenFilter={setJenisDokumenFilter}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
