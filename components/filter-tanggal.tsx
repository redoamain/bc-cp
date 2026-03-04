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
}

export function FilterTanggal({
  onFilter,
  isLoading = false,
  defaultTgl1,
  defaultTgl2,
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Filter Periode</CardTitle>
        <CardDescription>
          Pilih rentang tanggal untuk melihat data pemasukan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Tanggal Awal</label>
            <Popover open={isTgl1Open} onOpenChange={setIsTgl1Open}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !tgl1 && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Tanggal Akhir</label>
            <Popover open={isTgl2Open} onOpenChange={setIsTgl2Open}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !tgl2 && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          <div className="flex items-end gap-2">
            <Button 
              onClick={handleFilter} 
              disabled={!tgl1 || !tgl2 || isLoading}
              className="px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              Tampilkan
            </Button>
        
            
          </div>
        </div>
      </CardContent>
    </Card>
  );
}