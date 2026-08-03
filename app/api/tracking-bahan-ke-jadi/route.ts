import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // ============================================
    // 1. DATA UTAMA: Ambil dari rpPemasukan
    // ============================================
    const pemasukanResult = await pool
      .request()
      .input("tgl1", sql.DateTime, new Date(startDate || new Date()))
      .input("tgl2", sql.DateTime, new Date(endDate || new Date()))
      .execute("rpPemasukan");

    const pemasukanData = pemasukanResult.recordset;
    console.log(`📦 Pemasukan data: ${pemasukanData.length}`);

    if (pemasukanData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        summary: {
          total_bahan: 0,
          total_jumlah_masuk: 0,
          total_terpakai: 0,
          total_barang_jadi: 0,
        },
      });
    }

    // ============================================
    // 2. PEMAKAIAN dari PRODUKSI (ItemType = 'B')
    // ============================================
    const produksiQuery = `
      SELECT 
        hd.[ProdID] AS No_Transaksi,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal,
        UPPER(dt.[ItemID]) AS ItemID_Bahan_Upper,
        dt.[ItemID] AS ItemID_Bahan_Original,
        dt.[Kgs] AS Jumlah,
        dt.[UserName] AS PIC,
        hd.[OrderID] AS Keterangan
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      WHERE dt.[ItemType] = 'B'
    `;

    // ============================================
    // 3. BARANG JADI dari PRODUKSI (ItemType = 'H')
    // ============================================
    const hasilQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Hasil,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Hasil,
        UPPER(dt.[ItemID]) AS ItemID_Hasil_Upper,
        dt.[ItemID] AS ItemID_Hasil_Original,
        dt.[Kgs] AS Jumlah_Hasil,
        dt.[UserName] AS PIC_Hasil
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      WHERE dt.[ItemType] = 'H'
    `;

    // ============================================
    // 4. DATA MASTER: Ambil kategori barang
    // ============================================
    const masterItemsQuery = `
      SELECT 
        i.[ItemID],
        UPPER(i.[ItemID]) AS ItemID_Upper,
        i.[ItemName] AS NamaItem,
        i.[KodeJenis],
        kr.[NamaJenis] AS Kategori
      FROM [cp].[dbo].[taGoods] AS i
      LEFT JOIN [cp].[dbo].[taKindofGoods] AS kr ON kr.[KodeJenis] = i.[KodeJenis]
      WHERE i.[ItemID] IS NOT NULL
        AND UPPER(kr.[NamaJenis]) IN ('BAHAN BAKU')
    `;

    let produksiData: any[] = [];
    let hasilData: any[] = [];
    let masterItemsData: any[] = [];

    // Ambil data dengan filter tanggal
    if (startDate && endDate) {
      const req = pool.request();
      req.input("StartDate", sql.Date, new Date(startDate));
      req.input("EndDate", sql.Date, new Date(endDate));

      const produksiResult = await req.query(`
        SELECT * FROM (${produksiQuery}) AS sub
        WHERE Tanggal >= @StartDate AND Tanggal <= @EndDate
      `);
      produksiData = produksiResult.recordset;

      const hasilResult = await req.query(`
        SELECT * FROM (${hasilQuery}) AS sub
        WHERE Tanggal_Hasil >= @StartDate AND Tanggal_Hasil <= @EndDate
      `);
      hasilData = hasilResult.recordset;
    } else {
      const produksiResult = await pool.request().query(produksiQuery);
      produksiData = produksiResult.recordset;

      const hasilResult = await pool.request().query(hasilQuery);
      hasilData = hasilResult.recordset;
    }

    // Ambil master items
    const masterResult = await pool.request().query(masterItemsQuery);
    masterItemsData = masterResult.recordset;

    const masterItemsMap = new Map();
    masterItemsData.forEach((item: any) => {
      if (item.ItemID_Upper) {
        masterItemsMap.set(item.ItemID_Upper, item);
      }
    });

    console.log(`📊 Master items: ${masterItemsMap.size}`);

    // ============================================
    // 5. FILTER PEMASUKAN
    // ============================================
    const pemasukanFiltered = pemasukanData.filter((item: any) => {
      const itemId = item.kodebarang;
      if (!itemId) return false;
      return masterItemsMap.has(itemId.toUpperCase());
    });

    console.log(`📦 Pemasukan setelah filter: ${pemasukanFiltered.length}`);

    if (pemasukanFiltered.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        summary: {
          total_bahan: 0,
          total_jumlah_masuk: 0,
          total_terpakai: 0,
          total_barang_jadi: 0,
        },
      });
    }

    // ============================================
    // 6. GROUP PEMAKAIAN
    // ============================================
    const semuaPemakaian = new Map<string, any[]>();

    for (const item of produksiData) {
      const itemIdUpper = item.ItemID_Bahan_Upper;
      if (!itemIdUpper) continue;
      if (!masterItemsMap.has(itemIdUpper)) continue;

      if (!semuaPemakaian.has(itemIdUpper)) {
        semuaPemakaian.set(itemIdUpper, []);
      }
      semuaPemakaian.get(itemIdUpper)!.push({
        No_Transaksi: item.No_Transaksi || "-",
        SPK: item.SPK || "-",
        Tanggal: item.Tanggal || "-",
        Jumlah: item.Jumlah || 0,
        PIC: item.PIC || "-",
        Keterangan: `SPK: ${item.SPK || "-"}`,
        ItemID_Original: item.ItemID_Bahan_Original || "-",
      });
    }

    // Group hasil berdasarkan SPK
    const hasilBySPK = new Map<string, any[]>();
    for (const item of hasilData) {
      const spk = item.SPK;
      if (!spk) continue;

      if (!hasilBySPK.has(spk)) {
        hasilBySPK.set(spk, []);
      }
      hasilBySPK.get(spk)!.push({
        ProdID_Hasil: item.ProdID_Hasil || "-",
        ItemID_Hasil:
          item.ItemID_Hasil_Original || item.ItemID_Hasil_Upper || "-",
        Jumlah_Hasil: item.Jumlah_Hasil || 0,
        Tanggal_Hasil: item.Tanggal_Hasil || "-",
        SPK: item.SPK || "-",
        PIC_Hasil: item.PIC_Hasil || "-",
      });
    }

    // ============================================
    // 7. GROUP PEMASUKAN
    // ============================================
    const pemasukanGrouped = new Map<string, any[]>();
    for (const item of pemasukanFiltered) {
      const itemId = item.kodebarang;
      if (!itemId) continue;

      const key = itemId.toUpperCase();
      if (!pemasukanGrouped.has(key)) {
        pemasukanGrouped.set(key, []);
      }
      pemasukanGrouped.get(key)!.push(item);
    }

    console.log(`📦 Total item unik: ${pemasukanGrouped.size}`);

    // ============================================
    // 8. FUNGSI GET STOCK DARI DATABASE
    // ============================================
    async function getStockFromDB(
      itemName: string,
      date: string,
    ): Promise<number> {
      try {
        if (!itemName) return 0;

        console.log(`🔍 Mencari stock di DB: "${itemName}" pada ${date}`);

        // Gunakan NAMA BARANG untuk query stock
        const result = await pool
          .request()
          .input("PeriodeR", sql.VarChar(6), "201905")
          .input("Loc", sql.VarChar(6), "%")
          .input("Item", sql.VarChar(500), itemName) // <-- PAKAI NAMA BARANG
          .input("Tgl", sql.DateTime, new Date(date))
          .input("company", sql.Int, 0)
          .input("tipestock", sql.SmallInt, 0)
          .input("jenisbarang", sql.SmallInt, 0)
          .input("kategori", sql.VarChar(20), "%")
          .input("minus", sql.Int, 1)
          .execute("[dbo].[rpStockL]");

        const data = result.recordset;
        console.log(
          `📊 Hasil query untuk "${itemName}": ${data.length} records`,
        );

        // Cari total Kgs
        let totalKgs = 0;
        for (const row of data) {
          const keys = Object.keys(row);
          for (const key of keys) {
            if (key.toLowerCase() === "totalkgs") {
              const val = row[key];
              if (val !== null && val !== undefined && val !== "") {
                const numVal = Number(val);
                if (!isNaN(numVal)) {
                  totalKgs += numVal;
                }
              }
              break;
            }
          }
        }

        console.log(`✅ Stock "${itemName}" pada ${date} = ${totalKgs}`);
        return totalKgs;
      } catch (error) {
        console.error(`Error getting stock from DB for "${itemName}":`, error);
        return 0;
      }
    }

    // ============================================
    // 9. PROSES DATA
    // ============================================
    const resultData: any[] = [];

    for (const [itemIdUpper, pemasukanList] of pemasukanGrouped) {
      const itemIdOriginals = pemasukanList
        .map((p) => p.kodebarang)
        .filter((id): id is string => !!id);

      const masterItem = masterItemsMap.get(itemIdUpper);

      let namaBahan = masterItem?.NamaItem || "-";
      if (namaBahan === "-" && pemasukanList.length > 0) {
        namaBahan = pemasukanList[0].Namabarang || itemIdUpper;
      }

      const kategori = masterItem?.Kategori || "-";

      // === DATA PEMASUKAN ===
      const totalMasuk = pemasukanList.reduce(
        (sum, p) => sum + (p.Jumlah || 0),
        0,
      );

      // Kumpulkan semua Nomor BPB
      const allNomorBPB = pemasukanList
        .map((p) => p.NomorBPB || "-")
        .filter((n) => n !== "-");

      // Kumpulkan semua ItemID Original
      const allItemIDOriginal = [...new Set(itemIdOriginals)];

      // Semua Tanggal Masuk
      const allTanggalBPB = pemasukanList
        .filter((p) => p.TanggalBPB)
        .map((p) => new Date(p.TanggalBPB).toISOString().split("T")[0])
        .filter((date): date is string => !!date)
        .sort();

      // Kumpulkan semua Jenis Dokumen unik
      const uniqueJenisDokumen = new Set();
      for (const p of pemasukanList) {
        if (p.JenisDokPabean && p.JenisDokPabean !== "-") {
          uniqueJenisDokumen.add(p.JenisDokPabean);
        }
      }
      const jenisDokumenText =
        uniqueJenisDokumen.size > 0
          ? Array.from(uniqueJenisDokumen).join(" | ")
          : "-";

      // Kumpulkan semua Pemasok unik
      const uniquePemasok = new Set();
      for (const p of pemasukanList) {
        if (p.PemasokPengirim && p.PemasokPengirim !== "-") {
          uniquePemasok.add(p.PemasokPengirim);
        }
      }
      const pemasokText =
        uniquePemasok.size > 0 ? Array.from(uniquePemasok).join(" | ") : "-";

      // === PEMAKAIAN ===
      const pemakaianList = semuaPemakaian.get(itemIdUpper) || [];
      const totalKgsTerpakai = pemakaianList.reduce(
        (sum, p) => sum + (p.Jumlah || 0),
        0,
      );

      // === BARANG JADI ===
      const semuaBarangJadi: any[] = [];
      const spkSudahDiproses = new Set<string>();

      const spkList = pemakaianList
        .map((p) => p.SPK)
        .filter((spk) => spk && spk !== "-");

      for (const spk of spkList) {
        if (!spkSudahDiproses.has(spk)) {
          spkSudahDiproses.add(spk);
          const hasilList = hasilBySPK.get(spk) || [];

          for (const hasil of hasilList) {
            if (hasil.SPK === spk) {
              semuaBarangJadi.push({
                ProdID_Hasil: hasil.ProdID_Hasil,
                ItemID: hasil.ItemID_Hasil,
                NamaBarang: hasil.ItemID_Hasil || "-",
                Jumlah_Kgs: hasil.Jumlah_Hasil,
                Tanggal_Produksi: hasil.Tanggal_Hasil,
                SPK: spk,
                PIC_Hasil: hasil.PIC_Hasil,
              });
            }
          }
        }
      }

      const totalBarangJadi = semuaBarangJadi.reduce(
        (sum, bj) => sum + bj.Jumlah_Kgs,
        0,
      );

      // ============================================
      // STOK AWAL: Ambil dari DATABASE dengan NAMA BARANG
      // ============================================
      let stokAwal = 0;
      const stockItemName = pemasukanList[0]?.Namabarang || namaBahan;

      if (startDate && stockItemName !== "-") {
        const startDateObj = new Date(startDate);
        const tglSebelum = new Date(startDateObj);
        tglSebelum.setDate(tglSebelum.getDate() - 1);
        const tglStr = tglSebelum.toISOString().split("T")[0];

        console.log(`📊 Mencari stock untuk "${stockItemName}" pada ${tglStr}`);
        stokAwal = await getStockFromDB(stockItemName, tglStr);
      }

      console.log(`📊 ===== ${itemIdUpper} =====`);
      console.log(`   Nama Barang: ${stockItemName}`);
      console.log(`   Stok Awal (DB): ${stokAwal}`);
      console.log(`   Total Masuk: ${totalMasuk}`);
      console.log(`   Total Terpakai: ${totalKgsTerpakai}`);

      // === PUSH DATA ===
      resultData.push({
        ItemID_Bahan: itemIdUpper,
        ItemID_Original: allItemIDOriginal.join(", "),
        NamaBahan: namaBahan,
        Kategori: kategori,

        JenisDokumen: jenisDokumenText,
        NomorBPB: allNomorBPB.join(", "),
        TanggalBPB: allTanggalBPB.length > 0 ? allTanggalBPB.join(", ") : null,
        Pemasok: pemasokText,
        JumlahMasuk_Kgs: totalMasuk,

        StokAwal: stokAwal,

        DigunakanDiProduksi: pemakaianList,
        TotalKgsTerpakai: totalKgsTerpakai,

        MenghasilkanBarangJadi: semuaBarangJadi,
        TotalBarangJadi: totalBarangJadi,

        HasPemakaian: totalKgsTerpakai > 0,
        JumlahPemakaian: pemakaianList.length,
      });
    }

    // ============================================
    // 10. FINAL
    // ============================================
    const finalData = resultData.sort((a, b) =>
      a.ItemID_Bahan.localeCompare(b.ItemID_Bahan),
    );

    console.log(`📊 Final data: ${finalData.length} items`);

    const summary = {
      total_bahan: finalData.length,
      total_jumlah_masuk: finalData.reduce((s, i) => s + i.JumlahMasuk_Kgs, 0),
      total_terpakai: finalData.reduce((s, i) => s + i.TotalKgsTerpakai, 0),
      total_barang_jadi: finalData.reduce((s, i) => s + i.TotalBarangJadi, 0),
      total_pemasukan: pemasukanFiltered.length,
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
