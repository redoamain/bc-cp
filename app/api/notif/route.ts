/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

interface TelegramResponse {
  ok: boolean;
  result: any;
}

// Export untuk metode HTTP POST
export async function POST(req: NextRequest) {
  const { message } = await req.json(); // Mendapatkan data JSON dari request

  // Ambil chat IDs dari environment variable dan parse sebagai array
  const chatIdsString = process.env.TELEGRAM_CHAT_IDS;
  if (!chatIdsString) {
    return NextResponse.json(
      {
        success: false,
        message: "TELEGRAM_CHAT_IDS environment variable is not set",
      },
      { status: 500 },
    );
  }

  // Parse chat IDs (format: "id1,id2,id3,id4")
  const chatIds = chatIdsString
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  // Ambil token dari environment variable
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "TELEGRAM_BOT_TOKEN environment variable is not set",
      },
      { status: 500 },
    );
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`; // URL API Telegram

  try {
    // Loop untuk mengirim pesan ke setiap chat ID
    for (const chatId of chatIds) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message, // Pesan yang dikirimkan
        }),
      });

      const data: TelegramResponse = await response.json();

      // Jika pengiriman pesan gagal untuk satu chat ID
      if (!data.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send message to one or more chats",
          },
          { status: 500 },
        );
      }
    }

    // Jika pesan berhasil dikirim ke semua chat ID
    return NextResponse.json(
      { success: true, message: "Message sent to multiple Telegram chats" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error sending message to Telegram" },
      { status: 500 },
    );
  }
}
