// app/log/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LogType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Helper untuk format tanggal
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "-";
    return format(dateObj, "dd/MM/yyyy HH:mm:ss", { locale: id });
  } catch {
    return "-";
  }
};

export const columns: ColumnDef<LogType>[] = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => {
      return <div className="text-center w-8">{row.index + 1}</div>;
    },
    size: 50,
  },
  {
    accessorKey: "Username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold"
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const username = row.getValue("Username") as string;
      return <div className="font-medium">{username || "-"}</div>;
    },
    size: 150,
  },
  {
    accessorKey: "TransNo",
    header: "No. Transaksi",
    cell: ({ row }) => {
      const value = row.getValue("TransNo") as number;
      return value || "-";
    },
    size: 120,
  },
  {
    accessorKey: "ItemID",
    header: "Item ID",
    cell: ({ row }) => {
      const value = row.getValue("ItemID") as string;
      return value ? (
        <Badge variant="outline" className="bg-gray-50">
          {value}
        </Badge>
      ) : (
        "-"
      );
    },
    size: 150,
  },
  {
    accessorKey: "kgs",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-right"
        >
          KGS
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("kgs") as number;
      return <div className="text-right">{value || 0}</div>;
    },
    size: 100,
  },
  {
    accessorKey: "Remark",
    header: "Keterangan",
    cell: ({ row }) => {
      const value = row.getValue("Remark") as string;
      return (
        <div className="max-w-75 text-right" title={value}>
          {value || "-"}
        </div>
      );
    },
    size: 200,
  },
  {
    accessorKey: "TransDateTime",
    header: "Waktu Transaksi",
    cell: ({ row }) => {
      const date = row.getValue("TransDateTime") as Date | string;
      return <div className="whitespace-nowrap">{formatDate(date)}</div>;
    },
    size: 180,
  },
  {
    accessorKey: "IpAddr",
    header: "IP Address",
    cell: ({ row }) => {
      const value = row.getValue("IpAddr") as number;
      return <div className="text-left">{value || 0}</div>;
    },
    size: 180,
  },
];
