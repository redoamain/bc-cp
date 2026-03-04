/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/mutasi/modal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import { MutasiType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tgl1 = searchParams.get("tgl1");
    const tgl2 = searchParams.get("tgl2");

    if (!tgl1 || !tgl2) {
      return NextResponse.json(
        { error: "Parameter tgl1 dan tgl2 harus diisi" },
        { status: 400 },
      );
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("TGL1", tgl1)
      .input("TGL2", tgl2)
      .input("LOC", "%")
      .input("ITEM", "%")
      .input("PeriodeR", "201905")
      .input("kategori", "MODAL")
      .input("itemid", "%")
      .execute("rpMutasiBarangbc");

    const transformedData: MutasiType[] = result.recordset.map((item: any) => ({
      KodeBarang: item.KodeBarang || item.kodebarang || "",
      NamaBarang: item.NamaBarang || item.namabarang || "",
      Satuan: item.Satuan || item.satuan || "",
      saldoawal: item.saldoawal ? Number(item.saldoawal) : 0,
      Pemasukan: item.Pemasukan ? Number(item.Pemasukan) : 0,
      Pengeluaran: item.Pengeluaran ? Number(item.Pengeluaran) : 0,
      Penyesuaian: item.Penyesuaian ? Number(item.Penyesuaian) : 0,
      SaldoAkhir: item.SaldoAkhir ? Number(item.SaldoAkhir) : 0,
      stokopname: item.stokopname ? Number(item.stokopname) : 0,
      selisih: item.selisih ? Number(item.selisih) : 0,
      Keterangan: item.Keterangan || "",
      Pencacahan: item.Pencacahan ? Number(item.Pencacahan) : 0,
    }));
    return NextResponse.json({
      success: true,
      data: transformedData,
      message: `Data modal periode ${tgl1} s/d ${tgl2} berhasil diambil`,
      meta: {
        total: transformedData.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching modal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data modal",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
