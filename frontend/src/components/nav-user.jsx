import React from 'react';
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ShieldCheck, ChevronsUpDown } from "lucide-react";

export function NavUser() {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleTitle =
    user.role === 'admin'
      ? 'Admin Pool Kendaraan'
      : `Penyetujui Level ${user.approval_tier || 1}`;

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center w-full">
      <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className="flex w-full items-center justify-between gap-2 p-1.5 rounded-xl border border-border/80 bg-sidebar-accent/40 hover:bg-sidebar-accent/80 cursor-pointer transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 px-0.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
                <AvatarFallback className="rounded-lg font-bold text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-foreground">{user.name}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {roleTitle}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden mr-1" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-60 rounded-xl p-1.5 bg-popover border border-border shadow-xl z-50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
                  <AvatarFallback className="rounded-lg font-bold text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                  <span className="font-bold text-foreground truncate">{user.name}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                </div>
              </div>
              <div className="px-2 py-1 rounded-md bg-muted text-[10px] text-amber-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.position || roleTitle}</span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 bg-border/60" />

            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
              }}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground cursor-pointer font-bold text-xs gap-2 py-2 px-2.5 rounded-lg transition-colors flex items-center"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar (Log Out)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
