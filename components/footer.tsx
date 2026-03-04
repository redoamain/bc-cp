"use client";

import Link from "next/link";
import { Package, Github, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("w-full border-t bg-white", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo dan Copyright */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">
              © {currentYear} Inventory System Beacukai PT. Citi Plumb
            </p>
          </div>

          {/* Developer Info dengan GitHub */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Developed by</span>
            <Link
              href="https://github.com/redoamain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Github className="h-4 w-4" />
               redo
            </Link>
            <span className="text-muted-foreground mx-1">with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          </div>

        </div>
      </div>
    </footer>
  );
}
