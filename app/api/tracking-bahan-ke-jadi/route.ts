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

// Fungsi menentukan departemen dari LocID, Gudang, atau Remark
function getDeptFromLocOrRemark(locId?: string, remark?: string): string {
  const loc = (locId || "").toUpperCase();
  const rem = (remark || "").toUpperCase();
  if (loc === "GUDPL" || loc.includes("PLATING") || rem.includes("PLATING") || rem.includes("LIMBAH")) return "PL";
  if (loc === "GUDAS" || loc.includes("ASSEMBLY") || rem.includes("ASSEMBLY") || rem.includes("SORTIR")) return "AS";
  if (loc === "GUDSP" || loc.includes("SPRAY") || rem.includes("SPRAY")) return "SP";
  if (loc === "GUDIN" || loc.includes("INJEKSI") || rem.includes("INJEKSI")) return "IN";
  if (loc === "GUDMO" || loc.includes("MOLDING") || rem.includes("MOLDING") || rem.includes("SPAREPART")) return "MO";
  return loc || "GUD";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // 1. Ambil data dari rpPemasukan untuk periode yang dipilih
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

    // 2. Ambil data BAHAN dari produksi SPK (ItemType = 'B') disertai Satuan dari taGoods
    const bahanQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Bahan,
        hd.[OrderID] AS SPK,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Produksi,
        dt.[ItemID] AS ItemID_Bahan,
        dt.[Kgs] AS Jumlah_Bahan,
        COALESCE(g.[SatuanKecil], 'KG') AS Satuan_Bahan,
        dt.[UserName] AS PIC_Bahan,
        'SPK' AS Sumber
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      LEFT JOIN [cp].[dbo].[taGoods] AS g
        ON dt.[ItemID] = g.[ItemID]
      WHERE dt.[ItemType] = 'B'
    `;

    // 2b. Query penggunaan jika barang itu tidak menggunakan SPK tipe H atau B
    const penggunaanNonSPKQuery = `
      SELECT TOP (1000000)
        hd.[MoveID] AS No_Transaksi,
        g.[LocName] AS Gudang,
        hd.[LocID],
        CONVERT(DATE, hd.[MoveDate]) AS Tanggal,
        hd.[Remark] AS Keterangan,
        hd.[NoRator],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        dt.[HPPPrice], 
        kr.[NamaJenis] as Kategori,
        dt.[username],
        COALESCE(i.[SatuanKecil], 'KG') AS Satuan
      FROM [cp].[dbo].[taOpNameOHD] AS hd
      INNER JOIN [cp].[dbo].[taOpNameODT]
      AS dt ON hd.[MoveID] = dt.[MoveID] AND hd.[MoveType] = dt.[MoveType]
      INNER JOIN [cp].[dbo].[taLocation] AS g ON hd.[LocID] = g.[LocID]
      INNER JOIN [cp].[dbo].[taGoods] AS i ON dt.[ItemID] = i.[ItemID]
      INNER JOIN [cp].[dbo].[taKindofGoods] AS kr ON kr.[KodeJenis] = i.[KodeJenis]
      WHERE hd.[MoveType] in ('A','P')
        AND dt.[Kgs] > 0
    `;

    // 3. Ambil data BARANG JADI (ItemType = 'H') DENGAN KODEJENIS = 'K02' (BARANG JADI)
    const hasilQuery = `
      SELECT 
        hd.[ProdID] AS ProdID_Hasil,
        COALESCE(hd.[DeptID], hd.[ProdType]) AS Departemen_Hasil,
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
        AND g.[KodeJenis] = 'K02'
    `;

    let bahanData = [];
    let penggunaanNonSPKData = [];
    let hasilData = [];

    // PERBAIKAN TEMPORAL MISMATCH:
    // Cari pemakaian produksi mulai dari tanggal bahan masuk (@StartDate) hingga saat ini,
    // agar bahan yang masuk pada periode ini dan baru dipakai di tanggal berikutnya tetap terlacak.
    if (startDate) {
      const reqBahan = pool.request();
      reqBahan.input("StartDate", sql.Date, new Date(startDate));
      const bahanResult = await reqBahan.query(`
        ${bahanQuery}
        AND CONVERT(DATE, hd.[ProdDate]) >= @StartDate
      `);
      bahanData = bahanResult.recordset;

      const reqHasil = pool.request();
      reqHasil.input("StartDate", sql.Date, new Date(startDate));
      const hasilResult = await reqHasil.query(`
        ${hasilQuery}
        AND CONVERT(DATE, hd.[ProdDate]) >= @StartDate
      `);
      hasilData = hasilResult.recordset;

      const reqNonSPK = pool.request();
      reqNonSPK.input("StartDate", sql.Date, new Date(startDate));
      const nonSPKResult = await reqNonSPK.query(`
        ${penggunaanNonSPKQuery}
        AND CONVERT(DATE, hd.[MoveDate]) >= @StartDate
      `);
      penggunaanNonSPKData = nonSPKResult.recordset;
    } else {
      const bahanResult = await pool.request().query(bahanQuery);
      bahanData = bahanResult.recordset;

      const hasilResult = await pool.request().query(hasilQuery);
      hasilData = hasilResult.recordset;

      const nonSPKResult = await pool.request().query(penggunaanNonSPKQuery);
      penggunaanNonSPKData = nonSPKResult.recordset;
    }

    // Urutkan data berdasarkan tanggal produksi / transaksi
    bahanData.sort(
      (a, b) =>
        new Date(b.Tanggal_Produksi).getTime() -
        new Date(a.Tanggal_Produksi).getTime(),
    );
    penggunaanNonSPKData.sort(
      (a, b) =>
        new Date(b.Tanggal).getTime() -
        new Date(a.Tanggal).getTime(),
    );
    hasilData.sort(
      (a, b) =>
        new Date(b.Tanggal_Hasil).getTime() -
        new Date(a.Tanggal_Hasil).getTime(),
    );

    console.log(
      `📊 Bahan SPK: ${bahanData.length}, Penggunaan Non-SPK: ${penggunaanNonSPKData.length}, Hasil: ${hasilData.length}`,
    );

    // 4a. Group bahan SPK berdasarkan ItemID_Bahan (HANYA yang Jumlah > 0)
    const bahanSPKByItem = new Map<string, any[]>();
    for (const item of bahanData) {
      const itemId = item.ItemID_Bahan;
      if (!itemId) continue;
      if ((item.Jumlah_Bahan || 0) === 0) continue;

      if (!bahanSPKByItem.has(itemId)) {
        bahanSPKByItem.set(itemId, []);
      }
      bahanSPKByItem.get(itemId)!.push({
        ProdID_Bahan: item.ProdID_Bahan || "-",
        SPK: item.SPK || "-",
        Tanggal_Produksi: item.Tanggal_Produksi || "-",
        Jumlah_Bahan: item.Jumlah_Bahan || 0,
        Satuan_Bahan: normalizeSatuan(item.Satuan_Bahan) || "KG",
        PIC_Bahan: item.PIC_Bahan || "-",
        Sumber: "SPK",
      });
    }

    // 4b. Group penggunaan non-SPK berdasarkan ItemID (HANYA jika barang itu tidak H atau B)
    const nonSPKByItem = new Map<string, any[]>();
    for (const item of penggunaanNonSPKData) {
      const itemId = item.ItemID;
      if (!itemId) continue;
      if ((item.Kgs || 0) === 0) continue;

      if (!nonSPKByItem.has(itemId)) {
        nonSPKByItem.set(itemId, []);
      }
      nonSPKByItem.get(itemId)!.push({
        ProdID_Bahan: item.No_Transaksi || "-",
        SPK: item.Keterangan
          ? `LBK: ${item.No_Transaksi} (${String(item.Keterangan).trim()})`
          : `LBK: ${item.No_Transaksi} (${item.Gudang || item.LocID || "-"})`,
        Tanggal_Produksi: item.Tanggal || "-",
        Jumlah_Bahan: item.Kgs || 0,
        Satuan_Bahan: normalizeSatuan(item.Satuan) || "KG",
        PIC_Bahan: item.username || "-",
        Sumber: "NON_SPK",
        LocID_Bahan: item.LocID || "-",
        Gudang: item.Gudang || "-",
        Remark_Bahan: item.Keterangan || "-",
        NoRator: item.NoRator,
        HPPPrice: item.HPPPrice,
        Kategori: item.Kategori,
      });
    }

    // 5. Group hasil berdasarkan SPK dan ProdID
    const hasilBySPK = new Map<string, any[]>();
    const hasilByProdID = new Map<string, any[]>();

    for (const item of hasilData) {
      const spk = item.SPK;
      const prodId = item.ProdID_Hasil;
      const hasilObj = {
        ProdID_Hasil: item.ProdID_Hasil || "-",
        Departemen_Hasil:
          item.Departemen_Hasil || item.ProdType || item.DeptID || "-",
        ItemID_Hasil: item.ItemID_Hasil || "-",
        NamaBarang_Hasil: item.NamaBarang_Hasil || item.ItemID_Hasil || "-",
        Satuan_Hasil: normalizeSatuan(item.Satuan_Hasil) || "PCS",
        Jumlah_Hasil: item.Jumlah_Hasil || 0,
        Tanggal_Hasil: item.Tanggal_Hasil || "-",
        SPK: item.SPK || "-",
        PIC_Hasil: item.PIC_Hasil || "-",
      };

      if (spk) {
        if (!hasilBySPK.has(spk)) {
          hasilBySPK.set(spk, []);
        }
        hasilBySPK.get(spk)!.push(hasilObj);
      }

      if (prodId && prodId !== "-") {
        if (!hasilByProdID.has(prodId)) {
          hasilByProdID.set(prodId, []);
        }
        hasilByProdID.get(prodId)!.push(hasilObj);
      }
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
      `📦 Agregasi bahan unik: ${pemasukanGrouped.size} dari ${pemasukanData.length} records BPB (Pembelian)`,
    );

    // 7. Fungsi get stock dengan port awareness dan timeout aman
    async function getStockForItem(itemId: string): Promise<number> {
      try {
        if (!itemId) return 0;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const currentPort = process.env.PORT || 3000;
        const stockUrl = new URL(
          `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${currentPort}`}/api/stock`,
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

    const finalDataRaw = await Promise.all(
      groupedItems.map(async (group) => {
        const itemId = group.itemId;
        const spkList = bahanSPKByItem.get(itemId) || [];
        const nonSPKList = nonSPKByItem.get(itemId) || [];

        // JIKA BARANG ITU TIDAK H ATAU B (tidak menggunakan SPK), gunakan query taOpNameOHD & taOpNameODT:
        const pemakaianList = spkList.length > 0 ? spkList : nonSPKList;

        const totalTerpakai = pemakaianList.reduce(
          (sum: number, p: { Jumlah_Bahan: number }) =>
            sum + (p.Jumlah_Bahan || 0),
          0,
        );

        // Cari barang jadi yang dihasilkan dari SPK/ProdID yang SAMA dengan pemakaian (Hanya Dept AS & PL)
        const semuaBarangJadi: Array<{
          ProdID_Hasil: string;
          Departemen?: string;
          ItemID: string;
          NamaBarang: string;
          Satuan: string;
          Jumlah: number;
          Jumlah_Kgs: number;
          Tanggal_Produksi: string;
          SPK: string;
          PIC_Hasil: string;
        }> = [];
        const barangJadiKeySet = new Set<string>();

        for (const pemakaian of pemakaianList) {
          const spk = pemakaian.SPK;
          const prodIdBahan = pemakaian.ProdID_Bahan;

          // LBK / NON_SPK hanya untuk penggunaan saja, tidak menghasilkan barang jadi
          if (pemakaian.Sumber === "NON_SPK" || pemakaian.Sumber === "LBK") {
            continue;
          }

          // 1. Prioritaskan pencocokan ProdID yang sama persis (batch run yang sama)
          const hasilListByProdID =
            prodIdBahan && prodIdBahan !== "-"
              ? hasilByProdID.get(prodIdBahan) || []
              : [];

          for (const hasil of hasilListByProdID) {
            const key = `${hasil.ProdID_Hasil}_${hasil.ItemID_Hasil}_${hasil.SPK}`;
            if (!barangJadiKeySet.has(key)) {
              barangJadiKeySet.add(key);
              semuaBarangJadi.push({
                ProdID_Hasil: hasil.ProdID_Hasil,
                Departemen: hasil.Departemen_Hasil || "-",
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

          // 2. Jika tidak ada hasil pada ProdID tersebut, cocokkan berdasarkan nomor SPK
          if (hasilListByProdID.length === 0 && spk && spk !== "-") {
            const hasilListBySPK = hasilBySPK.get(spk) || [];
            for (const hasil of hasilListBySPK) {
              const key = `${hasil.ProdID_Hasil}_${hasil.ItemID_Hasil}_${hasil.SPK}`;
              if (!barangJadiKeySet.has(key)) {
                barangJadiKeySet.add(key);
                semuaBarangJadi.push({
                  ProdID_Hasil: hasil.ProdID_Hasil,
                  Departemen: hasil.Departemen_Hasil || "-",
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

        // HANYA TAMPILKAN BAHAN YANG MENGHASILKAN BARANG JADI (K02)
        if (semuaBarangJadi.length === 0) {
          return null;
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

    // Filter hanya bahan baku yang benar-benar menghasilkan barang jadi
    const finalData = finalDataRaw.filter(Boolean) as any[];

    // 9. Rincian per satuan masuk untuk summary card
    const breakdownMasuk: Record<string, number> = {};
    for (const item of finalData) {
      const s = item.Satuan || "LAINNYA";
      breakdownMasuk[s] = (breakdownMasuk[s] || 0) + item.JumlahMasuk;
    }

    const summary = {
      total_bahan: finalData.length,
      total_jumlah_masuk: finalData.reduce((s, i) => s + i.JumlahMasuk, 0),
      total_terpakai: finalData.reduce((s, i) => s + i.TotalTerpakai, 0),
      breakdown_masuk: breakdownMasuk,
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