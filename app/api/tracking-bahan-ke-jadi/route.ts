import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // 1. Ambil data dari rpPemasukan
    const pemasukanResult = await pool
      .request()
      .input("tgl1", sql.DateTime, new Date(startDate || new Date()))
      .input("tgl2", sql.DateTime, new Date(endDate || new Date()))
      .execute("rpPemasukan");

    const pemasukanData = pemasukanResult.recordset;
    console.log(`📦 Pemasukan data: ${pemasukanData.length}`);

    // 2. Ambil data BAHAN dari produksi (ItemType = 'B')
    const bahanQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Bahan,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Produksi,
        dt.[ItemID] AS ItemID_Bahan,
        dt.[Kgs] AS Jumlah_Bahan,
        dt.[UserName] AS PIC_Bahan
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      WHERE dt.[ItemType] = 'B'
    `;

    // 3. Ambil data BARANG JADI (ItemType = 'H')
    const hasilQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Hasil,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Hasil,
        dt.[ItemID] AS ItemID_Hasil,
        dt.[Kgs] AS Jumlah_Hasil,
        dt.[UserName] AS PIC_Hasil
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      WHERE dt.[ItemType] = 'H'
    `;

    let bahanData = [];
    let hasilData = [];

    if (startDate && endDate) {
      const req = pool.request();
      req.input("StartDate", sql.Date, new Date(startDate));
      req.input("EndDate", sql.Date, new Date(endDate));

      const bahanResult = await req.query(`
        SELECT * FROM (${bahanQuery}) AS sub
        WHERE Tanggal_Produksi >= @StartDate AND Tanggal_Produksi <= @EndDate
      `);
      bahanData = bahanResult.recordset;

      const hasilResult = await req.query(`
        SELECT * FROM (${hasilQuery}) AS sub
        WHERE Tanggal_Hasil >= @StartDate AND Tanggal_Hasil <= @EndDate
      `);
      hasilData = hasilResult.recordset;
    } else {
      const bahanResult = await pool.request().query(bahanQuery);
      bahanData = bahanResult.recordset;

      const hasilResult = await pool.request().query(hasilQuery);
      hasilData = hasilResult.recordset;
    }

    // Urutkan data
    bahanData.sort(
      (a, b) =>
        new Date(b.Tanggal_Produksi).getTime() -
        new Date(a.Tanggal_Produksi).getTime(),
    );
    hasilData.sort(
      (a, b) =>
        new Date(b.Tanggal_Hasil).getTime() -
        new Date(a.Tanggal_Hasil).getTime(),
    );

    console.log(`📊 Bahan: ${bahanData.length}, Hasil: ${hasilData.length}`);

    // 4. Group bahan berdasarkan ItemID_Bahan (HANYA yang Jumlah > 0)
    const bahanByItem = new Map();
    for (const item of bahanData) {
      const itemId = item.ItemID_Bahan;
      if (!itemId) continue;

      // HANYA TAMBAHKAN JIKA JUMLAH > 0
      if ((item.Jumlah_Bahan || 0) === 0) continue;

      if (!bahanByItem.has(itemId)) {
        bahanByItem.set(itemId, []);
      }
      bahanByItem.get(itemId).push({
        ProdID_Bahan: item.ProdID_Bahan || "-",
        SPK: item.SPK || "-",
        Tanggal_Produksi: item.Tanggal_Produksi || "-",
        Jumlah_Bahan: item.Jumlah_Bahan || 0,
        PIC_Bahan: item.PIC_Bahan || "-",
      });
    }

    // 5. Group hasil berdasarkan SPK
    const hasilBySPK = new Map();
    for (const item of hasilData) {
      const spk = item.SPK;
      if (!spk) continue;

      if (!hasilBySPK.has(spk)) {
        hasilBySPK.set(spk, []);
      }
      hasilBySPK.get(spk).push({
        ProdID_Hasil: item.ProdID_Hasil || "-",
        ItemID_Hasil: item.ItemID_Hasil || "-",
        Jumlah_Hasil: item.Jumlah_Hasil || 0,
        Tanggal_Hasil: item.Tanggal_Hasil || "-",
        SPK: item.SPK || "-",
        PIC_Hasil: item.PIC_Hasil || "-",
      });
    }

    // 6. Fungsi get stock
    async function getStockForItem(itemId: string): Promise<number> {
      try {
        if (!itemId) return 0;
        const stockUrl = new URL(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/stock`,
        );
        stockUrl.searchParams.set("item", itemId);
        stockUrl.searchParams.set("tgl", new Date().toISOString());
        stockUrl.searchParams.set("minus", "1");
        const response = await fetch(stockUrl.toString(), {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          return data.stockAkhir?.totalKgs || 0;
        }
        return 0;
      } catch {
        return 0;
      }
    }

    // 7. Proses setiap item dari pemasukan
    const resultData = [];

    for (const item of pemasukanData) {
      const itemId = item.kodebarang;
      const jumlahMasuk = item.Jumlah || 0;
      const namaBahan = item.Namabarang || "-";
      const nomorBPB = item.NomorBPB || "-";
      const tanggalBPB = item.TanggalBPB
        ? new Date(item.TanggalBPB).toISOString().split("T")[0]
        : null;
      const pemasok = item.PemasokPengirim || "-";
      const jenisDokumen = item.JenisDokPabean || "-"; // ← TAMBAHKAN INI

      // Cari pemakaian bahan ini di produksi (sudah terfilter Jumlah > 0)
      const pemakaianList = bahanByItem.get(itemId) || [];
      const totalKgsTerpakai = pemakaianList.reduce(
        (sum: any, p: { Jumlah_Bahan: any }) => sum + (p.Jumlah_Bahan || 0),
        0,
      );

      // Cari barang jadi yang dihasilkan dari SPK yang SAMA dengan pemakaian VALID
      const semuaBarangJadi = [];
      for (const pemakaian of pemakaianList) {
        const hasilList = hasilBySPK.get(pemakaian.SPK) || [];
        for (const hasil of hasilList) {
          semuaBarangJadi.push({
            ProdID_Hasil: hasil.ProdID_Hasil,
            ItemID: hasil.ItemID_Hasil,
            NamaBarang: hasil.ItemID_Hasil || "-",
            Jumlah_Kgs: hasil.Jumlah_Hasil,
            Tanggal_Produksi: hasil.Tanggal_Hasil,
            SPK: pemakaian.SPK,
            PIC_Hasil: hasil.PIC_Hasil,
          });
        }
      }

      // Ambil stock
      const stockSekarang = await getStockForItem(itemId);
      const stokAwal = stockSekarang + totalKgsTerpakai - jumlahMasuk;
      const totalStokTersedia = Math.max(stokAwal + jumlahMasuk, 0);
      const persentase =
        totalStokTersedia > 0
          ? Math.round((totalKgsTerpakai / totalStokTersedia) * 100)
          : 0;

      // Status stock
      let statusStock = "Aman";
      let statusBg = "bg-green-100";
      if (stockSekarang < 0) {
        statusStock = "MINUS!";
        statusBg = "bg-red-100";
      } else if (stockSekarang === 0) {
        statusStock = "Habis";
        statusBg = "bg-orange-100";
      } else if (persentase >= 100) {
        statusStock = "Habis Terpakai";
        statusBg = "bg-orange-100";
      }

      resultData.push({
        ItemID_Bahan: itemId,
        NamaBahan: namaBahan,
        JenisDokumen: jenisDokumen, // ← TAMBAHKAN INI
        NomorBPB: nomorBPB,
        TanggalBPB: tanggalBPB,
        Pemasok: pemasok,
        JumlahMasuk_Kgs: jumlahMasuk,

        StokAwal: Math.max(stokAwal, 0),
        TotalStokTersedia: totalStokTersedia,
        StockSekarang: stockSekarang,

        DigunakanDiProduksi: pemakaianList,
        TotalKgsTerpakai: totalKgsTerpakai,
        PersentaseTerpakai: persentase,

        MenghasilkanBarangJadi: semuaBarangJadi,
        TotalBarangJadi: semuaBarangJadi.reduce(
          (sum, bj) => sum + bj.Jumlah_Kgs,
          0,
        ),

        StatusStock: statusStock,
        StatusBg: statusBg,
        IsOverUsed: totalKgsTerpakai > totalStokTersedia,
      });
    }

    // Filter unique berdasarkan ItemID_Bahan
    const uniqueData = new Map();
    for (const item of resultData) {
      if (!uniqueData.has(item.ItemID_Bahan)) {
        uniqueData.set(item.ItemID_Bahan, item);
      }
    }

    const finalData = Array.from(uniqueData.values());

    const summary = {
      total_bahan: finalData.length,
      total_jumlah_masuk: finalData.reduce((s, i) => s + i.JumlahMasuk_Kgs, 0),
      total_terpakai: finalData.reduce((s, i) => s + i.TotalKgsTerpakai, 0),
      total_barang_jadi: finalData.reduce((s, i) => s + i.TotalBarangJadi, 0),
    };

    return NextResponse.json({
      success: true,
      data: finalData,
      total: finalData.length,
      summary: summary,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
