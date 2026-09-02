import React from 'react';
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MapPin, LogOut, ShieldCheck, User } from "lucide-react";

export function SiteHeader() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Dashboard Monitoring';
      case '/bookings':
        return 'Pemesanan Kendaraan';
      case '/approvals':
        return 'Portal Persetujuan Berjenjang';
      case '/vehicles':
        return 'Inventaris Armada Tambang';
      case '/drivers':
        return 'Master Personil Supir';
      case '/fuel-logs':
        return 'Monitoring Konsumsi BBM';
      case '/service-logs':
        return 'Jadwal & Riwayat Servis';
      case '/reports':
        return 'Laporan & Export Excel';
      case '/activity-logs':
        return 'Log Aktivitas (Audit Trail)';
      default:
        return 'Sistem Armada Tambang';
    }
  };

  const title = getPageTitle(location.pathname);

  const roleLabel =
    user?.role === 'admin'
      ? 'Admin Pool'
      : `Approver L${user?.approval_tier || 1}`;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-4 lg:px-6 transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-xs text-muted-foreground hover:text-foreground">
                Nickel Fleet
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-semibold text-foreground">
                {title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        {/* Operational Region Info Badge */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/60">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>8 Wilayah: 1 HQ Jakarta &middot; 1 Kendari &middot; 6 Tambang</span>
        </div>

        {/* Current User Pill Info */}
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs">
            <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-500 font-bold flex items-center justify-center text-[10px]">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-left">
              <span className="font-semibold text-foreground block leading-tight truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-muted-foreground block leading-tight">
                {roleLabel}
              </span>
            </div>
          </div>
        )}

        <Separator orientation="vertical" className="h-4 hidden md:block" />

        {/* Prominent Dedicated Logout Button */}
        <Button
          onClick={logout}
          variant="destructive"
          size="sm"
          className="h-8 px-3 text-xs font-bold gap-1.5 shadow-sm"
          title="Keluar dari akun"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </Button>
      </div>
    </header>
  );
}
