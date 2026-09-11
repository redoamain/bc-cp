// components/filter-tanggal.tsx
"use client";

import { useState } from "react";
import { CalendarIcon, Search} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FilterTanggalProps {
  onFilter: (tgl1: string, tgl2: string) => void;
  onExport?: () => void;
  isLoading?: boolean;
  defaultTgl1?: string;
  defaultTgl2?: string;
  title?: string;
  description?: string;
}

export function FilterTanggal({
  onFilter,
  isLoading = false,
  defaultTgl1,
  defaultTgl2,
  title = "Filter Periode",
  description = "Tentukan rentang tanggal untuk memfilter laporan data",
}: FilterTanggalProps) {
  // Parse default dates - lakukan sekali di initialization
  const parseDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  // Initialize state with props directly - no useEffect needed
  const [tgl1, setTgl1] = useState<Date | undefined>(() => parseDate(defaultTgl1));
  const [tgl2, setTgl2] = useState<Date | undefined>(() => parseDate(defaultTgl2));
  const [isTgl1Open, setIsTgl1Open] = useState(false);
  const [isTgl2Open, setIsTgl2Open] = useState(false);

  const handleFilter = () => {
    if (tgl1 && tgl2) {
      const tgl1Str = format(tgl1, "yyyy-MM-dd");
      const tgl2Str = format(tgl2, "yyyy-MM-dd");
      onFilter(tgl1Str, tgl2Str);
    }
  };

  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return "Pilih tanggal";
    return format(date, "dd MMMM yyyy", { locale: id });
  };

  return (
    <Card className="border border-slate-200/80 shadow-xs bg-white">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Tanggal Awal</label>
            <Popover open={isTgl1Open} onOpenChange={setIsTgl1Open}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs h-9.5 border-slate-200 hover:bg-slate-50 text-slate-800",
                    !tgl1 && "text-slate-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  {formatDisplayDate(tgl1)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tgl1}
                  onSelect={(date) => {
                    setTgl1(date);
                    setIsTgl1Open(false);
                  }}
                  initialFocus
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Tanggal Akhir</label>
            <Popover open={isTgl2Open} onOpenChange={setIsTgl2Open}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs h-9.5 border-slate-200 hover:bg-slate-50 text-slate-800",
                    !tgl2 && "text-slate-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  {formatDisplayDate(tgl2)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tgl2}
                  onSelect={(date) => {
                    setTgl2(date);
                    setIsTgl2Open(false);
                  }}
                  initialFocus
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="lg:col-span-2">
            <Button 
              onClick={handleFilter} 
              disabled={!tgl1 || !tgl2 || isLoading}
              className="w-full h-9.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            >
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Tampilkan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}