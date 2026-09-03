import React from "react";
import { cn } from "@/lib/utils";
import {
  IconTruck,
  IconHierarchy2,
  IconChartBar,
  IconFileSpreadsheet,
  IconActivity,
  IconGasStation,
  IconTools,
  IconShieldCheck,
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Pemesanan Multi-Wilayah",
      description:
        "Koordinasi mobilitas armada angkutan orang & barang pada 8 wilayah (1 Kantor Pusat, 1 Kantor Cabang, dan 6 Blok Tambang).",
      icon: <IconTruck className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Persetujuan Berjenjang 2 Level",
      description:
        "Alur otorisasi sekuensial bertingkat: Level 1 (Supervisor Operasional) dilanjutkan Level 2 (Kepala Pool & GM Tambang).",
      icon: <IconHierarchy2 className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Visualisasi Grafik Real-Time",
      description:
        "Dashboard analitik Chart.js memantau tren pemakaian bulanan, komposisi kepemilikan armada, serta konsumsi BBM & biaya.",
      icon: <IconChartBar className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Laporan & Ekspor Excel (.xlsx)",
      description:
        "Filter multi-parameter dan generator spreadsheet resmi berstempel tanggal otomatis menggunakan PhpSpreadsheet.",
      icon: <IconFileSpreadsheet className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "100% Audit Trail & Log Aktivitas",
      description:
        "Perekaman otomatis seluruh siklus pemesanan, approval, dispatch, servis, dan login lengkap dengan IP address & snapshot JSON.",
      icon: <IconActivity className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Monitoring Konsumsi BBM",
      description:
        "Pelacakan volume liter bahan bakar, rasio efisiensi KM/liter, total pengeluaran biaya BBM, dan odometer pengisian.",
      icon: <IconGasStation className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Jadwal Servis & Perawatan",
      description:
        "Manajemen pemeliharaan berkala armada dan bengkel rekanan untuk mencegah collision jadwal servis dengan operasional.",
      icon: <IconTools className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Otorisasi Ketat & Sanctum Guard",
      description:
        "Pemisahan hak akses berbasis peran (Admin Pool vs Tim Approver) dengan perlindungan token Laravel Sanctum yang aman.",
      icon: <IconShieldCheck className="w-8 h-8 text-amber-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-6 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({ title, description, icon, index }) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-border/60 dark:border-zinc-800/80 transition-colors",
        (index === 0 || index === 4) && "lg:border-l border-border/60 dark:border-zinc-800/80",
        index < 4 && "lg:border-b border-border/60 dark:border-zinc-800/80"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-amber-500/5 dark:from-amber-500/10 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-amber-500/5 dark:from-amber-500/10 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-8 text-muted-foreground group-hover/feature:text-amber-500 transition-colors">
        {icon}
      </div>
      <div className="text-base font-bold mb-2 relative z-10 px-8">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-muted-foreground/30 dark:bg-zinc-700 group-hover/feature:bg-amber-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>
      <p className="text-xs text-muted-foreground max-w-xs relative z-10 px-8 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
