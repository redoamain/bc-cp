"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
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
  CheckCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type definitions
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
        <div className="mt-2 space-y-1 text-xs bg-gray-50 p-2 rounded-lg min-w-[200px]">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-500">Stok Awal:</span>
            <span className="font-medium">
              {(item.StokAwal || 0).toLocaleString()} Kgs
            </span>
            <span className="text-gray-500">+ Masuk:</span>
            <span className="font-medium text-green-600">
              + {(item.JumlahMasuk_Kgs || 0).toLocaleString()} Kgs
            </span>
            <span className="text-gray-500">= Tersedia:</span>
            <span className="font-medium">
              {(item.TotalStokTersedia || 0).toLocaleString()} Kgs
            </span>
            <span className="text-gray-500">- Terpakai:</span>
            <span className="font-medium text-red-600">
              - {(item.TotalKgsTerpakai || 0).toLocaleString()} Kgs
            </span>
            <div className="border-t pt-1 mt-1 col-span-2">
              <span className="font-bold">Stock Sekarang:</span>
              <span
                className={`font-bold ml-2 ${(item.StockSekarang || 0) < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {(item.StockSekarang || 0).toLocaleString()} Kgs
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
        {totalKgs.toLocaleString()} Kgs)
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
                Jumlah: {(prod.Jumlah_Bahan || 0).toLocaleString()} Kgs
              </div>
              <div className="text-gray-400">PIC: {prod.PIC_Bahan || "-"}</div>
              <div className="text-gray-400 text-xs">
                Tgl: {prod.Tanggal_Produksi || "-"}
              </div>
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
        {totalJadi.toLocaleString()} Kgs)
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
              <div className="text-gray-500">Kode: {bj.ItemID || "-"}</div>
              <div className="text-gray-500">SPK: {bj.SPK || "-"}</div>
              <div className="text-gray-500">
                ProdID: {bj.ProdID_Hasil || "-"}
              </div>
              <div className="text-gray-700 font-medium">
                Jumlah: {(bj.Jumlah_Kgs || 0).toLocaleString()} Kgs
              </div>
              <div className="text-gray-400">PIC: {bj.PIC_Hasil || "-"}</div>
              <div className="text-gray-400 text-xs">
                Tgl: {bj.Tanggal_Produksi || "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Columns
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
    header: "Masuk (Kgs)",
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
  {
    id: "stock_sekarang",
    header: "Stock",
    size: 100,
    cell: ({ row }) => {
      const item = row.original;
      const stock = item.StockSekarang || 0;
      const status = item.StatusStock || "Aman";
      const bgColor = item.StatusBg || "bg-green-100";

      let icon = null;
      if (status === "MINUS!")
        icon = <AlertTriangle className="h-3 w-3 inline mr-1" />;
      else if (status === "Habis")
        icon = <PackageX className="h-3 w-3 inline mr-1" />;
      else if (status === "Habis Terpakai")
        icon = <CheckCircle className="h-3 w-3 inline mr-1" />;
      else icon = <Package className="h-3 w-3 inline mr-1" />;

      return (
        <div
          className={`${bgColor} px-2 py-1 rounded-lg text-center font-medium`}
        >
          {stock.toLocaleString()} Kgs
          <div className="text-xs flex items-center justify-center gap-1">
            {icon}
            {status}
          </div>
        </div>
      );
    },
  },
  {
    id: "stock_detail",
    header: "Info",
    size: 60,
    cell: ({ row }) => <StockDetail item={row.original} />,
  },
];

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
  const [summary, setSummary] = useState({
    total_bahan: 0,
    total_jumlah_masuk: 0,
    total_terpakai: 0,
    total_barang_jadi: 0,
  });

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
          <Button
            variant="outline"
            onClick={() => fetchData(defaultTgl1, defaultTgl2)}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filter - Hanya Filter Tanggal, jenis dokumen pakai search di DataTable */}
        <FilterTanggal
          onFilter={handleFilter}
          isLoading={loading}
          defaultTgl1={defaultTgl1}
          defaultTgl2={defaultTgl2}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Bahan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{summary.total_bahan || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-blue-600">
                {(summary.total_jumlah_masuk || 0).toLocaleString()} Kgs
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
              <p className="text-sm font-bold text-purple-600">
                {(summary.total_terpakai || 0).toLocaleString()} Kgs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Barang Jadi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-green-600">
                {(summary.total_barang_jadi || 0).toLocaleString()} Kgs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Data Table - dengan fitur search untuk filter jenis dokumen */}
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
