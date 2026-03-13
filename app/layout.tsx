// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    template: "%s | Portal IT & CCTV PT. CITI PLUMB",
    default: "Portal Beacukai | PT. CITI PLUMB",
  },
  description:
    "Portal terintegrasi untuk manajemen IT Inventory dan sistem CCTV PT. CITI PLUMB",
  keywords: [
    "IT inventory",
    "CCTV",
    "manajemen aset",
    "monitoring",
    "keamanan",
    "PT. CITI PLUMB",
  ],
  authors: [{ name: "IT Department PT. CITI PLUMB" }],
  creator: "IT Department PT. CITI PLUMB",
  publisher: "PT. CITI PLUMB",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.json",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "Portal IT & CCTV PT. CITI PLUMB",
    description:
      "Kelola IT Inventory dan pantau CCTV dalam satu platform terintegrasi",
    url: "/",
    siteName: "Portal Beacukai",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Portal IT & CCTV PT. CITI PLUMB",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal Beacukai PT. CITI PLUMB",
    description: "Kelola IT Inventory dan pantau CCTV dalam satu platform",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
