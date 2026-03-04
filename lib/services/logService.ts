// lib/services/logService.ts
import { LogType } from "@/lib/types";

export interface LogResponse {
  success: boolean;
  data?: LogType[];
  error?: string;
  message?: string;
  meta?: {
    total: number;
    periode: {
      tgl1: string;
      tgl2: string;
    };
    filter: string;
  };
}

export async function getLog(tgl1: string, tgl2: string): Promise<LogResponse> {
  try {
    console.log("Log Service calling API with:", { tgl1, tgl2 });

    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(`/api/log?${params.toString()}`);

    console.log("Log API Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.details || "Gagal mengambil data log",
      );
    }

    const result = await response.json();
    console.log("Log API Response data count:", result.data?.length);
    console.log("Log API Response meta:", result.meta);

    return result;
  } catch (error) {
    console.error("Error fetching log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}
