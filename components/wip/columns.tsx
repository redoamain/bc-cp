// app/mutasi/bahan-baku/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MutasiType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";


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
    accessorKey: "SaldoAkhir",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          Jumlah
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
