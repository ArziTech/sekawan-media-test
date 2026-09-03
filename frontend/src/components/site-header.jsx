import React from 'react';
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader() {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard Monitoring';
      case '/branch-dashboard':
        return 'Monitoring Kantor Cabang & Site';
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

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-4 lg:px-6 transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
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

      <div className="flex items-center gap-2.5">
        {/* Operational Region Info Badge */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/60">
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden md:inline">8 Wilayah: 1 HQ Jakarta &middot; 1 Kendari &middot; 6 Tambang</span>
          <span className="md:hidden">8 Wilayah Operasional</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Theme Dark / Light Mode Toggle */}
        <ModeToggle />
      </div>
    </header>
  );
}
