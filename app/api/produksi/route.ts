
import { NextResponse } from "next/server";
import sql from "mssql";
import { ProduksiType } from "@/lib/types";
import { getPool } from "@/lib/config";


export const revalidate = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const prodType = url.searchParams.get("prodType");
  const itemType = url.searchParams.get("itemType");

  try {
    const pool = await getPool();
    let query = `
      SELECT TOP (10000)
        hd.[ProdID] AS No_Produksi,
        hd.[ProdDate] AS Tanggal,
        d.[PRDeptName] AS Departemen,
        dt.[ItemType] AS Tipe_Produksi,
        hd.[OrderID] AS SPK,
        hd.[NoRator],
        sp.[Remark] AS Nama_PO,
        g.[LocName] AS Gudang,
        hd.[Remark],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        kt.[NamaJenis] as Kategori,
        dt.[UserName] 
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt 
        ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      INNER JOIN [cp].[dbo].[taPROrder] AS sp 
        ON hd.[OrderID] = sp.[OrderID]
      INNER JOIN [cp].[dbo].[taLocation] AS g 
        ON hd.[LocID] = g.[LocID]
      INNER JOIN [cp].[dbo].[taDeptPROrder] AS d 
        ON hd.[DeptID] = d.[PRDeptID]
      INNER JOIN [cp].[dbo].[taGoods] AS k
        ON dt.[ItemID] = k.[ItemID]
      INNER JOIN [cp].[dbo].[taKindofGoods] AS kt
        ON k.[KodeJenis] = kt.[KodeJenis]
      WHERE hd.[ProdType] IN ('IN','SP','MO','PL','AS') 
        AND dt.[ItemType] IN ('B','H')
    `;

    const conditions: string[] = [];
    if (startDate && endDate) {
      conditions.push(
        `CONVERT(DATE, hd.[ProdDate]) >= @StartDate 
         AND CONVERT(DATE, hd.[ProdDate]) <= @EndDate`
      );
    }
    if (prodType) {
      conditions.push(`hd.[ProdType] = @ProdType`);
    }
    if (itemType) {
      conditions.push(`dt.[ItemType] = @ItemType`);
    }
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }
    query += ` ORDER BY hd.[ProdID] DESC`;

    const requestQuery = pool.request();
    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }
    if (prodType) {
      requestQuery.input("ProdType", sql.NVarChar, prodType);
    }
    if (itemType) {
      requestQuery.input("ItemType", sql.NVarChar, itemType);
    }

    const result = await requestQuery.query(query);

    const formattedRecords = result.recordset.map((record: ProduksiType) => ({
      ...record,
      Tanggal: record.Tanggal
        ? record.Tanggal.toISOString().split("T")[0]
        : null,
    }));

    return NextResponse.json(formattedRecords, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}




