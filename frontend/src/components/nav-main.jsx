import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export function NavMain({ title = "Menu Utama", items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.title}>
              <NavLink to={item.url} className="w-full">
                {({ isActive }) => (
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.title}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500/10 text-amber-500 font-bold border border-amber-500/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="truncate">{item.title}</span>
                    {item.badge != null && item.badge > 0 && (
                      <Badge
                        variant="default"
                        className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center justify-center rounded-full"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
