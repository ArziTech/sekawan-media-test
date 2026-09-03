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
  Wrench,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

export function BranchDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  
  // Data States
  const [overviewData, setOverviewData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('fleet');

  const fetchOverview = async () => {
    try {
      const res = await api.get('/dashboard/regions');
      if (res.data?.success && res.data.data) {
        setOverviewData(res.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil ringkasan wilayah:", err);
      toast.error("Gagal memuat data wilayah operasional.");
    }
  };

  const fetchDetail = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/regions/${id}`);
      if (res.data?.success && res.data.data) {
        setDetailData(res.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil detail wilayah:", err);
      toast.error("Gagal memuat data detail cabang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRegionId === 'all') {
      setLoading(true);
      fetchOverview().then(() => setLoading(false));
    } else {
      fetchDetail(selectedRegionId);
    }
  }, [selectedRegionId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedRegionId === 'all') {
      await fetchOverview();
    } else {
      await fetchDetail(selectedRegionId);
    }
    setRefreshing(false);
    toast.success("Data monitoring cabang berhasil diperbarui.");
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

  // 3. Detail Region Fleet Composition (Doughnut)
  const detailStats = detailData?.stats || {};
  const detailFleetChartData = {
    labels: [
      'Angkutan Orang (Milik)',
      'Angkutan Orang (Sewa)',
      'Angkutan Barang (Milik)',
      'Angkutan Barang (Sewa)',
    ],
    datasets: [
      {
        data: [
          detailData?.vehicles?.filter(v => v.type === 'passenger' && v.ownership_type === 'owned').length || 0,
          detailData?.vehicles?.filter(v => v.type === 'passenger' && v.ownership_type === 'rented').length || 0,
          detailData?.vehicles?.filter(v => v.type === 'cargo' && v.ownership_type === 'owned').length || 0,
          detailData?.vehicles?.filter(v => v.type === 'cargo' && v.ownership_type === 'rented').length || 0,
        ],
        backgroundColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  // 4. Detail Top Connected Routes
  const routeLabels = detailData?.top_destinations?.map(d => d.destination_name) || [];
  const routeCounts = detailData?.top_destinations?.map(d => d.total_trips) || [];
  const destinationRoutesChartData = {
    labels: routeLabels,
    datasets: [
      {
        label: 'Frekuensi Keberangkatan',
        data: routeCounts,
        backgroundColor: '#8b5cf6',
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
            Pemantauan alokasi armada pool, kesiapan supir, arus ritase logistik, dan konsumsi BBM per cabang/site operasional.
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

      {/* ─── Regional Selector Filter Bar ─────────────────────────────── */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-muted-foreground font-semibold shrink-0 px-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              Pilih Wilayah:
            </span>

            <Button
              type="button"
              variant={selectedRegionId === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRegionId('all')}
              className={cn(
                "h-8 rounded-lg text-xs font-bold shrink-0",
                selectedRegionId === 'all' && "bg-amber-500 text-slate-950 hover:bg-amber-400"
              )}
            >
              Semua Wilayah (Overview)
            </Button>

            {regionsList.map((reg) => (
              <Button
                key={reg.id}
                type="button"
                variant={selectedRegionId === String(reg.id) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRegionId(String(reg.id))}
                className={cn(
                  "h-8 rounded-lg text-xs font-medium shrink-0 gap-1.5",
                  selectedRegionId === String(reg.id)
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
                    : reg.type === 'branch_office'
                    ? "border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                    : ""
                )}
              >
                <span>{reg.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({reg.code})</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── CONDITIONAL CONTENT: ALL REGIONS OVERVIEW VS SINGLE REGION ──────── */}
      {selectedRegionId === 'all' ? (
        /* ══════════════════════════════════════════════════════════════════
           MODE 1: SEMUA WILAYAH (OVERVIEW DASHBOARD)
           ══════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Quick 8 Regional Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionsList.map((reg) => (
              <Card
                key={reg.id}
                className={cn(
                  "border-border/80 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs hover:shadow-md group",
                  reg.type === 'branch_office' && "ring-1 ring-blue-500/40 bg-blue-500/5"
                )}
                onClick={() => setSelectedRegionId(String(reg.id))}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground">{reg.code}</span>
                      <CardTitle className="text-sm font-bold group-hover:text-amber-500 transition-colors truncate">
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

          {/* Comparative Charts Grid */}
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

          {/* Comprehensive 8-Region Table */}
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
                      <th className="py-3 px-4 text-right">Aksi</th>
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRegionId(String(r.id))}
                            className="h-7 px-2.5 text-[11px] font-bold gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           MODE 2: DETAIL WILAYAH TERPILIH (DRILL-DOWN DASHBOARD)
           ══════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Selected Region Banner */}
          <Card className="border-border/80 bg-gradient-to-r from-amber-500/10 via-background to-background">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {getRegionTypeBadge(detailData?.region?.type)}
                    <span className="text-xs font-mono font-bold text-amber-500">{detailData?.region?.code}</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {detailData?.region?.name}
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {detailData?.region?.address}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRegionId('all')}
                  className="h-8 text-xs font-bold gap-1.5 self-start md:self-auto"
                >
                  &larr; Kembali ke Ringkasan Semua Wilayah
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 4 Detail KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Fleet */}
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Armada Pool Cabang</span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{detailStats.vehicles_available || 0}</span>
                  <span className="text-xs text-muted-foreground">Siap / {detailStats.vehicles_total || 0} Unit</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>{detailStats.passenger_count || 0} Penumpang</span>
                  <span>&middot;</span>
                  <span>{detailStats.cargo_count || 0} Barang</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Drivers */}
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personil Supir</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{detailStats.drivers_available || 0}</span>
                  <span className="text-xs text-muted-foreground">Siap / {detailStats.drivers_total || 0} Orang</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span className="text-blue-400 font-semibold">{detailStats.drivers_on_duty || 0} Sedang Bertugas</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Trips */}
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ritase Logistik Aktif</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{detailStats.active_outgoing_count || 0}</span>
                  <span className="text-xs text-muted-foreground">Keluar / {detailStats.active_incoming_count || 0} Masuk</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span className="text-purple-400 font-semibold">Sedang dalam perjalanan dinas</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Fuel */}
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Konsumsi BBM Bulan Ini</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Fuel className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-500">{formatRupiah(detailStats.monthly_fuel_cost)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>{detailStats.monthly_fuel_liters?.toLocaleString('id-ID') || 0} Liter Terpakai</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  Komposisi Armada Pool ({detailData?.region?.name || 'Wilayah'})
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribusi kendaraan berdasarkan jenis armada dan status kepemilikan.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2 h-64">
                <Doughnut
                  data={detailFleetChartData}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#a1a1aa',
                          font: { size: 10 },
                          usePointStyle: true,
                          pointStyle: 'circle',
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-400" />
                  Koridor Destinasi Terpadat dari Cabang Ini
                </CardTitle>
                <CardDescription className="text-xs">
                  Volume perjalanan logistik dan kunjungan operasional ke site tujuan.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2 h-64">
                <Bar data={destinationRoutesChartData} options={chartOptions} />
              </CardContent>
            </Card>
          </div>

          {/* Detail Tabs Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/70 pb-2 overflow-x-auto">
              <Button
                type="button"
                variant={activeDetailTab === 'fleet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveDetailTab('fleet')}
                className={cn("h-8 text-xs font-bold gap-1.5 shrink-0", activeDetailTab === 'fleet' && "bg-amber-500 text-slate-950 hover:bg-amber-400")}
              >
                <Truck className="w-3.5 h-3.5" />
                Armada Pool ({detailData?.vehicles?.length || 0})
              </Button>
              <Button
                type="button"
                variant={activeDetailTab === 'drivers' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveDetailTab('drivers')}
                className={cn("h-8 text-xs font-bold gap-1.5 shrink-0", activeDetailTab === 'drivers' && "bg-amber-500 text-slate-950 hover:bg-amber-400")}
              >
                <Users className="w-3.5 h-3.5" />
                Supir ({detailData?.drivers?.length || 0})
              </Button>
              <Button
                type="button"
                variant={activeDetailTab === 'trips' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveDetailTab('trips')}
                className={cn("h-8 text-xs font-bold gap-1.5 shrink-0", activeDetailTab === 'trips' && "bg-amber-500 text-slate-950 hover:bg-amber-400")}
              >
                <Navigation className="w-3.5 h-3.5" />
                Logistik & Trip Terkini
              </Button>
              <Button
                type="button"
                variant={activeDetailTab === 'fuel_service' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveDetailTab('fuel_service')}
                className={cn("h-8 text-xs font-bold gap-1.5 shrink-0", activeDetailTab === 'fuel_service' && "bg-amber-500 text-slate-950 hover:bg-amber-400")}
              >
                <Fuel className="w-3.5 h-3.5" />
                BBM & Servis
              </Button>
            </div>

            {/* TAB 1: FLEET LIST */}
            {activeDetailTab === 'fleet' && (
              <Card className="border-border/80 shadow-xs">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 border-b border-border/80 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Kendaraan</th>
                          <th className="py-3 px-4">Plat Nomor</th>
                          <th className="py-3 px-4">Tipe & Status Milik</th>
                          <th className="py-3 px-4">Odometer</th>
                          <th className="py-3 px-4">Jadwal Servis</th>
                          <th className="py-3 px-4 text-right">Status Kesiapan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {detailData?.vehicles?.length === 0 ? (
                          <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">Tidak ada armada yang ditempatkan di wilayah ini.</td></tr>
                        ) : (
                          detailData?.vehicles?.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/30">
                              <td className="py-3 px-4 font-bold text-foreground">{v.name}</td>
                              <td className="py-3 px-4 font-mono font-bold text-amber-500">{v.license_plate}</td>
                              <td className="py-3 px-4">
                                <span className="capitalize font-semibold">{v.type === 'passenger' ? 'Angkutan Orang' : 'Angkutan Barang'}</span>
                                <span className="text-muted-foreground text-[10px] block">{v.ownership_type === 'owned' ? 'Milik Sendiri' : `Sewa (${v.rental_company?.name || 'Rekanan'})`}</span>
                              </td>
                              <td className="py-3 px-4 font-mono">{v.current_odometer?.toLocaleString('id-ID')} KM</td>
                              <td className="py-3 px-4 text-muted-foreground">
                                {v.next_service_date || '-'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {v.status === 'available' && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Tersedia (Ready)</Badge>}
                                {v.status === 'in_use' && <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">Sedang Digunakan</Badge>}
                                {v.status === 'in_service' && <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30">Dalam Servis</Badge>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: DRIVERS LIST */}
            {activeDetailTab === 'drivers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {detailData?.drivers?.length === 0 ? (
                  <div className="col-span-3 py-8 text-center text-muted-foreground">Tidak ada supir terdaftar di cabang ini.</div>
                ) : (
                  detailData?.drivers?.map((d) => (
                    <Card key={d.id} className="border-border/80 shadow-xs">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-sm text-foreground block">{d.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{d.phone}</span>
                          </div>
                          {d.status === 'available' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Siap Tugas</Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px]">Sedang Tugas</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                          <span>Nomor Lisensi: <strong className="font-mono text-foreground">{d.license_number}</strong></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: TRIPS LIST */}
            {activeDetailTab === 'trips' && (
              <Card className="border-border/80 shadow-xs">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 border-b border-border/80 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Kode Booking</th>
                          <th className="py-3 px-4">Pemohon</th>
                          <th className="py-3 px-4">Kendaraan & Supir</th>
                          <th className="py-3 px-4">Rute Perjalanan</th>
                          <th className="py-3 px-4">Tujuan / Keperluan</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {detailData?.active_outgoing?.length === 0 && detailData?.recent_completed?.length === 0 ? (
                          <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">Belum ada riwayat perjalanan terkait cabang ini.</td></tr>
                        ) : (
                          [...(detailData?.active_outgoing || []), ...(detailData?.recent_completed || [])].slice(0, 10).map((b) => (
                            <tr key={b.id} className="hover:bg-muted/30">
                              <td className="py-3 px-4 font-mono font-bold text-amber-500">{b.booking_code}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-foreground">{b.requester_name}</div>
                                <div className="text-[10px] text-muted-foreground">{b.requester_department}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold">{b.vehicle?.name || '-'}</div>
                                <div className="text-[10px] text-muted-foreground">Supir: {b.driver?.name || '-'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <span>{b.origin_region?.code || b.region_id}</span>
                                  <span>&rarr;</span>
                                  <span className="text-amber-500">{b.destination_region?.code || b.destination_region_id}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{b.purpose}</td>
                              <td className="py-3 px-4 text-right">
                                {b.status === 'in_use' && <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">Sedang Berjalan</Badge>}
                                {b.status === 'completed' && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Selesai</Badge>}
                                {b.status === 'approved' && <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">Disetujui (Siap Berangkat)</Badge>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: FUEL & SERVICE LOGS */}
            {activeDetailTab === 'fuel_service' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/80 shadow-xs">
                  <CardHeader className="p-4 pb-2 border-b border-border/60">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-emerald-500" />
                      Log Pengisian BBM Terkini
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/30 text-[10px] text-muted-foreground uppercase font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Kendaraan</th>
                            <th className="py-2.5 px-3">Volume</th>
                            <th className="py-2.5 px-3 text-right">Biaya</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-[11px]">
                          {detailData?.fuel_logs?.length === 0 ? (
                            <tr><td colSpan="4" className="py-4 text-center text-muted-foreground">Belum ada catatan BBM.</td></tr>
                          ) : (
                            detailData?.fuel_logs?.slice(0, 5).map((f) => (
                              <tr key={f.id}>
                                <td className="py-2 px-3 text-muted-foreground">{f.log_date}</td>
                                <td className="py-2 px-3 font-semibold">{f.vehicle?.name}</td>
                                <td className="py-2 px-3">{f.liters} L ({f.fuel_type})</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-500">{formatRupiah(f.total_cost)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs">
                  <CardHeader className="p-4 pb-2 border-b border-border/60">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-500" />
                      Jadwal & Riwayat Servis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/30 text-[10px] text-muted-foreground uppercase font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Kendaraan</th>
                            <th className="py-2.5 px-3">Jenis Servis</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-[11px]">
                          {detailData?.service_logs?.length === 0 ? (
                            <tr><td colSpan="4" className="py-4 text-center text-muted-foreground">Belum ada riwayat servis.</td></tr>
                          ) : (
                            detailData?.service_logs?.slice(0, 5).map((s) => (
                              <tr key={s.id}>
                                <td className="py-2 px-3 text-muted-foreground">{s.service_date}</td>
                                <td className="py-2 px-3 font-semibold">{s.vehicle?.name}</td>
                                <td className="py-2 px-3 capitalize">{s.service_type}</td>
                                <td className="py-2 px-3 text-right">
                                  <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
