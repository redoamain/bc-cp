// components/FloatingWA.tsx
"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingWA() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Munculkan setelah 3 detik
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const handleWA = () => {
    // Ganti nomor WhatsApp dengan nomor IT Support
    const phoneNumber = "62895327504234";
    const message = "Maaf, saya mengalami kendala dengan aplikasi.";
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Popup Chat */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-linear-to-r from-green-600 to-green-500 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">IT Support</h3>
                <p className="text-xs text-white/80">
                  Online • Biasanya balas dalam 5 menit
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 bg-gray-50">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-700 mb-2">
                👋 Ada kendala dengan aplikasi? Silakan hubungi IT Support kami:
              </p>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• Kendala login aplikasi</p>
                <p>• Error pada sistem</p>
                <p>• Laporan bug</p>
                <p>• Pertanyaan teknis lainnya</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 italic">
              Click chat untuk langsung terhubung dengan IT Support
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-white border-t border-gray-100">
            <Button
              onClick={handleWA}
              className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Mulai Chat WhatsApp
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative group flex items-center justify-center
          w-14 h-14 rounded-full shadow-lg transition-all duration-300
          ${
            isOpen
              ? "bg-red-500 hover:bg-red-600 rotate-90"
              : "bg-green-500 hover:bg-green-600 hover:scale-110"
          }
        `}
      >
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {isOpen ? "Tutup" : "Butuh Bantuan?"}
        </span>

        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}

        {/* Badge Notifikasi */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-xs font-bold text-white">1</span>
        </span>
      </button>
    </div>
  );
}
