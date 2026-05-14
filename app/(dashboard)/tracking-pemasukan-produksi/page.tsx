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
  PackageCheck,
  PackageX,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Warehouse,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Type definitions
interface ProduksiUsage {
  No_Produksi: string;
  Tanggal_Produksi: string;
  Departemen: string;
  Tipe_Produksi: "B" | "H";
  SPK: string;
  Nama_PO: string;
  Jumlah_Kgs: number;
  Kategori: string;
  PIC_Produksi: string;
}

interface TrackingItem {
  ItemID: string;
  NamaBarang: string;
  JenisDokumen: string;
  NomorDokumen: string;
  TanggalDokumen: string;
  NomorBPB: string;
  TanggalBPB: string | null;
  Pemasok: string;
  JumlahMasuk_Kgs: number;
  Satuan: string;
  Currency: string;
  NilaiBarang: number;
  Nopol: string;
  NoInvoice: string;
  DigunakanDiProduksi: ProduksiUsage[];
  TotalKgsProduksi: number;
  SisaSetelahProduksi: number;
  CurrentStock: number;
  StockStatus: string;
  StockColor: string;
  Status: string;
  PersentaseDipakai: number;
  Warning: string | null;
}

// Component untuk sub-table produksi
const ProduksiSubTable = ({
  produksiList,
}: {
  produksiList: ProduksiUsage[];
}) => {
  const [expanded, setExpanded] = useState(false);

  if (produksiList.length === 0) {
    return (
      <span className="text-gray-400 text-sm">Belum dipakai di produksi</span>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        {expanded ? "▼" : "▶"} {produksiList.length} produksi (
        {produksiList
          .reduce((sum, p) => sum + p.Jumlah_Kgs, 0)
          .toLocaleString()}{" "}
        Kgs)
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-auto">
          {produksiList.map((prod, idx) => (
            <div
              key={idx}
              className="text-xs border-l-2 border-blue-300 pl-2 py-1"
            >
              <div className="font-medium text-blue-700">
                {prod.No_Produksi}
              </div>
              <div className="text-gray-500">SPK: {prod.SPK}</div>
              <div className="text-gray-500">
                Tipe: {prod.Tipe_Produksi === "B" ? "Bahan" : "Hasil"}
              </div>
              <div className="text-gray-500 font-medium">
                Jumlah: {prod.Jumlah_Kgs.toLocaleString()} Kgs
              </div>
              <div className="text-gray-400">PIC: {prod.PIC_Produksi}</div>
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
    accessorKey: "ItemID",
    header: "Kode Item",
    size: 100,
  },
  {
    accessorKey: "NamaBarang",
    header: "Nama Barang",
    size: 180,
  },
  {
    accessorKey: "NomorBPB",
    header: "No. BPB",
    size: 100,
  },
  {
    accessorKey: "TanggalBPB",
    header: "Tgl Masuk",
    size: 90,
  },
  {
    accessorKey: "JumlahMasuk_Kgs",
    header: "Masuk (Kgs)",
    size: 100,
    cell: ({ row }) => (
      <span className="font-medium text-blue-600">
        {row.original.JumlahMasuk_Kgs.toLocaleString()}
      </span>
    ),
  },
  {
    id: "pemakaian",
    header: "Terpakai",
    size: 150,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{item.TotalKgsProduksi.toLocaleString()} Kgs</span>
            <span className="font-medium">{item.PersentaseDipakai}%</span>
          </div>
          <Progress value={item.PersentaseDipakai} className="h-2" />
        </div>
      );
    },
  },
  {
    id: "current_stock",
    header: "Stock Saat Ini",
    size: 120,
    cell: ({ row }) => {
      const item = row.original;
      let bgColor = "bg-gray-100";
      let textColor = "text-gray-700";

      if (item.CurrentStock < 0) {
        bgColor = "bg-red-100";
        textColor = "text-red-700 font-bold";
      } else if (item.CurrentStock === 0) {
        bgColor = "bg-orange-100";
        textColor = "text-orange-700";
      } else if (item.CurrentStock < item.JumlahMasuk_Kgs * 0.2) {
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-700";
      } else {
        bgColor = "bg-green-100";
        textColor = "text-green-700";
      }

      return (
        <div
          className={`${bgColor} px-2 py-1 rounded-lg text-center ${textColor} font-medium`}
        >
          {item.CurrentStock.toLocaleString()} Kgs
          {item.CurrentStock < 0 && (
            <div className="text-xs text-red-500">MINUS!</div>
          )}
        </div>
      );
    },
  },
  {
    id: "digunakan_di",
    header: "Detail Produksi",
    size: 160,
    cell: ({ row }) => (
      <ProduksiSubTable produksiList={row.original.DigunakanDiProduksi} />
    ),
  },
  {
    id: "status_stock",
    header: "Status Stock",
    size: 100,
    cell: ({ row }) => {
      const item = row.original;
      let color = "bg-gray-500";
      let icon = <Package className="h-3 w-3 mr-1" />;

      if (item.CurrentStock < 0) {
        color = "bg-red-500";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      } else if (item.CurrentStock === 0) {
        color = "bg-orange-500";
        icon = <PackageX className="h-3 w-3 mr-1" />;
      } else if (item.CurrentStock < item.JumlahMasuk_Kgs * 0.2) {
        color = "bg-yellow-500";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      } else {
        color = "bg-green-500";
        icon = <CheckCircle className="h-3 w-3 mr-1" />;
      }

      return (
        <Badge className={color}>
          {icon}
          {item.StockStatus}
        </Badge>
      );
    },
  },
  {
    id: "warning",
    header: "Peringatan",
    size: 80,
    cell: ({ row }) => {
      const item = row.original;
      if (item.Warning) {
        return (
          <div className="text-red-500 cursor-help" title={item.Warning}>
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      }
      return (
        <div className="text-green-500">
          <CheckCircle className="h-4 w-4" />
        </div>
      );
    },
  },
  {
    accessorKey: "NilaiBarang",
    header: "Nilai",
    size: 120,
    cell: ({ row }) => {
      const value = row.original.NilaiBarang;
      const currency = row.original.Currency;
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: currency === "USD" ? "USD" : "IDR",
      }).format(value);
    },
  },
];

export default function TrackingPemasukanProduksiPage() {
  const today = new Date();
  const defaultTgl1 = format(
    new Date(today.getFullYear(), today.getMonth(), 1),
    "yyyy-MM-dd",
  );
  const defaultTgl2 = format(today, "yyyy-MM-dd");

  const [data, setData] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total_items: 0,
    total_sudah_dipakai: 0,
    total_belum_dipakai: 0,
    total_jumlah_masuk: 0,
    total_kgs_dipakai: 0,
    total_current_stock: 0,
    total_nilai: 0,
    items_minus: 0,
    items_menipis: 0,
  });

  const fetchData = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(
        `/api/tracking-pemasukan-produksi?startDate=${startDate}&endDate=${endDate}`,
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setSummary(result.summary);
        setWarning(result.warning);
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
  }, [fetchData]);

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
              Tracking Pemasukan → Produksi
            </h1>
            <p className="text-muted-foreground">
              Mengetahui item dari pemasukan digunakan untuk produksi apa saja
              (dalam Kgs) + Monitoring Stock
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

        {/* Warning Banner */}
        {warning && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{warning}</span>
          </div>
        )}

        {/* Filter */}
        <FilterTanggal
          onFilter={handleFilter}
          isLoading={loading}
          defaultTgl1={defaultTgl1}
          defaultTgl2={defaultTgl2}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Item</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{summary.total_items}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">
                Sudah Dipakai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">
                {summary.total_sudah_dipakai}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">
                Belum Dipakai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-yellow-600">
                {summary.total_belum_dipakai}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-blue-600">
                {summary.total_jumlah_masuk?.toLocaleString()} Kgs
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
                {summary.total_kgs_dipakai?.toLocaleString()} Kgs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-green-600">
                {summary.total_current_stock?.toLocaleString()} Kgs
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              summary.items_minus > 0 ? "border-red-300 bg-red-50" : ""
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Item Minus</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-xl font-bold ${summary.items_minus > 0 ? "text-red-600" : "text-gray-600"}`}
              >
                {summary.items_minus}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Total Nilai</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-bold text-orange-600">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(summary.total_nilai)}
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

        {/* Data Table */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                searchKey="NamaBarang"
                searchPlaceholder="Cari nama barang atau kode item..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
