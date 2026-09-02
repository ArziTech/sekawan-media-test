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
    <SidebarGroup className="group-data-[collapsible=icon]:p-0">
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2 group-data-[collapsible=icon]:hidden">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <NavLink to={item.url} className="w-full group-data-[collapsible=icon]:w-auto">
                {({ isActive }) => (
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={{ children: item.title }}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center ${
                      isActive
                        ? "bg-amber-500/10 text-amber-500 font-bold border border-amber-500/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {item.badge != null && item.badge > 0 && (
                      <Badge
                        variant="default"
                        className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center justify-center rounded-full group-data-[collapsible=icon]:hidden"
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
