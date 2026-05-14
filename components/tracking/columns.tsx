// components/tracking-pemasukan/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  TrackingPemasukanItem,
  ProduksiUsage,
} from "@/lib/types";

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
    <div className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {produksiList.length} produksi
      </Button>
      {expanded && (
        <div className="pl-4 space-y-2 mt-2 max-h-60 overflow-auto">
          {produksiList.map((prod, idx) => (
            <div
              key={idx}
              className="text-xs border-l-2 border-blue-200 pl-2 py-1 space-y-0.5"
            >
              <div className="font-medium text-blue-700">
                {prod.No_Produksi}
              </div>
              <div className="text-gray-500">SPK: {prod.SPK}</div>
              <div className="text-gray-500">
                Tipe: {prod.Tipe_Produksi === "B" ? "Bahan" : "Hasil"}
              </div>
              <div className="text-gray-500">
                Jumlah:{" "}
                {prod.Tipe_Produksi === "B"
                  ? prod.Jumlah_Bags
                  : prod.Jumlah_Kgs}
              </div>
              <div className="text-gray-400 text-xs">
                PIC: {prod.PIC_Produksi}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const columns: ColumnDef<TrackingPemasukanItem>[] = [
  {
    accessorKey: "ItemID",
    header: "Kode Item",
    size: 100,
  },
  {
    accessorKey: "NamaBarang",
    header: "Nama Barang",
    size: 200,
  },
  {
    accessorKey: "NomorBPB",
    header: "No. BPB",
    size: 120,
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
  },
  {
    accessorKey: "JumlahMasuk",
    header: "Jumlah Masuk",
    size: 100,
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.JumlahMasuk.toLocaleString()} {row.original.Satuan}
      </span>
    ),
  },
  {
    accessorKey: "NilaiBarang",
    header: "Nilai",
    size: 130,
    cell: ({ row }) => {
      const value = row.original.NilaiBarang;
      const currency = row.original.Currency;
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: currency === "USD" ? "USD" : "IDR",
      }).format(value);
    },
  },
  {
    id: "digunakan_di",
    header: "Digunakan di Produksi",
    size: 200,
    cell: ({ row }) => (
      <ProduksiSubTable produksiList={row.original.DigunakanDiProduksi} />
    ),
  },
  {
    id: "status",
    header: "Status",
    size: 130,
    cell: ({ row }) => {
      const used = row.original.DigunakanDiProduksi.length > 0;
      return (
        <Badge
          variant={used ? "default" : "secondary"}
          className={used ? "bg-green-500" : "bg-yellow-500"}
        >
          {used ? "✓ Sudah Dipakai" : "○ Belum Dipakai"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "JumlahProduksi",
    header: "Jml Produksi",
    size: 80,
    cell: ({ row }) => (
      <span className="text-center block">{row.original.JumlahProduksi}</span>
    ),
  },
];
