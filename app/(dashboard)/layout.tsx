// app/dashboard/layout.tsx
"use client";

import { Toaster } from "@/components/ui/sonner";
import Maintenance from "../maintenance/page";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { UserProvider, useUser } from "../contexts/UserContext";


// Komponen inner
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  return (
    <section>
     

      {isMaintenance ? (
        <Maintenance />
      ) : (
        <>
          <Navbar
            userName={
              isLoading
                ? "Loading..."
                : user?.Nama ||
                  user?.name ||
                  user?.UserName ||
                  user?.username ||
                  "User"
            }
            userRole={
              isLoading
                ? "Loading..."
                : user?.Bagian || user?.role || user?.jabatan || "Staff"
            }
          />

          <Toaster />

          <div className="min-h-screen pt-16 flex justify-center mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              children
            )}
          </div>

          <Footer />
        </>
      )}
    </section>
  );
}

// Layout utama
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardContent>{children}</DashboardContent>
    </UserProvider>
  );
}
