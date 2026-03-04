// app/api/log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import { LogType } from "@/lib/types";

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

    console.log("Executing store procedure rpLogNew with:", { tgl1, tgl2 });

    const result = await pool
      .request()
      .input("tgl1", tgl1)
      .input("tgl2", tgl2)
      .execute("rpLogNew");

    console.log("Raw data count:", result.recordset.length);

    // Tampilkan sample data untuk debugging
    if (result.recordset.length > 0) {
      console.log("Sample raw data:", result.recordset[0]);
      console.log("Available fields:", Object.keys(result.recordset[0]));
    }

    // Parse tanggal awal dan akhir
    const startDate = new Date(tgl1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(tgl2);
    endDate.setHours(23, 59, 59, 999);

    console.log("Date range:", {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    // Filter data - coba beberapa kemungkinan nama kolom
    const filteredData = result.recordset.filter((item) => {
      // Coba berbagai kemungkinan nama kolom untuk tanggal
      let dateValue = null;

      if (item.UserDateTime) {
        dateValue = item.UserDateTime;
        console.log("Using UserDateTime:", item.UserDateTime);
      } else if (item.userDateTime) {
        dateValue = item.userDateTime;
        console.log("Using userDateTime:", item.userDateTime);
      } else if (item.Tanggal) {
        dateValue = item.Tanggal;
        console.log("Using Tanggal:", item.Tanggal);
      } else if (item.tanggal) {
        dateValue = item.tanggal;
        console.log("Using tanggal:", item.tanggal);
      } else if (item.DateTime) {
        dateValue = item.DateTime;
        console.log("Using DateTime:", item.DateTime);
      } else if (item.dateTime) {
        dateValue = item.dateTime;
        console.log("Using dateTime:", item.dateTime);
      } else {
        // Jika tidak ada field tanggal, coba cari field yang mengandung kata "date" atau "time"
        const dateFields = Object.keys(item).filter(
          (key) =>
            key.toLowerCase().includes("date") ||
            key.toLowerCase().includes("time"),
        );

        if (dateFields.length > 0) {
          console.log("Possible date fields:", dateFields);
          dateValue = item[dateFields[0]];
        }
      }

      if (!dateValue) {
        // Jika tidak ada field tanggal, tampilkan data (untuk debugging)
        console.log("No date field found for item:", item);
        return false;
      }

      try {
        const itemDate = new Date(dateValue);
        if (isNaN(itemDate.getTime())) {
          console.log("Invalid date:", dateValue);
          return false;
        }

        const isInRange = itemDate >= startDate && itemDate <= endDate;

        if (isInRange) {
          console.log("Date in range:", {
            date: itemDate.toISOString(),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          });
        }

        return isInRange;
      } catch (err) {
        console.log("Error parsing date:", dateValue, err);
        return false;
      }
    });

    console.log("Data count after filter:", filteredData.length);

    if (filteredData.length > 0) {
      console.log("Sample filtered data:", filteredData[0]);
    } else {
      // Tampilkan 3 data pertama untuk debugging
      console.log(
        "First 3 raw items (for debugging):",
        result.recordset.slice(0, 3),
      );
    }

    // Transform data sesuai dengan interface LogType
    const transformedData: LogType[] = filteredData.map((item) => ({
      Remark: item.Remark || item.remark || "",
      Username: item.Username || item.username || item.UserName || "",
      UserDateTime:
        item.UserDatetime ||
        item.userDatetime ||
        item.Tanggal ||
        item.tanggal ||
        null,
      kgs:
        item.kgs || item.KGS || item.Kgs
          ? Number(item.kgs || item.KGS || item.Kgs)
          : 0,
      TransNo:
        item.TransNo || item.transNo || item.TransNumber
          ? Number(item.TransNo || item.transNo || item.TransNumber)
          : 0,
      ItemID: item.ItemID || item.itemId || item.ItemId || item.ItemCode || "",
      TransDateTime:
        item.TransDateTime || item.transDateTime || item.TransDate || null,
      IpAddr: item.IpAddr || item.ipAddress || "",
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: `Data Log periode ${tgl1} s/d ${tgl2} berhasil diambil`,
      meta: {
        total: transformedData.length,
        periode: { tgl1, tgl2 },
        rawCount: result.recordset.length,
      },
    });
  } catch (error) {
    console.error("Error fetching log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data log",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
