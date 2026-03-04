// components/data-table-mutasi.tsx
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
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";


interface DataTableMutasiProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  loading?: boolean;
}

export function DataTableMutasi<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cari...",
  loading = false,
}: DataTableMutasiProps<TData, TValue>) {
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

  // Skeleton loading untuk tabel
  const TableSkeleton = () => {
    return (
      <>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={`skeleton-${rowIndex}`}>
            {Array.from({ length: columns.length }).map((_, colIndex) => (
              <TableCell key={`skeleton-col-${rowIndex}-${colIndex}`}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
              disabled={loading}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              `Total: ${data.length} data`
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-300">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap font-semibold"
                      style={{
                        width: header.column.columnDef.size,
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
              {loading ? (
                <TableSkeleton />
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap"
                        style={{
                          width: cell.column.columnDef.size,
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
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-muted-foreground">Tidak ada data</p>
                      <p className="text-sm text-muted-foreground/80">
                        Silahkan pilih periode lain
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            `Menampilkan ${table.getFilteredRowModel().rows.length} dari ${data.length} data`
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage() || loading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              `Halaman ${table.getState().pagination.pageIndex + 1} dari ${table.getPageCount()}`
            )}
          </span>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage() || loading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
