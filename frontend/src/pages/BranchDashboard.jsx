import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import {
  Building2,
  MapPin,
  Truck,
  Users,
  Navigation,
  Fuel,
  RefreshCw,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export function BranchDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState(null);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/dashboard/regions');
      if (res.data?.success && res.data.data) {
        setOverviewData(res.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil ringkasan wilayah:", err);
      toast.error("Gagal memuat data wilayah operasional.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverview();
    setRefreshing(false);
    toast.success("Data monitoring wilayah berhasil diperbarui.");
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getRegionTypeBadge = (type) => {
    switch (type) {
      case 'head_office':
        return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">Kantor Pusat</Badge>;
      case 'branch_office':
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">Kantor Cabang</Badge>;
      case 'mine_site':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Site Tambang</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const regionsList = overviewData?.regions || [];

  // ─── CHARTS CONFIGURATION ───────────────────────────────────────────
  // 1. Overview Comparison Bar Chart (Trips & Fleet)
  const comparisonChartData = {
    labels: overviewData?.comparison_chart?.labels?.map(l => l.replace('Tambang ', 'Tmb. ').replace('Kantor ', 'Kntr. ')) || [],
    datasets: [
      {
        label: 'Unit Armada Terdaftar',
        data: overviewData?.comparison_chart?.fleet_counts || [],
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      },
      {
        label: 'Frekuensi Trip Berangkat',
        data: overviewData?.comparison_chart?.trip_counts || [],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#a1a1aa',
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#fafafa',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a1a1aa', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a1a1aa', font: { size: 10 }, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  // 2. Overview Fuel Cost Bar Chart
  const fuelCostChartData = {
    labels: overviewData?.comparison_chart?.labels?.map(l => l.replace('Tambang ', 'Tmb. ').replace('Kantor ', 'Kntr. ')) || [],
    datasets: [
      {
        label: 'Beban BBM Bulan Ini (Juta Rp)',
        data: overviewData?.comparison_chart?.fuel_cost_millions || [],
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ─── Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Monitoring Kantor Cabang & Wilayah Tambang
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Pemantauan seluruh 8 wilayah operasional (1 Kantor Pusat, 1 Kantor Cabang Kendari, dan 6 Site Tambang Nikel).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", (refreshing || loading) && "animate-spin")} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* ─── 8 Regional Status Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionsList.map((reg) => (
          <Card
            key={reg.id}
            className={cn(
              "border-border/80 shadow-xs transition-all",
              reg.type === 'branch_office' && "ring-1 ring-blue-500/40 bg-blue-500/5",
              reg.type === 'head_office' && "ring-1 ring-amber-500/30 bg-amber-500/5"
            )}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground">{reg.code}</span>
                  <CardTitle className="text-sm font-bold text-foreground truncate">
                    {reg.name}
                  </CardTitle>
                </div>
                {getRegionTypeBadge(reg.type)}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Armada Pool</span>
                  <span className="font-bold text-foreground">
                    {reg.fleet.available} <span className="text-muted-foreground text-[10px]">/ {reg.fleet.total} Unit</span>
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Supir Siap</span>
                  <span className="font-bold text-foreground">
                    {reg.drivers.available} <span className="text-muted-foreground text-[10px]">/ {reg.drivers.total} Org</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] border-t border-border/50 pt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-amber-500" />
                  {reg.trips.active_outgoing} Trip Aktif
                </span>
                <span className="font-semibold text-emerald-500">
                  {formatRupiah(reg.fuel.monthly_cost)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Comparative Charts Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              Alokasi Armada & Frekuensi Keberangkatan per Wilayah
            </CardTitle>
            <CardDescription className="text-xs">
              Perbandingan ketersediaan unit kendaraan dan ritase perjalanan logistik antar site.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4 h-72">
            <Bar data={comparisonChartData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Fuel className="w-4 h-4 text-emerald-500" />
              Distribusi Beban Biaya Bahan Bakar (BBM) Bulan Berjalan
            </CardTitle>
            <CardDescription className="text-xs">
              Total pengeluaran biaya BBM operasional kendaraan pada masing-masing pool wilayah.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4 h-72">
            <Bar data={fuelCostChartData} options={chartOptions} />
          </CardContent>
        </Card>
      </div>

      {/* ─── Comprehensive 8-Region Table ─────────────────────────────── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Tabel Ringkasan 8 Wilayah Operasional Tambang & Kantor
          </CardTitle>
          <CardDescription className="text-xs">
            Data komprehensif alokasi sumber daya armada, supir, dan arus perjalanan logistik.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-y border-border/80 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Wilayah & Kode</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Armada (Siap / Total)</th>
                  <th className="py-3 px-4">Supir (Siap / Total)</th>
                  <th className="py-3 px-4">Trip Keluar / Masuk</th>
                  <th className="py-3 px-4">Beban BBM Bulan Ini</th>
                  <th className="py-3 px-4 text-right">Status Pool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {regionsList.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div className="font-bold">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{r.code} &middot; {r.address}</div>
                    </td>
                    <td className="py-3.5 px-4">{getRegionTypeBadge(r.type)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{r.fleet.available} <span className="text-muted-foreground font-normal">/ {r.fleet.total} Unit</span></div>
                      <div className="text-[10px] text-muted-foreground">{r.fleet.in_use} jalan &middot; {r.fleet.in_service} servis</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{r.drivers.available} <span className="text-muted-foreground font-normal">/ {r.drivers.total} Orang</span></div>
                      <div className="text-[10px] text-muted-foreground">{r.drivers.on_duty} on duty</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-semibold">{r.trips.total_origin} Out</span>
                        <span>&middot;</span>
                        <span className="text-blue-400 font-semibold">{r.trips.total_destination} In</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-500">{formatRupiah(r.fuel.monthly_cost)}</div>
                      <div className="text-[10px] text-muted-foreground">{r.fuel.monthly_liters.toLocaleString('id-ID')} Liter</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
