/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/mutasiService.ts
import { MutasiType } from "@/lib/types";

export interface MutasiResponse {
  success: boolean;
  data?: MutasiType[];
  error?: string;
  message?: string;
  meta?: {
    total: number;
  };
}

// Bahan Baku
export async function getBahanBaku(
  tgl1: string,
  tgl2: string,
): Promise<MutasiResponse> {
  try {
    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(`/api/mutasi/bahan-baku?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || "Gagal mengambil data");
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Barang Jadi
export async function getBarangJadi(
  tgl1: string,
  tgl2: string,
): Promise<MutasiResponse> {
  try {
    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(
      `/api/mutasi/barang-jadi?${params.toString()}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || "Gagal mengambil data");
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Modal
export async function getModal(
  tgl1: string,
  tgl2: string,
): Promise<MutasiResponse> {
  try {
    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(`/api/mutasi/modal?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || "Gagal mengambil data");
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Scrap
export async function getScrap(
  tgl1: string,
  tgl2: string,
): Promise<MutasiResponse> {
  try {
    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(`/api/mutasi/scrap?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || "Gagal mengambil data");
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// WIP
export async function getWIP(
  tgl1: string,
  tgl2: string,
): Promise<MutasiResponse> {
  try {
    const params = new URLSearchParams({ tgl1, tgl2 });
    const response = await fetch(`/api/mutasi/wip?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || "Gagal mengambil data");
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
