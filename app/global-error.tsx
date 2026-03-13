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
      <body>
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Terjadi Kesalahan Kritis!
              </h2>
              <p className="text-gray-600 mb-4">
                Silakan coba lagi atau hubungi IT Support.
              </p>
              <button
                onClick={() => reset()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
