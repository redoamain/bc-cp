import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

// Fungsi normalisasi satuan barang
function normalizeSatuan(satuan?: string): string {
  if (!satuan) return "";
  const s = satuan.trim().toUpperCase();
  if (s === "KGS" || s === "KGM") return "KG";
  if (s === "PC" || s === "PCE") return "PCS";
  if (s === "METERS") return "METER";
  if (s === "ROLLS") return "ROLL";
  if (s === "SETS") return "SET";
  return s;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // 1. Ambil data dari rpPemasukan
    const startDateObj = startDate ? new Date(startDate) : new Date();
    const endDateObj = endDate ? new Date(endDate) : new Date();
    // Pastikan batas waktu mencakup awal s/d akhir hari
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(23, 59, 59, 999);

    const pemasukanResult = await pool
      .request()
      .input("tgl1", sql.DateTime, startDateObj)
      .input("tgl2", sql.DateTime, endDateObj)
      .execute("rpPemasukan");

    const pemasukanData = pemasukanResult.recordset;
    console.log(`📦 Pemasukan data raw: ${pemasukanData.length} records`);

    // 2. Ambil data BAHAN dari produksi (ItemType = 'B') disertai Satuan dari taGoods
    const bahanQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Bahan,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Produksi,
        dt.[ItemID] AS ItemID_Bahan,
        dt.[Kgs] AS Jumlah_Bahan,
        COALESCE(g.[SatuanKecil], 'KG') AS Satuan_Bahan,
        dt.[UserName] AS PIC_Bahan
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      LEFT JOIN [cp].[dbo].[taGoods] AS g
        ON dt.[ItemID] = g.[ItemID]
      WHERE dt.[ItemType] = 'B'
    `;

    // 3. Ambil data BARANG JADI (ItemType = 'H') disertai Nama Barang dan Satuan dari taGoods
    const hasilQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Hasil,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Hasil,
        dt.[ItemID] AS ItemID_Hasil,
        COALESCE(g.[ItemName], g.[namebc], dt.[ItemID]) AS NamaBarang_Hasil,
        COALESCE(g.[SatuanKecil], 'PCS') AS Satuan_Hasil,
        dt.[Kgs] AS Jumlah_Hasil,
        dt.[UserName] AS PIC_Hasil
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      LEFT JOIN [cp].[dbo].[taGoods] AS g
        ON dt.[ItemID] = g.[ItemID]
      WHERE dt.[ItemType] = 'H'
    `;

    let bahanData = [];
    let hasilData = [];

    if (startDate && endDate) {
      const req = pool.request();
      req.input("StartDate", sql.Date, new Date(startDate));
      req.input("EndDate", sql.Date, new Date(endDate));

      const bahanResult = await req.query(`
        ${bahanQuery}
        AND CONVERT(DATE, hd.[ProdDate]) >= @StartDate 
        AND CONVERT(DATE, hd.[ProdDate]) <= @EndDate
      `);
      bahanData = bahanResult.recordset;

      const hasilResult = await req.query(`
        ${hasilQuery}
        AND CONVERT(DATE, hd.[ProdDate]) >= @StartDate 
        AND CONVERT(DATE, hd.[ProdDate]) <= @EndDate
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
    const bahanByItem = new Map<string, any[]>();
    for (const item of bahanData) {
      const itemId = item.ItemID_Bahan;
      if (!itemId) continue;
      if ((item.Jumlah_Bahan || 0) === 0) continue;

      if (!bahanByItem.has(itemId)) {
        bahanByItem.set(itemId, []);
      }
      bahanByItem.get(itemId)!.push({
        ProdID_Bahan: item.ProdID_Bahan || "-",
        SPK: item.SPK || "-",
        Tanggal_Produksi: item.Tanggal_Produksi || "-",
        Jumlah_Bahan: item.Jumlah_Bahan || 0,
        Satuan_Bahan: normalizeSatuan(item.Satuan_Bahan) || "KG",
        PIC_Bahan: item.PIC_Bahan || "-",
      });
    }

    // 5. Group hasil berdasarkan SPK
    const hasilBySPK = new Map<string, any[]>();
    for (const item of hasilData) {
      const spk = item.SPK;
      if (!spk) continue;

      if (!hasilBySPK.has(spk)) {
        hasilBySPK.set(spk, []);
      }
      hasilBySPK.get(spk)!.push({
        ProdID_Hasil: item.ProdID_Hasil || "-",
        ItemID_Hasil: item.ItemID_Hasil || "-",
        NamaBarang_Hasil: item.NamaBarang_Hasil || item.ItemID_Hasil || "-",
        Satuan_Hasil: normalizeSatuan(item.Satuan_Hasil) || "PCS",
        Jumlah_Hasil: item.Jumlah_Hasil || 0,
        Tanggal_Hasil: item.Tanggal_Hasil || "-",
        SPK: item.SPK || "-",
        PIC_Hasil: item.PIC_Hasil || "-",
      });
    }

    // 6. AGREGASI PEMASUKAN BERDASARKAN KODE BARANG DENGAN SATUAN DINAMIS (KG, PCS, DLL)
    const pemasukanGrouped = new Map<
      string,
      {
        itemId: string;
        namaBahan: string;
        satuan: string;
        totalJumlahMasuk: number;
        daftarPemasukan: Array<{
          nomorBPB: string;
          tanggalBPB: string | null;
          jumlah: number;
          satuan: string;
          pemasok: string;
          jenisDokumen: string;
          nomorPO?: string;
          nomorDokumen?: string;
        }>;
        nomorBPBList: string[];
        tanggalBPBList: string[];
        pemasokList: string[];
        jenisDokumenList: string[];
      }
    >();

    for (const row of pemasukanData) {
      const itemId = String(row.kodebarang || "").trim();
      if (!itemId) continue;

      const jumlah = Number(row.Jumlah) || 0;
      const satuan = normalizeSatuan(row.Satuan) || "KG";
      const nomorBPB = String(row.NomorBPB || "-").trim();
      const tanggalBPB = row.TanggalBPB
        ? new Date(row.TanggalBPB).toISOString().split("T")[0]
        : null;
      const pemasok = String(row.PemasokPengirim || "-").trim();
      const jenisDokumen = String(row.JenisDokPabean || "-").trim();
      const namaBahan = String(row.Namabarang || "-").trim();
      const nomorPO = String(row.NomorPO || "").trim();
      const nomorDokumen = String(row.NomorDokPabean || "").trim();

      if (!pemasukanGrouped.has(itemId)) {
        pemasukanGrouped.set(itemId, {
          itemId,
          namaBahan: namaBahan !== "-" ? namaBahan : itemId,
          satuan: satuan,
          totalJumlahMasuk: 0,
          daftarPemasukan: [],
          nomorBPBList: [],
          tanggalBPBList: [],
          pemasokList: [],
          jenisDokumenList: [],
        });
      }

      const entry = pemasukanGrouped.get(itemId)!;
      entry.totalJumlahMasuk += jumlah;
      if (
        (entry.namaBahan === "-" || entry.namaBahan === itemId) &&
        namaBahan !== "-"
      ) {
        entry.namaBahan = namaBahan;
      }
      if (satuan && (!entry.satuan || entry.satuan === "KG") && satuan !== "KG") {
        entry.satuan = satuan;
      }

      entry.daftarPemasukan.push({
        nomorBPB,
        tanggalBPB,
        jumlah,
        satuan,
        pemasok,
        jenisDokumen,
        nomorPO,
        nomorDokumen,
      });

      if (
        nomorBPB &&
        nomorBPB !== "-" &&
        !entry.nomorBPBList.includes(nomorBPB)
      ) {
        entry.nomorBPBList.push(nomorBPB);
      }
      if (tanggalBPB && !entry.tanggalBPBList.includes(tanggalBPB)) {
        entry.tanggalBPBList.push(tanggalBPB);
      }
      if (pemasok && pemasok !== "-" && !entry.pemasokList.includes(pemasok)) {
        entry.pemasokList.push(pemasok);
      }
      if (
        jenisDokumen &&
        jenisDokumen !== "-" &&
        !entry.jenisDokumenList.includes(jenisDokumen)
      ) {
        entry.jenisDokumenList.push(jenisDokumen);
      }
    }

    console.log(
      `📦 Agregasi bahan unik: ${pemasukanGrouped.size} dari ${pemasukanData.length} records BPB`,
    );

    // 7. Fungsi get stock dengan timeout aman
    async function getStockForItem(itemId: string): Promise<number> {
      try {
        if (!itemId) return 0;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const stockUrl = new URL(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/stock`,
        );
        stockUrl.searchParams.set("item", itemId);
        stockUrl.searchParams.set("tgl", new Date().toISOString());
        stockUrl.searchParams.set("minus", "1");

        const response = await fetch(stockUrl.toString(), {
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return data.stockAkhir?.totalKgs || 0;
        }
        return 0;
      } catch {
        return 0;
      }
    }

    // 8. Proses setiap item bahan unik secara concurrent
    const groupedItems = Array.from(pemasukanGrouped.values());

    const finalData = await Promise.all(
      groupedItems.map(async (group) => {
        const itemId = group.itemId;
        const pemakaianList = bahanByItem.get(itemId) || [];
        const totalTerpakai = pemakaianList.reduce(
          (sum: number, p: { Jumlah_Bahan: number }) =>
            sum + (p.Jumlah_Bahan || 0),
          0,
        );

        // Cari barang jadi yang dihasilkan dari SPK yang SAMA dengan pemakaian
        const semuaBarangJadi: Array<{
          ProdID_Hasil: string;
          ItemID: string;
          NamaBarang: string;
          Satuan: string;
          Jumlah: number;
          Jumlah_Kgs: number;
          Tanggal_Produksi: string;
          SPK: string;
          PIC_Hasil: string;
        }> = [];
        const spkSudahDiproses = new Set<string>();

        for (const pemakaian of pemakaianList) {
          const spk = pemakaian.SPK;
          if (!spkSudahDiproses.has(spk)) {
            spkSudahDiproses.add(spk);
            const hasilList = hasilBySPK.get(spk) || [];
            for (const hasil of hasilList) {
              if (hasil.SPK === spk) {
                semuaBarangJadi.push({
                  ProdID_Hasil: hasil.ProdID_Hasil,
                  ItemID: hasil.ItemID_Hasil,
                  NamaBarang:
                    hasil.NamaBarang_Hasil || hasil.ItemID_Hasil || "-",
                  Satuan: hasil.Satuan_Hasil || "PCS",
                  Jumlah: hasil.Jumlah_Hasil || 0,
                  Jumlah_Kgs: hasil.Jumlah_Hasil || 0,
                  Tanggal_Produksi: hasil.Tanggal_Hasil,
                  SPK: spk,
                  PIC_Hasil: hasil.PIC_Hasil,
                });
              }
            }
          }
        }

        // Ambil stok
        const stockSekarang = await getStockForItem(itemId);
        const stokAwal = Math.max(
          stockSekarang + totalTerpakai - group.totalJumlahMasuk,
          0,
        );
        const totalStokTersedia = Math.max(
          stokAwal + group.totalJumlahMasuk,
          0,
        );
        const persentase =
          totalStokTersedia > 0
            ? Math.round((totalTerpakai / totalStokTersedia) * 100)
            : 0;

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

        const nomorBPBDisplay =
          group.nomorBPBList.length > 0
            ? group.nomorBPBList.join(", ")
            : "-";

        const sortedTgl = [...group.tanggalBPBList].sort();
        const tanggalBPBDisplay =
          sortedTgl.length === 0
            ? null
            : sortedTgl.length === 1
              ? sortedTgl[0]
              : `${sortedTgl[0]} s/d ${sortedTgl[sortedTgl.length - 1]}`;

        const pemasokDisplay =
          group.pemasokList.length > 0
            ? group.pemasokList.join(", ")
            : "-";

        const jenisDokumenDisplay =
          group.jenisDokumenList.length > 0
            ? group.jenisDokumenList.join(", ")
            : "-";

        // Cari satuan barang jadi dominan/unik untuk item ini
        const satuanJadiSet = new Set(
          semuaBarangJadi.map((b) => b.Satuan).filter(Boolean),
        );
        const satuanBarangJadi =
          Array.from(satuanJadiSet).join(", ") || "PCS";

        return {
          ItemID_Bahan: itemId,
          NamaBahan: group.namaBahan,
          Satuan: group.satuan,
          JenisDokumen: jenisDokumenDisplay,
          NomorBPB: nomorBPBDisplay,
          TanggalBPB: tanggalBPBDisplay,
          Pemasok: pemasokDisplay,
          JumlahMasuk: group.totalJumlahMasuk,
          JumlahMasuk_Kgs: group.totalJumlahMasuk, // alias untuk backward compatibility
          DaftarPemasukan: group.daftarPemasukan,
          TotalBPBCount: group.daftarPemasukan.length,

          StokAwal: stokAwal,
          TotalStokTersedia: totalStokTersedia,
          StockSekarang: stockSekarang,

          DigunakanDiProduksi: pemakaianList,
          TotalKgsTerpakai: totalTerpakai,
          TotalTerpakai: totalTerpakai,
          PersentaseTerpakai: persentase,

          MenghasilkanBarangJadi: semuaBarangJadi,
          TotalBarangJadi: semuaBarangJadi.reduce(
            (sum, bj) => sum + (bj.Jumlah || 0),
            0,
          ),
          SatuanBarangJadi: satuanBarangJadi,

          StatusStock: statusStock,
          StatusBg: statusBg,
          IsOverUsed: totalTerpakai > totalStokTersedia,
        };
      }),
    );

    // 9. Hitung total barang jadi unik untuk menghindari duplikasi
    const uniqueBarangJadiMap = new Map<string, number>();
    for (const item of finalData) {
      for (const bj of item.MenghasilkanBarangJadi) {
        const key = `${bj.ProdID_Hasil || ""}_${bj.ItemID || ""}_${bj.SPK || ""}`;
        if (!uniqueBarangJadiMap.has(key)) {
          uniqueBarangJadiMap.set(key, bj.Jumlah || 0);
        }
      }
    }
    const totalBarangJadiUnique = Array.from(
      uniqueBarangJadiMap.values(),
    ).reduce((a, b) => a + b, 0);

    // Hitung rincian per satuan (misal KG, PCS, LEMBAR)
    const breakdownMasuk: Record<string, number> = {};
    for (const item of finalData) {
      const s = item.Satuan || "LAINNYA";
      breakdownMasuk[s] = (breakdownMasuk[s] || 0) + item.JumlahMasuk;
    }

    const breakdownJadi: Record<string, number> = {};
    for (const item of finalData) {
      for (const bj of item.MenghasilkanBarangJadi) {
        const s = bj.Satuan || "PCS";
        breakdownJadi[s] = (breakdownJadi[s] || 0) + (bj.Jumlah || 0);
      }
    }

    const summary = {
      total_bahan: finalData.length,
      total_jumlah_masuk: finalData.reduce((s, i) => s + i.JumlahMasuk, 0),
      total_terpakai: finalData.reduce((s, i) => s + i.TotalTerpakai, 0),
      total_barang_jadi: totalBarangJadiUnique,
      breakdown_masuk: breakdownMasuk,
      breakdown_jadi: breakdownJadi,
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