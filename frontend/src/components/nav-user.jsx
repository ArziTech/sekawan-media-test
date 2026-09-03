import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { LogOut, ShieldCheck, ChevronsUpDown } from "lucide-react";

export function NavUser() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
    <div ref={popoverRef} className="relative w-full">
      {/* Interactive Trigger Button using Shadcn Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between gap-2 p-1.5 h-auto rounded-xl border transition-all cursor-pointer text-left outline-none select-none font-normal group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto",
          isOpen
            ? "border-amber-500/50 bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-amber-500/20"
            : "border-border/80 bg-sidebar-accent/40 hover:bg-sidebar-accent text-sidebar-foreground"
        )}
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
        <ChevronsUpDown className={cn("w-4 h-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden mr-1 transition-transform duration-200", isOpen && "rotate-180 text-foreground")} />
      </Button>

      {/* Popover Menu Content */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 p-1.5 rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150",
            state === 'collapsed'
              ? 'left-full bottom-0 ml-3 w-64'
              : 'bottom-full left-0 right-0 mb-2 w-full min-w-[240px]'
          )}
        >
          {/* User Details */}
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
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
          </div>

          <div className="h-px bg-border/60 my-1" />

          {/* Explicit Logout Action Button using Shadcn Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              logout();
            }}
            className="w-full justify-start gap-2 px-2.5 py-2 h-auto text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar (Log Out)</span>
          </Button>
        </div>
      )}
    </div>
  );
}
