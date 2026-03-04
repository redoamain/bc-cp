// components/ui/data-table.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onJenisDokumenFilter?: (value: string) => void;
}

// Pilihan jenis dokumen tetap
const JENIS_DOKUMEN_OPTIONS = [
  { value: "all", label: "Semua Jenis Dokumen" },
  { value: "BC 4.1", label: "BC 4.1" },

];

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cari...",
  onJenisDokumenFilter,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [globalFilter, setGlobalFilter] = useState("");

  // eslint-disable-next-line react-hooks/incompatible-library
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
  });

  const handleJenisFilter = (value: string) => {
    setSelectedJenis(value);
    if (onJenisDokumenFilter) {
      onJenisDokumenFilter(value === "all" ? "" : value);
    }
  };

  const clearJenisFilter = () => {
    setSelectedJenis("all");
    if (onJenisDokumenFilter) {
      onJenisDokumenFilter("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        {searchKey && (
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
        )}

        {/* Filter Jenis Dokumen Pabean dengan pilihan tetap */}
        <div className="flex items-center gap-2">
          <Select value={selectedJenis} onValueChange={handleJenisFilter}>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Filter Jenis Dokumen" />
            </SelectTrigger>
            <SelectContent>
              {JENIS_DOKUMEN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedJenis !== "all" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearJenisFilter}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-350">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const isGroupHeader =
                    header.depth === 0 && header.colSpan > 1;
                  const isNoColumn =
                    header.id === "no" || header.column?.id === "no";

                  // Tentukan border berdasarkan posisi
                  const borderClass = header.id.includes("dokumenPabean")
                    ? "border-r-2 border-gray-300"
                    : header.id.includes("noinvoice")
                      ? "border-r-2 border-gray-300"
                      : "";

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap font-semibold relative",
                        isGroupHeader && "text-center bg-primary/5",
                        isNoColumn && "w-12.5 text-center align-middle",
                        !isGroupHeader && !isNoColumn && "",
                        borderClass,
                      )}
                      colSpan={header.colSpan}
                      style={{
                        minWidth: header.column?.columnDef?.size || "auto",
                        width: header.column?.columnDef?.size || "auto",
                      }}
                    >
                      {/* Garis bawah untuk group header */}
                      {isGroupHeader && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30" />
                      )}

                      {/* Konten header */}
                      <div className="py-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </div>

                      {/* Garis pemisah antar kolom (opsional) */}
                      {!header.isPlaceholder && header.colSpan === 1 && (
                        <div className="absolute right-0 top-2 bottom-2 w-px bg-gray-200" />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}

            {/* Baris tambahan untuk garis pemisah horizontal */}
            <TableRow className="h-0">
              <TableCell
                colSpan={columns.length}
                className="p-0 border-0"
              ></TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50" // Hover hanya untuk baris data
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "whitespace-nowrap border-r border-gray-100 last:border-r-0",
                        cell.column.id === "no" && "text-center",
                      )}
                      style={{
                        minWidth: cell.column.columnDef.size || "auto",
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
              // Empty state - tanpa hover
              <TableRow className="hover:bg-transparent cursor-default">
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="text-center text-muted-foreground py-4"
                >
           
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {table.getFilteredRowModel().rows.length} dari{" "}
          {data.length} data
        </div>
        <div className="flex items-center space-x-2">
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
          <span className="text-sm">
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
  );
}
