import React from 'react';
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ShieldCheck } from "lucide-react";

export function NavUser() {
  const { user, logout } = useAuth();
  const { isMobile, state } = useSidebar();

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
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        {/* Expanded Mode: Card with User Details and Direct Logout Button */}
        <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl border border-border/80 bg-sidebar-accent/40 group-data-[collapsible=icon]:hidden w-full">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 px-1">
            <Avatar className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <AvatarFallback className="rounded-lg font-bold text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-bold text-foreground">{user.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {roleTitle}
              </span>
            </div>
          </div>

          <Button
            onClick={logout}
            variant="ghost"
            size="icon-sm"
            title="Keluar / Logout"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Collapsed Mode: Single Centered Avatar Button with Dropdown Logout */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                tooltip={{ children: `${user.name} (${roleTitle})` }}
                className="h-9 w-9 p-0 flex items-center justify-center rounded-lg hover:bg-sidebar-accent"
              >
                <Avatar className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <AvatarFallback className="rounded-lg font-bold text-xs">{initials}</AvatarFallback>
                </Avatar>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-xl p-1.5"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={10}
            >
              <DropdownMenuLabel className="p-2 font-normal">
                <p className="font-bold text-xs text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                <p className="text-[10px] text-amber-500 font-medium mt-0.5">{roleTitle}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive focus:bg-destructive/15 cursor-pointer font-bold text-xs gap-2 py-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar / Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
