"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  User,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  RotateCcw,
  Box,
  ClipboardList,
  Archive,
  Grid2X2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userName?: string;
  userRole?: string;
}

export default function Navbar({
  userName = "User",
  userRole = "Staff",
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Menu items untuk navigasi
  const menuItems = [
    {
      title: "Pemasukan",
      href: "/pemasukan",
      icon: TrendingUp,
    },
    {
      title: "Pengeluaran",
      href: "/pengeluaran",
      icon: TrendingDown,
    },
    {
      title: "Retur",
      href: "/retur",
      icon: RotateCcw,
    },
    {
      title: "Log",
      href: "/log",
      icon: ClipboardList,
    },
  ];

  // Submenu items untuk Mutasi
  const mutasiItems = [
    {
      title: "Bahan Baku",
      href: "/baku",
      icon: Package,
      description:
        "Mutasi bahan baku produksi",
    },
    {
      title: "Barang Jadi",
      href: "/jadi",
      icon: Package,
      description: "Laporan Mutasi barang jadi",
    },
    {
      title: "Modal",
      href: "/modal",
      icon: Box,
      description: "Laporan Mutasi Barang Modal",
    },
    {
      title: "Scrap",
      href: "/scrap",
      icon: Archive,
      description: "Laporan Sisa Proses produksi",
    },
    {
      title: "Work In Progress",
      href: "/wip",
      icon: Grid2X2,
      description: "Laporan Posisi barang dalam proses",
    },
  ];

  // Komponen untuk ListItem NavigationMenu
  const ListItem = ({
    href,
    icon: Icon,
    title,
    description,
    isActive,
  }: {
    href: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    title: string;
    description?: string;
    isActive: boolean;
  }) => {
    return (
      <li className="w-full">
        <NavigationMenuLink asChild>
          <Link
            href={href}
            className={cn(
              "block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all",
              "hover:bg-gray-100 hover:shadow-sm",
              isActive && "bg-primary/5",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isActive ? "bg-primary/10" : "bg-gray-100",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium leading-none mb-1">
                  {title}
                </div>
                {description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b shadow-sm"
          : "bg-white border-b",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo dan Brand */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-linear-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline-block bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Inventory System
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Full NavigationMenu */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {/* Menu items biasa */}
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <NavigationMenuItem key={item.title}>
                      <Link
                        href={item.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "gap-2 h-9 px-3",
                          isActive && "bg-primary/10 text-primary",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </NavigationMenuItem>
                  );
                })}

                {/* Menu Mutasi dengan NavigationMenu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="gap-2 h-9 px-3 data-[state=open]:bg-gray-100">
                    <RotateCcw className="h-4 w-4" />   
                    Mutasi
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-100 gap-2 p-4 md:w-125 md:grid-cols-2">
                      {mutasiItems.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(item.href + "/");
                        return (
                          <ListItem
                            key={item.title}
                            href={item.href}
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            isActive={isActive}
                          />
                        );
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side - User menu dan Mobile Trigger */}
          <div className="flex items-center gap-2">
            {/* Desktop User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 hover:bg-gray-100"
                >
                  <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userRole}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-70 sm:w-[320px] p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold">Menu Navigasi</span>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Navigation */}
                <div className="flex flex-col h-[calc(100vh-73px)]">
                  <nav className="flex-1 overflow-auto p-3">
                    <ul className="space-y-1">
                      {/* Menu items biasa untuk mobile */}
                      {menuItems.map((item) => (
                        <li key={item.title}>
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors hover:bg-gray-100",
                              pathname === item.href &&
                                "bg-primary/5 text-primary",
                            )}
                          >
                            <div
                              className={cn(
                                "p-1.5 rounded-md",
                                pathname === item.href
                                  ? "bg-primary/10"
                                  : "bg-gray-100",
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </div>
                            {item.title}
                          </Link>
                        </li>
                      ))}

                      {/* Menu Mutasi untuk mobile */}
                      <li className="pt-2">
                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <RefreshCw className="h-4 w-4 text-primary" />
                          </div>
                          <span>Mutasi</span>
                        </div>
                        <ul className="mt-1 ml-11 space-y-1">
                          {mutasiItems.map((item) => {
                            const isActive =
                              pathname === item.href ||
                              pathname.startsWith(item.href + "/");
                            return (
                              <li key={item.title}>
                                <Link
                                  href={item.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gray-100",
                                    isActive && "bg-primary/5 text-primary",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isActive ? "bg-primary" : "bg-gray-300",
                                    )}
                                  />
                                  {item.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    </ul>
                  </nav>

                  {/* Mobile User Info */}
                  <div className="border-t p-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {userRole}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50 mt-3"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
