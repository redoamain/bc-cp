// components/data-table-log.tsx
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableLogProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTableLog<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cari...",
}: DataTableLogProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Definisikan lebar kolom untuk log
  const columnWidths = [
    "w-[50px]", // No.
    "w-[150px]", // Username
    "w-[180px]", // Waktu User
    "w-[120px]", // No. Transaksi
    "w-[150px]", // Item ID
    "w-[100px]", // KGS
    "w-[400px]", // Keterangan
    "w-[180px]", // Waktu Transaksi
  ];

  return (
    <div className="space-y-4">
      {/* Search Section */}
      {searchKey && (
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {data.length} data
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-300">
          <Table className="w-full table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-linear-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300"
                >
                  {headerGroup.headers.map((header, index) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        columnWidths[index] || "w-auto",
                        "whitespace-nowrap font-semibold py-3 px-4",
                        "text-gray-700 uppercase tracking-wider text-xs",
                        index === 0 && "text-center",
                        index === 5 && "",
                
                        index < headerGroup.headers.length - 1 &&
                          "border-r border-gray-200",
                      )}
                      style={{
                        width: header.column.columnDef.size || "auto",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-blue-50/50 transition-colors",
                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                    )}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          columnWidths[index] || "w-auto",
                          "whitespace-nowrap py-3 px-4",
                          index === 0 && "text-center font-medium",
                          index === 5 && "text-right font-mono",
                          
                          index < row.getVisibleCells().length - 1 &&
                            "border-r border-gray-100",
                        )}
                        style={{
                          width: cell.column.columnDef.size || "auto",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-96 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="rounded-full bg-gray-100 p-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Tidak ada data log
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Belum ada aktivitas yang tercatat pada periode ini
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGlobalFilter("")}
                        className="mt-2"
                      >
                        Reset Filter
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="text-sm text-gray-600">
          Menampilkan {table.getFilteredRowModel().rows.length} dari{" "}
          {data.length} data
          {table.getState().globalFilter && (
            <span className="ml-2 text-blue-600">
              (filter: {table.getState().globalFilter})
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">Baris per halaman:</span>
            <select
              className="h-8 w-16 rounded-md border border-gray-300 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm min-w-25 text-center">
              Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
              {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
