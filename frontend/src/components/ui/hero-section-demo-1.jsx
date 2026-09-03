import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Truck,
  ArrowRight,
  GitBranch,
  ExternalLink,
  Sparkles,
  KeyRound,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  Fuel,
  Users,
} from "lucide-react";
import logoSekawan from "@/assets/sekawan-media-logo.png";

export function HeroSectionOne() {
  const { user } = useAuth();

  const titleWords = "Monitoring & Pemesanan Armada Tambang Nikel Terdistribusi".split(" ");

  return (
    <div className="relative min-h-screen mx-auto my-6 flex max-w-7xl flex-col items-center justify-center overflow-hidden">
      {/* Decorative Glowing Border Beam Lines (Theme-adjusted to Amber/Nickel Slate) */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-48 w-px bg-gradient-to-b from-transparent via-amber-500 to-transparent animate-pulse" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-20 h-48 w-px bg-gradient-to-b from-transparent via-amber-500 to-transparent animate-pulse" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-64 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      </div>

      <div className="w-full px-4 py-8 md:py-16">
        {/* Animated Staggered Headline */}
        <h1 className="relative z-10 mx-auto max-w-5xl text-center text-3xl font-extrabold tracking-tight text-slate-800 md:text-5xl lg:text-6xl dark:text-slate-100 leading-[1.15]">
          {titleWords.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.08,
                ease: "easeInOut",
              }}
              className={cn(
                "mr-2.5 inline-block",
                word === "Armada" || word === "Tambang" || word === "Nikel"
                  ? "text-amber-500 dark:text-amber-400"
                  : ""
              )}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Animated Lead Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="relative z-10 mx-auto max-w-2xl py-5 text-center text-sm md:text-base font-normal text-neutral-600 dark:text-neutral-400 leading-relaxed"
        >
          Solusi terpadu koordinasi mobilitas angkutan orang & barang pada 8 wilayah operasional (1 Kantor Pusat, 1 Kantor Cabang, dan 6 Blok Tambang) dengan sistem <strong className="text-foreground">Persetujuan Berjenjang 2 Level</strong>, pemantauan konsumsi BBM, jadwal servis, dan export laporan Excel.
        </motion.p>

        {/* Animated Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to={user ? "/dashboard" : "/login"}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 min-w-[200px] transform px-6 font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-400 gap-2"
            )}
          >
            <Truck className="w-4 h-4" />
            <span>{user ? "Masuk ke Dashboard" : "Buka Portal Aplikasi"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="https://github.com/ArziTech/sekawan-media-test"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 min-w-[190px] transform rounded-lg border border-neutral-300 bg-white px-6 font-bold text-xs text-neutral-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 gap-2"
            )}
          >
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span>Repository GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>


        </motion.div>

        {/* Animated Showcase Mockup Container */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 1.1,
          }}
          className="relative z-10 mt-12 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900/90 max-w-5xl mx-auto"
        >
          <div className="w-full overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-800 bg-card p-4 sm:p-6 space-y-6">
            {/* Mockup Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  nickel-fleet.sekawanmedia.co.id/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500">
                  LIVE DISPATCH ENGINE
                </Badge>
              </div>
            </div>

            {/* Mockup Operational Telemetry Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Card 1: Active Trip */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Perjalanan Berlangsung</span>
                  <Badge className="bg-amber-500  text-[10px] font-bold">In-Use</Badge>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-500">TRP-202609-0012</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    Kendari (BC-KDR) &rarr; Pomalaa (SITE-POM)
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 flex items-center justify-between">
                  <span>Toyota Hilux 4x4 (DT 8921 AB)</span>
                  <span className="font-semibold text-foreground">Driver: Agus Salim</span>
                </div>
              </div>

              {/* Card 2: 2-Level Multi-Tier Approval */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Verifikasi Berjenjang</span>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                    2-Tier OK
                  </Badge>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">L1: Supervisor</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Disetujui
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">L2: Kepala Pool & GM</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Disahkan
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-2 font-mono">
                  Otorisasi bertingkat sekuensial
                </div>
              </div>

              {/* Card 3: BBM & Fleet KPI */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Kesiapan Armada</span>
                  <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 text-[10px]">
                    16 Unit
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-card border border-border/50">
                    <div className="text-base font-bold text-foreground">11 Unit</div>
                    <div className="text-[10px] text-muted-foreground">Angkutan Orang</div>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/50">
                    <div className="text-base font-bold text-amber-500">5 Unit</div>
                    <div className="text-[10px] text-muted-foreground">Dump Truck 6x4</div>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 flex items-center justify-between">
                  <span>Konsumsi BBM</span>
                  <span className="font-bold text-emerald-500">8.5 KM / Liter</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
