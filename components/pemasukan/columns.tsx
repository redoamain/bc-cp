// app/pemasukan/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PemasukanType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Helper untuk format tanggal
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "-";
    return format(dateObj, "dd/MM/yyyy");
  } catch {
    return "-";
  }
};

// Helper untuk format currency
const formatCurrency = (value: number, currency: string = "USD") => {
  if (!value && value !== 0) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const columns: ColumnDef<PemasukanType>[] = [
  // Nomor Urut
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => {
      return <div className="text-center w-8">{row.index + 1}</div>;
    },
    size: 50,
  },

  // Dokumen Pabean Group
  {
    id: "dokumenPabean",
    header: "Dokumen Pabean",
    columns: [
      {
        accessorKey: "JenisDokPabean",
        header: "Jenis",
        cell: ({ row }) => {
          const value = row.getValue("JenisDokPabean") as string;
          return value ? (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
            >
              {value}
            </Badge>
          ) : (
            "-"
          );
        },
      },
      {
        accessorKey: "NomorDokPabean",
        header: "Nomor",
        cell: ({ row }) => {
          const value = row.getValue("NomorDokPabean") as string;
          return <span className="font-medium">{value || "-"}</span>;
        },
      },
      {
        accessorKey: "TanggalDokPabean",
        header: "Tanggal",
        cell: ({ row }) => formatDate(row.getValue("TanggalDokPabean")),
      },
    ],
  },

  // Bukti Penerimaan Barang Group
  {
    id: "buktiPenerimaan",
    header: "Bukti Penerimaan Barang",
    columns: [
      {
        accessorKey: "NomorBPB",
        header: "Nomor",
        cell: ({ row }) => {
          const value = row.getValue("NomorBPB") as number;
          return value || "-";
        },
      },
      {
        accessorKey: "TanggalBPB",
        header: "Tanggal",
        cell: ({ row }) => formatDate(row.getValue("TanggalBPB")),
      },
      {
        accessorKey: "PemasokPengirim",
        header: "Pemasok/Pengirim",
        cell: ({ row }) => {
          const value = row.getValue("PemasokPengirim") as string;
          return (
            <div className="max-w-50 truncate" title={value}>
              {value || "-"}
            </div>
          );
        },
      },
    ],
  },

  // Kolom berikutnya masih dalam group? Tidak, ini kolom standalone
  // Tapi kita tetap akan menambahkannya sebagai kolom biasa
  {
    accessorKey: "kodebarang",
    header: "Kode Barang",
    cell: ({ row }) => {
      const value = row.getValue("kodebarang") as string;
      return value ? (
        <Badge variant="outline" className="bg-gray-50">
          {value}
        </Badge>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "Namabarang",
    header: "Nama Barang",
    cell: ({ row }) => {
      const value = row.getValue("Namabarang") as string;
      return (
        <div className="max-w-62.5 truncate" title={value}>
          {value || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "Jumlah",
    header: "Jumlah",
    cell: ({ row }) => {
      const jumlah = row.getValue("Jumlah") as number;
      const satuan = row.original.Satuan;
      if (!jumlah && jumlah !== 0) return "-";
      return (
        <div className="text-right">
          {jumlah.toLocaleString()}
          {satuan && (
            <span className="ml-1 text-xs text-muted-foreground">{satuan}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "Satuan",
    header: "Satuan",
    cell: ({ row }) => row.getValue("Satuan") || "-",
  },
  {
    accessorKey: "CURR",
    header: "Curr",
    cell: ({ row }) => row.getValue("CURR") || "USD",
  },
  {
    accessorKey: "NilaiBarang",
    header: "Nilai Barang",
    cell: ({ row }) => {
      const nilai = row.getValue("NilaiBarang") as number;
      const currency = row.original.CURR || "USD";

      if (!nilai && nilai !== 0) return <div className="text-right">-</div>;

      return (
        <div className="text-right font-medium">
          {formatCurrency(nilai, currency)}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "Nopol",
  //   header: "No. Container",
  //   cell: ({ row }) => row.getValue("Nopol") || "-",
  // },
  // {
  //   accessorKey: "NoInvoice",
  //   header: "No Invoice",
  //   cell: ({ row }) => row.getValue("NoInvoice") || "-",
  // },
];
