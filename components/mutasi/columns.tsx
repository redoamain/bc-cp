// app/mutasi/bahan-baku/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MutasiType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formatNumber = (value: number) => {
  if (!value && value !== 0) return "-";
  return value.toLocaleString("id-ID");
};

export const columns: ColumnDef<MutasiType>[] = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => {
      return <div className="text-center w-8">{row.index + 1}</div>;
    },
    size: 50,
  },
  {
    accessorKey: "KodeBarang",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold"
        >
          Kode Barang
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("KodeBarang") as string;
      return (
        <Badge variant="outline" className="bg-gray-50 font-mono">
          {value || "-"}
        </Badge>
      );
    },
    size: 150,
  },
  {
    accessorKey: "NamaBarang",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold"
        >
          Nama Barang
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("NamaBarang") as string;
      return (
        <div className="max-w-75 truncate" title={value}>
          {value || "-"}
        </div>
      );
    },
    size: 300,
  },
  {
    accessorKey: "Satuan",
    header: "Satuan",
    cell: ({ row }) => row.getValue("Satuan") || "-",
    size: 80,
  },
  {
    accessorKey: "saldoawal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Saldo Awal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("saldoawal") as number;
      return <div className="text-right font-mono">{formatNumber(value)}</div>;
    },
    size: 120,
  },
  {
    accessorKey: "Pemasukan",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Pemasukan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("Pemasukan") as number;
      return (
        <div className="text-right font-mono text-green-600">
          {formatNumber(value)}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "Pengeluaran",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Pengeluaran
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("Pengeluaran") as number;
      return (
        <div className="text-right font-mono text-red-600">
          {formatNumber(value)}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "Penyesuaian",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Penyesuaian
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("Penyesuaian") as number;
      return (
        <div className="text-right font-mono text-blue-600">
          {formatNumber(value)}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "SaldoAkhir",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Saldo Akhir
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("SaldoAkhir") as number;
      return (
        <div className="text-right font-mono font-bold">
          {formatNumber(value)}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "Pencacahan",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Hasil Pencacahan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("Pencacahan") as number;
      return <div className="text-right font-mono">{formatNumber(value)}</div>;
    },
    size: 120,
  },
  {
    accessorKey: "selisih",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Selisih
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("selisih") as number;
      return (
        <div
          className={cn(
            "text-right font-mono",
            value > 0 && "text-green-600",
            value < 0 && "text-red-600",
          )}
        >
          {formatNumber(value)}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "Keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const value = row.getValue("Keterangan") as string;
      return (
        <div className="max-w-50 truncate" title={value}>
          {value || "-"}
        </div>
      );
    },
    size: 200,
  },
];
