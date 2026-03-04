/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/mutasi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import { MutasiType } from "@/lib/types";

// Set timeout lebih lama (3 menit)
const TIMEOUT = 180000; // 180 detik dalam milliseconds

export async function GET(request: NextRequest) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Ambil parameter dari URL
    const tgl1 = searchParams.get("tgl1");
    const tgl2 = searchParams.get("tgl2");
    const loc = searchParams.get("loc") || "%";
    const item = searchParams.get("item") || "%";
    const periodeR = searchParams.get("periodeR") || "201905";
    const kategori = searchParams.get("kategori") || "";
    const itemid = searchParams.get("itemid") || "%";

    console.log("API Mutasi Received params:", {
      tgl1,
      tgl2,
      loc,
      item,
      periodeR,
      kategori,
      itemid,
    });

    if (!tgl1 || !tgl2) {
      return NextResponse.json(
        { error: "Parameter tgl1 dan tgl2 harus diisi" },
        { status: 400 },
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tgl1) || !dateRegex.test(tgl2)) {
      return NextResponse.json(
        { error: "Format tanggal harus YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const validKategori = [
      "",
      "BAHAN BAKU",
      "MODAL",
      "BARANG JADI",
      "SCRAP",
      "WIP",
    ];
    if (kategori && !validKategori.includes(kategori)) {
      return NextResponse.json(
        {
          error: "Kategori tidak valid",
          validKategori: validKategori.filter((k) => k !== ""),
        },
        { status: 400 },
      );
    }

    let pool;
    try {
      pool = await getPool();
      console.log("Database connection successful");
    } catch (connError: any) {
      console.error("Database connection failed:", connError);
      return NextResponse.json(
        {
          success: false,
          error: "Gagal terhubung ke database",
          details: connError?.message || "Connection error",
        },
        { status: 503 },
      );
    }

    console.log(
      "Executing store procedure rpMutasiBarangbc with kategori:",
      kategori || "SEMUA",
    );

    // Buat promise untuk store procedure dengan timeout manual
    const executeSP = async () => {
      try {
        const result = await pool
          .request()
          .input("TGL1", tgl1)
          .input("TGL2", tgl2)
          .input("LOC", loc)
          .input("ITEM", item)
          .input("PeriodeR", periodeR)
          .input("kategori", kategori)
          .input("itemid", itemid)
          .execute("rpMutasiBarangbc");

        return result;
      } catch (spError: any) {
        // Tangkap error timeout dari driver
        if (
          spError.code === "ETIMEOUT" ||
          spError.message?.includes("Timeout")
        ) {
          throw new Error(
            `Store procedure timeout after ${TIMEOUT / 1000} seconds`,
          );
        }
        throw spError;
      }
    };

    // Race antara eksekusi SP dan timeout
    const result = await Promise.race([
      executeSP(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`API timeout after ${TIMEOUT / 1000} seconds`)),
          TIMEOUT,
        ),
      ),
    ]);

    console.log("Raw data count:", (result as any).recordset?.length || 0);

    if ((result as any).recordset?.length > 0) {
      console.log("Sample raw data:", (result as any).recordset[0]);
    }

    // Transform data dengan chunking
    const transformedData: MutasiType[] = [];
    const chunkSize = 500;
    const recordset = (result as any).recordset || [];

    for (let i = 0; i < recordset.length; i += chunkSize) {
      const chunk = recordset.slice(i, i + chunkSize);
      const transformedChunk = chunk.map((item: any) => ({
        KodeBarang:
          item.KodeBarang || item.kodebarang || item.Kode_Barang || "",
        NamaBarang:
          item.NamaBarang || item.namabarang || item.Nama_Barang || "",
        Satuan: item.Satuan || item.satuan || "",
        saldoawal: item.saldoawal ? Number(item.saldoawal) : 0,
        pemasukan: item.pemasukan ? Number(item.pemasukan) : 0,
        pengeluaran: item.pengeluaran ? Number(item.pengeluaran) : 0,
        peneyesuaian: item.peneyesuaian ? Number(item.peneyesuaian) : 0,
        saldoakhir: item.saldoakhir ? Number(item.saldoakhir) : 0,
        stokopname: item.stokopname ? Number(item.stokopname) : 0,
        seleisih: item.seleisih ? Number(item.seleisih) : 0,
        keterangan: item.keterangan || item.Keterangan || "",
      }));
      transformedData.push(...transformedChunk);

      if (i + chunkSize < recordset.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: transformedData,
        message: `Data mutasi ${kategori || "semua kategori"} periode ${tgl1} s/d ${tgl2} berhasil diambil`,
        meta: {
          total: transformedData.length,
          kategori: kategori || "semua",
          params: { tgl1, tgl2, loc, item, periodeR, kategori, itemid },
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    console.error("Error fetching mutasi:", {
      message: error?.message,
      code: error?.code,
      name: error?.name,
    });

    // Handle timeout error
    if (error?.message?.includes("timeout") || error?.code === "ETIMEOUT") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout - data terlalu besar",
          details: "Silahkan persempit rentang tanggal (maksimal 1 bulan)",
        },
        { status: 408 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data mutasi",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
