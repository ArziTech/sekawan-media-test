import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  CheckSquare,
  Truck,
  Users,
  Fuel,
  Wrench,
  FileSpreadsheet,
  Activity,
  Layers,
} from "lucide-react";

export function AppSidebar({ ...props }) {
  const { user, isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = () => {
      api.get('/approvals/pending')
        .then((res) => {
          if (res.data.success) {
            setPendingCount(res.data.data.length);
          }
        })
        .catch(() => {});
    };

    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const navOperations = [
    {
      title: "Dashboard Utama",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Dashboard Cabang",
      url: "/branch-dashboard",
      icon: Building2,
    },
    {
      title: "Pemesanan Kendaraan",
      url: "/bookings",
      icon: CalendarCheck,
    },
    {
      title: "Portal Persetujuan",
      url: "/approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
  ];

  const navFleet = isAdmin
    ? [
        {
          title: "Armada Kendaraan",
          url: "/vehicles",
          icon: Truck,
        },
        {
          title: "Master Driver",
          url: "/drivers",
          icon: Users,
        },
        {
          title: "Konsumsi BBM",
          url: "/fuel-logs",
          icon: Fuel,
        },
        {
          title: "Jadwal & Servis",
          url: "/service-logs",
          icon: Wrench,
        },
      ]
    : [];

  const navReports = [
    {
      title: "Laporan & Export Excel",
      url: "/reports",
      icon: FileSpreadsheet,
    },
    ...(isAdmin
      ? [
          {
            title: "Audit Trail (Logs)",
            url: "/activity-logs",
            icon: Activity,
          },
        ]
      : []),
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80" {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center px-3 group-data-[collapsible=icon]:p-0 border-b border-border/60">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton size="lg" className="hover:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-base shadow-sm shrink-0">
                ⛏
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-black tracking-wider text-foreground uppercase">
                  NICKEL FLEET
                </span>
                <span className="truncate text-[10px] text-amber-500 font-semibold tracking-widest uppercase">
                  Mining Operations
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <NavMain title="Operasional & Alur" items={navOperations} />
        {navFleet.length > 0 && (
          <>
            <SidebarSeparator className="my-1 opacity-50" />
            <NavMain title="Manajemen Armada" items={navFleet} />
          </>
        )}
        <SidebarSeparator className="my-1 opacity-50" />
        <NavMain title="Analitik & Rekapitulasi" items={navReports} />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
