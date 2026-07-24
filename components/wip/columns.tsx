// components/wip/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { MutasiType } from "@/lib/types";
import { Button } from "../ui/button";
import { ArrowUpDown } from "lucide-react";
import { InfoTooltip } from "../ui/info-tooltip";

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
    header: "Kode Barang",
  },
  {
    accessorKey: "NamaBarang",
    header: "Nama Barang",
  },
  {
    accessorKey: "Satuan",
    header: "Satuan",
  },
  {
    accessorKey: "SaldoAkhir",
    header: "Jumlah Barang",
    cell: ({ row }) => {
      const value = row.getValue("SaldoAkhir") as number;
      return (
        <span className="font-medium">
          {value?.toLocaleString("id-ID") || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "Keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const value = row.getValue("Keterangan") as string;
      return (
        <span className="text-sm text-muted-foreground">{value || "-"}</span>
      );
    },
  },
];
