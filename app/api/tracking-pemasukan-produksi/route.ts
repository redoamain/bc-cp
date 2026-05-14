import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // 1. Ambil data dari rpPemasukan (store procedure)
    const pemasukanResult = await pool
      .request()
      .input("tgl1", sql.DateTime, new Date(startDate || new Date()))
      .input("tgl2", sql.DateTime, new Date(endDate || new Date()))
      .execute("rpPemasukan");

    const pemasukanData = pemasukanResult.recordset;

    // 2. Ambil data dari produksi (pakai Kgs saja)
    const produksiQuery = `
      SELECT 
        hd.[ProdID] AS No_Produksi,
        CONVERT(DATE, hd.[ProdDate]) AS Tanggal_Produksi,
        d.[PRDeptName] AS Departemen,
        dt.[ItemType] AS Tipe_Produksi,
        hd.[OrderID] AS SPK,
        sp.[Remark] AS Nama_PO,
        dt.[ItemID],
        dt.[Kgs] AS Jumlah_Kgs,
        kt.[NamaJenis] as Kategori,
        dt.[UserName] AS PIC_Produksi
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      INNER JOIN [cp].[dbo].[taPROrder] AS sp 
        ON hd.[OrderID] = sp.[OrderID]
      INNER JOIN [cp].[dbo].[taDeptPROrder] AS d 
        ON hd.[DeptID] = d.[PRDeptID]
      INNER JOIN [cp].[dbo].[taGoods] AS k
        ON dt.[ItemID] = k.[ItemID]
      INNER JOIN [cp].[dbo].[taKindofGoods] AS kt
        ON k.[KodeJenis] = kt.[KodeJenis]
      WHERE hd.[ProdType] IN ('IN','SP','MO','PL','AS') 
        AND dt.[ItemType] IN ('B','H')
    `;

    let produksiData = [];
    if (startDate && endDate) {
      const produksiResult = await pool
        .request()
        .input("StartDate", sql.Date, new Date(startDate))
        .input("EndDate", sql.Date, new Date(endDate)).query(`
          ${produksiQuery}
          AND CONVERT(DATE, hd.[ProdDate]) >= @StartDate 
          AND CONVERT(DATE, hd.[ProdDate]) <= @EndDate
        `);
      produksiData = produksiResult.recordset;
    } else {
      const produksiResult = await pool.request().query(produksiQuery);
      produksiData = produksiResult.recordset;
    }

    // 3. Group produksi berdasarkan ItemID
    const produksiByItem = new Map();
    for (const prod of produksiData) {
      const itemId = prod.ItemID;
      if (!produksiByItem.has(itemId)) {
        produksiByItem.set(itemId, []);
      }
      produksiByItem.get(itemId).push({
        No_Produksi: prod.No_Produksi,
        Tanggal_Produksi: prod.Tanggal_Produksi,
        Departemen: prod.Departemen,
        Tipe_Produksi: prod.Tipe_Produksi,
        SPK: prod.SPK,
        Nama_PO: prod.Nama_PO,
        Jumlah_Kgs: prod.Jumlah_Kgs || 0,
        Kategori: prod.Kategori,
        PIC_Produksi: prod.PIC_Produksi,
      });
    }

    // 4. Fungsi untuk mendapatkan stock dari API stock
    async function getStockForItem(itemId: string): Promise<number> {
      try {
        const stockUrl = new URL(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/stock`,
        );
        stockUrl.searchParams.set("item", itemId);
        stockUrl.searchParams.set("tgl", new Date().toISOString());

        const stockResponse = await fetch(stockUrl.toString(), {
          cache: "no-store",
        });

        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          return stockData.stockAkhir?.totalKgs || 0;
        }
        return 0;
      } catch (error) {
        console.error(`Error getting stock for ${itemId}:`, error);
        return 0;
      }
    }

    // 5. Gabungkan data pemasukan dengan produksi dan stock
    const resultData = await Promise.all(
      pemasukanData.map(async (item: any) => {
        const itemId = item.kodebarang;
        const digunakanDiProduksi = produksiByItem.get(itemId) || [];

        // Hitung total Kgs yang dipakai di produksi
        const totalKgsProduksi = digunakanDiProduksi.reduce(
          (sum: number, prod: any) => {
            return sum + (prod.Jumlah_Kgs || 0);
          },
          0,
        );

        // Ambil stock saat ini
        const currentStock = await getStockForItem(itemId);

        const jumlahMasuk = item.Jumlah || 0;
        const sisaStock = currentStock;
        const sisaSetelahProduksi = jumlahMasuk - totalKgsProduksi;

        // Status stock
        let stockStatus = "Aman";
        let stockColor = "text-green-600";

        if (sisaStock < 0) {
          stockStatus = "MINUS!";
          stockColor = "text-red-600 font-bold";
        } else if (sisaStock === 0) {
          stockStatus = "Habis";
          stockColor = "text-orange-600";
        } else if (sisaStock < jumlahMasuk * 0.2) {
          stockStatus = "Menipis";
          stockColor = "text-yellow-600";
        }

        return {
          // Data Pemasukan
          ItemID: item.kodebarang,
          NamaBarang: item.Namabarang,
          JenisDokumen: item.JenisDokPabean,
          NomorDokumen: item.NomorDokPabean,
          TanggalDokumen: item.TanggalDokPabean,
          NomorBPB: item.NomorBPB,
          TanggalBPB: item.TanggalBPB
            ? new Date(item.TanggalBPB).toISOString().split("T")[0]
            : null,
          Pemasok: item.PemasokPengirim,
          JumlahMasuk_Kgs: jumlahMasuk,
          Satuan: "Kgs",
          Currency: item.CURR,
          NilaiBarang: item.NilaiBarang || 0,
          Nopol: item.Nopol,
          NoInvoice: item.NoInvoice,

          // Data Produksi
          DigunakanDiProduksi: digunakanDiProduksi,
          TotalKgsProduksi: totalKgsProduksi,
          SisaSetelahProduksi: sisaSetelahProduksi,

          // Data Stock
          CurrentStock: currentStock,
          StockStatus: stockStatus,
          StockColor: stockColor,

          // Status Penggunaan
          Status:
            digunakanDiProduksi.length > 0 ? "Sudah Dipakai" : "Belum Dipakai",
          PersentaseDipakai:
            jumlahMasuk > 0
              ? Math.round((totalKgsProduksi / jumlahMasuk) * 100)
              : 0,

          // Warning jika stock minus
          Warning:
            currentStock < 0
              ? "⚠️ STOCK MINUS! Periksa data pemasukan dan produksi"
              : null,
        };
      }),
    );

    // Filter unique berdasarkan ItemID
    const uniqueData = new Map();
    for (const item of resultData) {
      if (!uniqueData.has(item.ItemID)) {
        uniqueData.set(item.ItemID, item);
      }
    }

    const finalData = Array.from(uniqueData.values());

    // Hitung item dengan stock minus
    const itemsMinus = finalData.filter((i) => i.CurrentStock < 0);
    const itemsMenipis = finalData.filter(
      (i) => i.CurrentStock > 0 && i.CurrentStock < i.JumlahMasuk_Kgs * 0.2,
    );

    // Summary
    const summary = {
      total_items: finalData.length,
      total_sudah_dipakai: finalData.filter(
        (i) => i.DigunakanDiProduksi.length > 0,
      ).length,
      total_belum_dipakai: finalData.filter(
        (i) => i.DigunakanDiProduksi.length === 0,
      ).length,
      total_jumlah_masuk: finalData.reduce(
        (sum, i) => sum + (i.JumlahMasuk_Kgs || 0),
        0,
      ),
      total_kgs_dipakai: finalData.reduce(
        (sum, i) => sum + (i.TotalKgsProduksi || 0),
        0,
      ),
      total_current_stock: finalData.reduce(
        (sum, i) => sum + (i.CurrentStock || 0),
        0,
      ),
      total_nilai: finalData.reduce((sum, i) => sum + (i.NilaiBarang || 0), 0),
      items_minus: itemsMinus.length,
      items_menipis: itemsMenipis.length,
    };

    return NextResponse.json({
      success: true,
      data: finalData,
      total: finalData.length,
      summary: summary,
      warning:
        itemsMinus.length > 0
          ? `⚠️ Terdapat ${itemsMinus.length} item dengan stock MINUS!`
          : null,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching data: " + (error as Error).message,
      },
      { status: 500 },
    );
  }
}
