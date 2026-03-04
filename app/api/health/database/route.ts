/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/health/database/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

export async function GET() {
  const startTime = performance.now();

  try {
    // Cek environment variables terlebih dahulu
    const dbConfig = {
      DB_USER: process.env.DB_USER ? "✓" : "✗",
      DB_PASSWORD: process.env.DB_PASSWORD ? "✓" : "✗",
      DB_SERVER: process.env.DB_SERVER || "not set",
      DB_DATABASE: process.env.DB_DATABASE || "not set",
    };

    // Jika ada config yang missing, return disconnected dengan informasi
    if (
      !process.env.DB_USER ||
      !process.env.DB_PASSWORD ||
      !process.env.DB_DATABASE
    ) {
      const endTime = performance.now();
      return NextResponse.json(
        {
          status: "disconnected",
          message: "Database configuration incomplete",
          error: "Missing database credentials",
          responseTime: Math.round(endTime - startTime),
          timestamp: new Date().toISOString(),
          config: dbConfig,
        },
        { status: 503 },
      );
    }

    // Coba koneksi ke database
    try {
      const pool = await getPool();
      await pool.request().query("SELECT 1 as test");

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return NextResponse.json({
        status: "connected",
        message: "Database connection successful",
        database: process.env.DB_DATABASE,
        server: process.env.DB_SERVER || "localhost",
        responseTime,
        timestamp: new Date().toISOString(),
        config: dbConfig,
      });
    } catch (dbError: any) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      let errorMessage = "Gagal terhubung ke database";
      if (dbError.code === "ELOGIN") {
        errorMessage = "Login database gagal - periksa username/password";
      } else if (dbError.code === "ENOTFOUND" || dbError.code === "ETIMEOUT") {
        errorMessage = "Tidak dapat menjangkau server database";
      } else if (dbError.code === "ECONNREFUSED") {
        errorMessage = "Koneksi ditolak oleh server database";
      } else if (dbError.message) {
        errorMessage = dbError.message;
      }

      return NextResponse.json(
        {
          status: "disconnected",
          message: errorMessage,
          error: dbError.message,
          responseTime,
          timestamp: new Date().toISOString(),
          config: dbConfig,
        },
        { status: 503 },
      );
    }
  } catch (error: any) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    return NextResponse.json(
      {
        status: "disconnected",
        message: "Health check failed",
        error: error?.message || "Unknown error",
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
