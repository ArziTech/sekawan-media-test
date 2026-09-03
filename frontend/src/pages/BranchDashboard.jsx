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
  const [regionsList, setRegionsList] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('fleet');

  // 1. Initial fetch of regions list
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await api.get('/regions');
        if (res.data?.success && res.data.data.length > 0) {
          const list = res.data.data;
          setRegionsList(list);
          // Default to branch office (e.g. Kantor Cabang Kendari) or first region
          const defaultBranch = list.find(r => r.type === 'branch_office') || list[0];
          setSelectedRegionId(defaultBranch.id);
        }
      } catch (err) {
        console.error("Gagal memuat master wilayah:", err);
        toast.error("Gagal memuat daftar wilayah operasional.");
      }
    };

    fetchRegions();
  }, []);

  // 2. Fetch detail when selectedRegionId changes
  useEffect(() => {
    if (!selectedRegionId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/regions/${selectedRegionId}`);
        if (res.data?.success) {
          setDetailData(res.data.data);
        }
      } catch (err) {
        console.error("Gagal memuat detail wilayah:", err);
        toast.error("Gagal memuat data monitoring cabang.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [selectedRegionId]);

  const handleRefresh = async () => {
    if (!selectedRegionId) return;
    setRefreshing(true);
    try {
      const res = await api.get(`/dashboard/regions/${selectedRegionId}`);
      if (res.data?.success) {
        setDetailData(res.data.data);
        toast.success("Data monitoring cabang berhasil diperbarui.");
      }
    } catch (err) {
      toast.error("Gagal menyegarkan data.");
    } finally {
      setRefreshing(false);
    }
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

  // ─── CHARTS CONFIGURATION ───────────────────────────────────────────
  // 1. Fleet Composition Doughnut Chart
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

  // 2. Connected Destination Routes Bar Chart
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

  const detailStats = detailData?.stats || {};

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
            Pemantauan alokasi armada pool, kesiapan supir, arus ritase, dan konsumsi BBM per cabang/site operasional.
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

      {/* ─── Regional Selector Bar ────────────────────────────────────── */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-muted-foreground font-semibold shrink-0 px-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              Pilih Wilayah:
            </span>

            {regionsList.map((reg) => (
              <Button
                key={reg.id}
                type="button"
                variant={selectedRegionId === reg.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRegionId(reg.id)}
                className={cn(
                  "h-8 rounded-lg text-xs font-medium shrink-0 gap-1.5",
                  selectedRegionId === reg.id
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow-xs"
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

      {/* ─── Selected Region Identity Banner ──────────────────────────── */}
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
          </div>
        </CardContent>
      </Card>

      {/* ─── 4 KPI Summary Cards ──────────────────────────────────────── */}
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

      {/* ─── Visual Charts Row ────────────────────────────────────────── */}
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

      {/* ─── Detail Data Tabs Section ─────────────────────────────────── */}
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
  );
}
