import { Metadata } from "next";
import { UserProvider } from "../contexts/UserContext";
import DashboardContent from "./DashboardContent";
import FloatingWA from "@/components/floatingWA";

export const metadata: Metadata = {
  title: {
    template: "%s | Dashboard Portal Beacukai",
    default: "IT Inventory | Dashboard Portal Beacukai PT. CITI PLUMB",
  },
  description:
    "IT Inventory  PT. CITI PLUMB",
  keywords: ["inventory", "cctv", "beacukai", "dashboard", "manajemen stok"],
  authors: [{ name: "PT. CITI PLUMB" }],
  creator: "PT. CITI PLUMB",
  publisher: "PT. CITI PLUMB",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title: "Dashboard Portal Beacukai PT. CITI PLUMB",
    description: "Dashboard untuk mengelola inventory dan CCTV system",
    url: "/dashboard",
    siteName: "Portal Beacukai",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Portal Beacukai PT. CITI PLUMB",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard Portal Beacukai PT. CITI PLUMB",
    description: "Dashboard untuk mengelola inventory dan CCTV system",
    images: ["/img/twitter-image.jpg"],
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardContent>{children}
        <FloatingWA />
      </DashboardContent>
    </UserProvider>
  );
}
