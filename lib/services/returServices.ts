// lib/services/returService.ts
import { ReturPembelianType } from "@/lib/types";

export interface ReturPembelianResponse {
  success: boolean;
  data?: ReturPembelianType[];
  error?: string;
  message?: string;
  meta?: {
    total: number;
    periode: {
      tgl1: string;
      tgl2: string;
    };
  };
}

export async function getRetur(
  tgl1: string,
  tgl2: string,
): Promise<ReturPembelianResponse> {
  try {
    console.log("Service calling API with:", { tgl1, tgl2 }); // DEBUG

    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(`/api/retur?${params.toString()}`);

    console.log("API Response status:", response.status); // DEBUG

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.details || "Gagal mengambil data",
      );
    }

    const result = await response.json();
    console.log("API Response data count:", result.data?.length); // DEBUG
    console.log("API Response meta:", result.meta); // DEBUG

    return result;
  } catch (error) {
    console.error("Error fetching pemasukan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}
