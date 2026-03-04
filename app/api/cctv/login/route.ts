// app/api/cctv/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Redirect langsung ke URL CCTV
  return NextResponse.redirect("http://cctv.citiplumb.id:8027/");
}

