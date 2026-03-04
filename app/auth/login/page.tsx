/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Gunakan useRef untuk mencegah double send
  const notificationSent = useRef(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      router.push("/home");
    }
  }, [router]);

  const sendTelegramNotification = async (userData: any) => {
    // Cegah pengiriman ganda
    if (notificationSent.current) return;

    notificationSent.current = true;

    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();

      const notificationData = {
        message: `🔐 Info Login Website BC
        
👤 | User: ${userData.Nama || userData.username || username}
⏰ | Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
📱 | IP Address: ${ipData.ip}
🌐 | Browser: ${navigator.userAgent.substring(0, 100)}
💻 | Platform: ${navigator.platform}
🏷️ | Role: ${userData.Bagian || userData.role || "Staff"}`,

        parse_mode: "Markdown",
      };

      await fetch("/api/notif", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });

      console.log("Telegram notification sent");
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
      // Reset flag jika error
      notificationSent.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Simpan user data ke localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // Kirim notifikasi Telegram
        await sendTelegramNotification(data.user);

        toast.success(data.message || "Login berhasil!");

        // Redirect setelah semua proses selesai
        setTimeout(() => {
          router.push("/home");
        }, 100);
      } else {
        setError(data.error || "Login gagal");
        toast.error(data.error || "Login gagal");
      }
    } catch (error) {
      setError("Terjadi kesalahan, silahkan coba lagi");
      toast.error("Terjadi kesalahan, silahkan coba lagi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md px-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Login
            </CardTitle>
            <CardDescription className="text-center">
              Masukkan username dan password untuk masuk ke dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
              />
            </div>
          </CardContent>

          {error && (
            <div className="px-6 pb-2">
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
                {error}
              </p>
            </div>
          )}

          <CardFooter>
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
