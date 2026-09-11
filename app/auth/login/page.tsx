/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { ArrowLeft, Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Gunakan useRef untuk mencegah double send
  const notificationSent = useRef(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      router.push("/dashboard");
    }
  }, [router]);

  const sendTelegramNotification = async (userData: any) => {
    // Cegah pengiriman ganda
    if (notificationSent.current) return;

    notificationSent.current = true;

    try {
      let clientIp = "Internal Network";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json", {
          signal: AbortSignal.timeout(3000),
        });
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          clientIp = ipData.ip || "Internal Network";
        }
      } catch {
        clientIp = "Jaringan Internal / Terlindungi";
      }

      const notificationData = {
        message: `🔐 Info Login Website BC
        
👤 | User: ${userData.Nama || userData.username || username}
⏰ | Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
📱 | IP Address: ${clientIp}
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
          router.push("/dashboard");
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-4 py-8">
      {/* Top back link */}
      <div className="w-full max-w-sm mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Portal
        </Link>
      </div>

      {/* Main Login Form */}
      <div className="w-full max-w-sm mx-auto my-auto py-4">
        <Card className="shadow-xs border border-slate-200 bg-white">
          <CardHeader className="text-center pb-4">
            <Image
              src="/img/citiplumb.jpg"
              alt="PT. CITI PLUMB Logo"
              width={52}
              height={52}
              className="mx-auto rounded-xl border border-slate-200/80 shadow-2xs object-cover mb-3"
              priority
            />
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
              Login IT Inventory
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Masukkan username dan password akun Anda
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-slate-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-10 pl-9 text-sm border-slate-200 focus-visible:ring-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-10 pl-9 pr-10 text-sm border-slate-200 focus-visible:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200/60 text-xs text-red-600">
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  "Masuk"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Bottom Copyright */}
      <div className="text-center text-xs text-slate-400 py-2">
        © {new Date().getFullYear()} PT. CITI PLUMB. All rights reserved.
      </div>
    </div>
  );
}
