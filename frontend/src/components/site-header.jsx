import React, { useState, useEffect } from 'react';
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
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader() {
  const location = useLocation();
  const { isApprover } = useAuth();
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    api.get('/regions')
      .then((res) => {
        if (res.data?.success && res.data.data?.regions) {
          setRegions(res.data.data.regions);
        }
      })
      .catch(() => {});
  }, []);

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard Monitoring';
      case '/branch-dashboard':
        return 'Monitoring Kantor Cabang & Site';
      case '/duties':
        return 'Monitoring Personil Bertugas & Operasi Armada';
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
      case '/users':
        return 'Manajemen Pengguna & Otorisasi';
      default:
        return 'Sistem Armada Tambang';
    }
  };

  const isBranchDetail = location.pathname.startsWith('/branch-dashboard/');
  const branchId = isBranchDetail ? location.pathname.split('/')[2] : null;
  const currentRegion = branchId ? regions.find((r) => String(r.id) === String(branchId)) : null;
  const branchName = currentRegion?.name || 'Detail Wilayah';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-4 lg:px-6 transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={isApprover ? "/approvals" : "/dashboard"} className="text-xs text-muted-foreground hover:text-foreground">
                Nickel Fleet
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {isBranchDetail ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/branch-dashboard" className="text-xs text-muted-foreground hover:text-foreground">
                    Monitoring Kantor Cabang & Site
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-semibold text-foreground">
                    {branchName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-semibold text-foreground">
                  {getPageTitle(location.pathname)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Theme Dark / Light Mode Toggle */}
        <ModeToggle />
      </div>
    </header>
  );
}
