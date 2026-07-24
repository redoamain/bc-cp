// components/mutasi/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { MutasiType } from "@/lib/types";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Definisi deskripsi untuk setiap kolom
const columnDescriptions = {
  No: "Nomor urut data",
  KodeBarang: "Kode unik identifikasi bahan baku",
  NamaBarang: "Nama lengkap bahan baku",
  Satuan: "Satuan ukuran bahan baku (Kg, Pcs, Liter, dll)",
  saldoawal: "Jumlah stok awal periode",
  Pemasukan: "Total barang masuk (Pembelian)",
  Retur: "Barang yang dikembalikan dari proses produksi",
  Penggunaan: "Jumlah barang yang digunakan",
  Pengeluaran: "Total barang keluar (Penjualan )",
  Penyesuaian: "Penyesuaian stok karena selisih fisik (dapat bernilai +/-)",
  SaldoAkhir:
    "Stok akhir berdasarkan perhitungan (Saldo Awal + Pemasukan + Pengembalian - Pengeluaran - Penggunaan)",
  Pencacahan: "Hasil stok fisik/opname aktual di lapangan",
  selisih: "Selisih antara Saldo Akhir dengan Hasil Pencacahan",
  Keterangan: "Catatan tambahan",
};

// Helper untuk header dengan tooltip
const ColumnHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <InfoTooltip description={description} />
    </div>
  );
};

export const columns: ColumnDef<MutasiType>[] = [
  {
    accessorKey: "No",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <span>No.</span>
            <ArrowUpDown className="h-3 w-3" />
            <InfoTooltip description={columnDescriptions.No} />
          </div>
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="text-muted-foreground text-sm">{row.index + 1}</span>
      );
    },
  },
  {
    accessorKey: "KodeBarang",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <span>Kode Barang</span>
            <ArrowUpDown className="h-3 w-3" />
            <InfoTooltip description={columnDescriptions.KodeBarang} />
          </div>
        </Button>
      );
    },
  },
  {
    accessorKey: "NamaBarang",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <span>Nama Barang</span>
            <ArrowUpDown className="h-3 w-3" />
            <InfoTooltip description={columnDescriptions.NamaBarang} />
          </div>
        </Button>
      );
    },
  },
  {
    accessorKey: "Satuan",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Satuan</span>
        <InfoTooltip description={columnDescriptions.Satuan} />
      </div>
    ),
  },
  {
    accessorKey: "saldoawal",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Saldo Awal</span>
        <InfoTooltip description={columnDescriptions.saldoawal} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("saldoawal") as number;
      return (
        <span className="font-medium text-blue-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Pemasukan",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Pemasukan</span>
        <InfoTooltip description={columnDescriptions.Pemasukan} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Pemasukan") as number;
      return (
        <span className="font-medium text-green-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Retur",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Pengembalian Produksi</span>
        <InfoTooltip description={columnDescriptions.Retur} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Retur") as number;
      return (
        <span className="text-green-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Penggunaan",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Penggunaan</span>
        <InfoTooltip description={columnDescriptions.Penggunaan} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Penggunaan") as number;
      return (
        <span className="text-orange-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Pengeluaran",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Pengeluaran</span>
        <InfoTooltip description={columnDescriptions.Pengeluaran} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Pengeluaran") as number;
      return (
        <span className="font-medium text-red-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Penyesuaian",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Penyesuaian</span>
        <InfoTooltip description={columnDescriptions.Penyesuaian} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Penyesuaian") as string | number;
      if (!value) return <span>-</span>;
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return <span>-</span>;

      const isPositive = numValue > 0;
      const isNegative = numValue < 0;

      let bgColor = "bg-gray-100";
      let textColor = "text-gray-600";

      if (isPositive) {
        bgColor = "bg-green-100";
        textColor = "text-green-700";
      } else if (isNegative) {
        bgColor = "bg-red-100";
        textColor = "text-red-700";
      }

      return (
        <Badge className={`${bgColor} ${textColor} px-2 py-1`}>
          {numValue > 0 ? "+" : ""}
          {numValue.toLocaleString("id-ID")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "SaldoAkhir",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Saldo Akhir</span>
        <InfoTooltip description={columnDescriptions.SaldoAkhir} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("SaldoAkhir") as number;
      return (
        <span className="font-bold text-purple-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Pencacahan",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Hasil Pencacahan</span>
        <InfoTooltip description={columnDescriptions.Pencacahan} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Pencacahan") as number;
      return (
        <span className="font-medium text-indigo-600">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "selisih",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Selisih</span>
        <InfoTooltip description={columnDescriptions.selisih} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("selisih") as number;
      if (!value || value === 0) {
        return <span className="text-green-600 font-medium">-</span>;
      }

      const isPositive = value > 0;
      return (
        <span
          className={`font-bold ${isPositive ? "text-red-600" : "text-blue-600"}`}
        >
          {isPositive ? "+" : ""}
          {value.toLocaleString("id-ID")}
        </span>
      );
    },
  },
  {
    accessorKey: "Keterangan",
    header: () => (
      <div className="flex items-center gap-2">
        <span>Keterangan</span>
        <InfoTooltip description={columnDescriptions.Keterangan} />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("Keterangan") as string;
      return (
        <span className="text-sm text-muted-foreground">{value || "-"}</span>
      );
    },
  },
];
