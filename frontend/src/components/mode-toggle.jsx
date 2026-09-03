import React from 'react';
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn("rounded-lg relative border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer", className)}
            title="Ubah Tema Tampilan (Light / Dark / System)"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 bg-popover border border-border shadow-lg z-50">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer text-xs font-semibold gap-2 py-2 px-2.5 rounded-lg flex items-center ${theme === 'light' ? 'bg-accent text-accent-foreground font-bold' : ''}`}
        >
          <Sun className="size-3.5 text-amber-500" />
          <span>Terang (Light)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer text-xs font-semibold gap-2 py-2 px-2.5 rounded-lg flex items-center ${theme === 'dark' ? 'bg-accent text-accent-foreground font-bold' : ''}`}
        >
          <Moon className="size-3.5 text-blue-400" />
          <span>Gelap (Dark)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer text-xs font-semibold gap-2 py-2 px-2.5 rounded-lg flex items-center ${theme === 'system' ? 'bg-accent text-accent-foreground font-bold' : ''}`}
        >
          <Monitor className="size-3.5 text-muted-foreground" />
          <span>Sistem OS</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
