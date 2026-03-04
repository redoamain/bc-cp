// app/api/retur/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/config";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tgl1 = searchParams.get("tgl1");
    const tgl2 = searchParams.get("tgl2");

    console.log("API Received params:", { tgl1, tgl2 });

    if (!tgl1 || !tgl2) {
      return NextResponse.json(
        { error: "Parameter tgl1 dan tgl2 harus diisi" },
        { status: 400 },
      );
    }

    const pool = await getPool();

    console.log("Executing store procedure with:", { tgl1, tgl2 });

    const result = await pool
      .request()
      .input("tgl1", tgl1)
      .input("tgl2", tgl2)
      .execute("rpReturPembelian");

    console.log("Raw data count:", result.recordset.length);

    // Parse tanggal awal dan akhir
    const startDate = new Date(tgl1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(tgl2);
    endDate.setHours(23, 59, 59, 999);

    // Filter data berdasarkan TanggalBPB (karena store procedure mungkin menggunakan itu)
    const filteredData = result.recordset.filter((item) => {
      // Coba filter berdasarkan TanggalBPB terlebih dahulu
      if (item.TanggalBPB) {
        const tglBPB = new Date(item.TanggalSuratJalan);
        if (tglBPB >= startDate && tglBPB <= endDate) {
          return true;
        }
      }

      // Jika tidak ada TanggalBPB atau tidak masuk rentang, coba filter berdasarkan TanggalDokPabean
      if (item.TanggalDokPabean) {
        const tglDok = new Date(item.TanggalDokPabean);
        return tglDok >= startDate && tglDok <= endDate;
      }

      return false;
    });

    console.log("Data count after filter:", filteredData.length);
    console.log("Sample filtered data:", filteredData[0]);

    // Transform data
    const transformedData = filteredData.map((item) => ({
      JenisDokPabean: item.JenisDokPabean || "",
      NomorDokPabean: item.NomorDokPabean || "",
      TanggalDokPabean: item.TanggalDokPabean || null,
      NomorSuratJalan: item.NomorSuratJalan ? Number(item.NomorSuratJalan) : 0,
      TanggalSuratJalan: item.TanggalSuratJalan || null,
      PembeliPeneima: item.PembeliPeneima || "",
      KodeBarang: item.KodeBarang || "",
      NamaBarang: item.NamaBarang || "",
      Jumlah: item.Jumlah ? Number(item.Jumlah) : 0,
      Satuan: item.Satuan || "",
      Curr: item.Curr || "USD",
      NilaiBarang: item.NilaiBarang ? Number(item.NilaiBarang) : 0,
      Nopol: item.Nopol || "",
      NoInvoice: item.NoInvoice || "",
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: `Data Retur periode ${tgl1} s/d ${tgl2} berhasil diambil`,
      meta: {
        total: transformedData.length,
        periode: { tgl1, tgl2 },
        filter: "Berdasarkan TanggalBPB dan TanggalDokPabean",
      },
    });
  } catch (error) {
    console.error("Error fetching pemasukan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data pemasukan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
