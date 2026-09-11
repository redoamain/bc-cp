// app/global-error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error ke service monitoring
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body className="antialiased font-sans">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xs border border-slate-200/90 p-8 text-center">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
              Kesalahan Kritis
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-3 mb-2">
              Terjadi Kesalahan Sistem
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Aplikasi mengalami kendala mendadak. Silakan coba muat ulang atau hubungi IT Support.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
