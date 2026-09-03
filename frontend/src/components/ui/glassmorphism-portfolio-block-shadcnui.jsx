import React from "react";
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Globe,
  Mail,
  GitBranch,
  Sparkles,
  GraduationCap,
  Briefcase,
  Layers,
} from "lucide-react";
import { IconBrandLinkedin, IconBrandGithub } from "@tabler/icons-react";
import gunawanProfileImg from "@/assets/gunawan-profile.jpg";

const highlights = [
  {
    icon: GraduationCap,
    title: "Pendidikan & Akademik",
    description:
      "S1 Teknik Komputer, Universitas Brawijaya (2022 – Sekarang) · IPK 3.36 / 4.00 · Rekayasa Perangkat Lunak, Arsitektur Sistem, & IoT.",
  },
  {
    icon: Layers,
    title: "Portofolio & SaaS Pilihan",
    description:
      "Rasava AI (rasavaai.id) SaaS review analytics · db-stock IDX data engine · Financial Plan App · Nickel Fleet Management System.",
  },
  {
    icon: Briefcase,
    title: "Ketersediaan & Pengalaman",
    description:
      "Tersedia untuk Full Stack & Software Engineer Internship · Pengalaman memimpin tim Web Developer di Digital Creative MRP & IoT Engineer di BRMP Jestro.",
  },
];

const socialLinks = [
  {
    label: "Web Portfolio",
    handle: "gunawan05.pro",
    href: "https://gunawan05.pro",
    icon: Globe,
    accent: "text-amber-500",
  },
  {
    label: "LinkedIn",
    handle: "in/gunawan05dotpro",
    href: "https://linkedin.com/in/gunawan05dotpro",
    icon: IconBrandLinkedin,
    accent: "text-blue-500",
  },
  {
    label: "GitHub",
    handle: "github.com/ArziTech",
    href: "https://github.com/ArziTech",
    icon: IconBrandGithub,
    accent: "text-foreground",
  },
  {
    label: "Email",
    handle: "gunawan05.pro@gmail.com",
    href: "mailto:gunawan05.pro@gmail.com",
    icon: Mail,
    accent: "text-emerald-500",
  },
];

const listVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

export function GlassmorphismPortfolioBlock() {
  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-background/50 p-6 sm:p-10 backdrop-blur-2xl md:p-12"
        >
          {/* Subtle Ambient Glass Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-slate-500/[0.04] pointer-events-none" />
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative grid gap-10 lg:grid-cols-12 items-center">
            {/* Left column - Main content */}
            <div className="space-y-6 lg:col-span-7 text-left">
              <div className="space-y-3">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]"
                >
                  Gunawan &middot; Full Stack Developer                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="max-w-xl text-xs sm:text-sm leading-relaxed text-muted-foreground"
                >
                  Software Engineer dengan 3+ tahun pengalaman hands-on dalam merancang, membangun, dan men-deploy aplikasi web end-to-end. Terbiasa dengan arsitektur modern (TypeScript, React 19, Next.js, Laravel 13, NestJS, MySQL, PostgreSQL, Docker, dan automasi AI).
                </motion.p>
              </div>

              {/* Highlights grid */}
              <div className="grid gap-3.5 sm:grid-cols-1">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ y: -2 }}
                      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-4.5 backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-card/80"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            {item.title}
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <a
                  href="https://gunawan05.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                  )}                >
                  <Globe className="h-4 w-4" />
                  <span>Kunjungi Web Portfolio (gunawan05.pro)</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>

                <a
                  href="https://github.com/ArziTech/sekawan-media-test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-11 w-full sm:w-auto gap-2 rounded-xl border border-border/80 bg-background/80 px-5 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted/70"
                >
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span>Repository GitHub</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </motion.div>
            </div>

            {/* Right column - Profile card */}
            <div className="relative lg:col-span-5">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl" />
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-border/60 bg-card/70 p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar with glow */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-5"
                  >
                    <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-2xl" />
                    <img
                      src={gunawanProfileImg}
                      alt="Gunawan - Full Stack Developer"
                      className="relative h-36 w-36 rounded-full border-2 border-amber-500/50 object-cover ring-4 ring-background/80"
                    />
                    <div className="absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background ring-2 ring-emerald-500/40 animate-pulse" title="Available for Opportunities" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-1"
                  >
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Gunawan
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
                      Full Stack Developer
                    </p>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground"
                  >
                    Mahasiswa Teknik Komputer Universitas Brawijaya dengan minat mendalam pada clean architecture, end-to-end full stack development, dan automasi sistem.
                  </motion.p>
                </div>

                {/* Social links */}
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="mt-6 flex flex-col gap-2.5"
                >
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={social.label}
                        variants={itemVariants}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3.5 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-background/90"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-muted/60 text-foreground transition-all group-hover:bg-amber-500/10 group-hover:text-amber-500 group-hover:border-amber-500/30">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground group-hover:text-amber-500 transition-colors">
                              {social.label}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {social.handle}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
                      </motion.a>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
