import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/context/ToastContext";
import {
  ArrowLeft,
  Building2,
  Building,
  Landmark,
  Pickaxe,
  MapPin,
  Truck,
  Users,
  Navigation,
  Fuel,
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Compass,
  RefreshCw,
  Gauge,
  Phone,
  CreditCard,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingStatusBadge } from '@/components/common/StatusBadge';
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

export function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('fleet-drivers');

  const currentMonthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // TanStack Query: Fetch All Regions (for switcher)
  const { data: allRegions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data?.data?.regions || [];
    },
  });

  // TanStack Query: Fetch Region Detail
  const { data: regionData, isLoading: loading, refetch } = useQuery({
    queryKey: ['region-detail', id],
    queryFn: async () => {
      const res = await api.get(`/dashboard/regions/${id}`);
      return res.data?.data || null;
    },
    enabled: !!id,
  });

  const data = regionData;

  const getRegionTypeBadge = (type) => {
    switch (type) {
      case 'head_office':
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1 text-xs">
            <Landmark className="w-3.5 h-3.5" />
            Kantor Pusat (HQ)
          </Badge>
        );
      case 'branch_office':
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 text-xs">
            <Building className="w-3.5 h-3.5" />
            Kantor Cabang
          </Badge>
        );
      case 'mine_site':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
            <Pickaxe className="w-3.5 h-3.5" />
            Site Tambang Nikel
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getVehicleStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Tersedia</Badge>;
      case 'in_use':
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">Digunakan</Badge>;
      case 'in_service':
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">Dalam Servis</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDriverStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Siap Tugas</Badge>;
      case 'on_duty':
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">Bertugas</Badge>;
      case 'off_duty':
        return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px]">Off Duty</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-muted-foreground space-y-3">
        <div className="inline-block w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs">Memuat data monitoring detail wilayah operasional...</p>
      </div>
    );
  }

  const { region, stats, vehicles, drivers, active_outgoing, active_incoming, recent_completed, fuel_logs, service_logs, top_destinations } = data;

  // Top destination chart data
  const destinationChartData = {
    labels: top_destinations.map(d => d.destination_name) || [],
    datasets: [
      {
        label: 'Frekuensi Perjalanan (Trip)',
        data: top_destinations.map(d => d.total_trips) || [],
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      },
    ],
  };

  const destinationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header with Back Navigation & Quick Switcher ────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/branch-dashboard')}
            className="text-xs gap-1.5 -ml-2 text-muted-foreground hover:text-foreground h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Overview Semua Wilayah</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-500" />
              {region.name}
            </h1>
            {getRegionTypeBadge(region.type)}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
              {region.code}
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              {region.address}
            </span>
          </div>
        </div>

        {/* Quick Region Switcher Dropdown (shadcn Select) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Pindah Wilayah:</span>
          <Select value={id} onValueChange={(val) => navigate(`/branch-dashboard/${val}`)}>
            <SelectTrigger className="w-56 h-9 text-xs">
              <SelectValue placeholder="Pilih Wilayah" />
            </SelectTrigger>
            <SelectContent>
              {allRegions.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name} ({r.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 text-xs gap-1"
            title="Segarkan data wilayah ini"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── 4 Top KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Readiness */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Kesiapan Armada Pool</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
              <Truck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {stats.vehicles_available}{' '}
              <span className="text-xs text-muted-foreground font-normal">/ {stats.vehicles_total} Unit Siap</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-2">
              <span>{stats.vehicles_in_use} Sedang Jalan</span>
              <span>&middot;</span>
              <span>{stats.vehicles_in_service} Servis</span>
              <span>&middot;</span>
              <span>{stats.passenger_count} Penumpang</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Drivers */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Personil Supir</span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {stats.drivers_available}{' '}
              <span className="text-xs text-muted-foreground font-normal">/ {stats.drivers_total} Supir Siap</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-blue-400 font-semibold">{stats.drivers_on_duty} On Duty (Sedang Jalan)</span>
              <span>{stats.drivers_available} Standby</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Active Trips Flow */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Arus Perjalanan Aktif</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <Navigation className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {stats.active_outgoing_count + stats.active_incoming_count}{' '}
              <span className="text-xs text-muted-foreground font-normal">Total Trip Berjalan</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {stats.active_outgoing_count} Berangkat (Out)
              </span>
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3" /> {stats.active_incoming_count} Masuk (In)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Fuel Cost Monthly */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Biaya BBM ({currentMonthLabel})</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Fuel className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="text-xl font-bold text-emerald-500">
              {formatRupiah(stats.monthly_fuel_cost)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-2">
              <span>Konsumsi: <strong>{stats.monthly_fuel_liters.toLocaleString('id-ID')} Liter</strong></span>
              <span className="text-[10px] text-muted-foreground">Bulan Berjalan</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tabbed Detail Deep Dive ────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-10 p-1 bg-muted/60">
          <TabsTrigger value="fleet-drivers" className="text-xs font-semibold gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            Armada & Supir ({vehicles.length + drivers.length})
          </TabsTrigger>
          <TabsTrigger value="active-trips" className="text-xs font-semibold gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            Arus Perjalanan ({active_outgoing.length + active_incoming.length})
          </TabsTrigger>
          <TabsTrigger value="fuel-maintenance" className="text-xs font-semibold gap-1.5">
            <Fuel className="w-3.5 h-3.5" />
            BBM & Servis ({fuel_logs.length + service_logs.length})
          </TabsTrigger>
          <TabsTrigger value="destinations" className="text-xs font-semibold gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Analitik Destinasi
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: FLEET & DRIVERS ─────────────────────────────────── */}
        <TabsContent value="fleet-drivers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicles Table */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  Alokasi Armada Kendaraan ({vehicles.length} Unit)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar seluruh kendaraan operasional yang berbasis di pool wilayah ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                      <TableHead className="py-2.5 px-3">Kendaraan</TableHead>
                      <TableHead className="py-2.5 px-3">Tipe / Sewa</TableHead>
                      <TableHead className="py-2.5 px-3">Odometer</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada armada yang ditempatkan di wilayah ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicles.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="py-3 px-3">
                            <div className="font-bold text-foreground text-xs">{v.name}</div>
                            <div className="font-mono text-[11px] text-amber-500 font-semibold">{v.license_plate}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="capitalize font-medium text-foreground">{v.type === 'passenger' ? 'Penumpang' : 'Angkutan Tambang'}</div>
                            <div className="text-[10px] text-muted-foreground capitalize">
                              {v.ownership_type === 'owned' ? 'Milik Perusahaan' : `Sewa: ${v.rental_company?.name || '-'}`}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs font-mono">
                            {Number(v.current_odometer).toLocaleString('id-ID')} km
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right">
                            {getVehicleStatusBadge(v.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Drivers Table */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Personil Supir Wilayah ({drivers.length} Orang)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar supir operasional yang bertugas dan ditempatkan di pool ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                      <TableHead className="py-2.5 px-3">Nama Supir</TableHead>
                      <TableHead className="py-2.5 px-3">SIM & Kontak</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada personil supir di wilayah ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      drivers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="py-3 px-3">
                            <div className="font-bold text-foreground text-xs">{d.name}</div>
                            <div className="text-[10px] text-muted-foreground">ID: #{d.id}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-mono text-muted-foreground flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-amber-500" />
                              SIM: {d.license_number}
                            </div>
                            <div className="font-mono text-muted-foreground flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-emerald-500" />
                              {d.phone}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right">
                            {getDriverStatusBadge(d.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 2: ACTIVE & RECENT TRIPS ────────────────────────────── */}
        <TabsContent value="active-trips" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Outgoing Trips */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-amber-500" />
                  Trip Keluar Aktif (Outgoing - {active_outgoing.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Perjalanan yang diberangkatkan dari pool {region.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                      <TableHead className="py-2.5 px-3">Kode & Pemohon</TableHead>
                      <TableHead className="py-2.5 px-3">Destinasi</TableHead>
                      <TableHead className="py-2.5 px-3">Armada & Supir</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {active_outgoing.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada trip keluar yang sedang berjalan saat ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      active_outgoing.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="py-3 px-3">
                            <div className="font-mono font-bold text-amber-500 text-xs">{b.booking_code}</div>
                            <div className="text-[11px] text-foreground font-semibold">{b.requester_name}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-bold text-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              {b.destination_region?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground italic">"{b.purpose}"</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-semibold text-foreground">{b.vehicle?.name}</div>
                            <div className="text-[11px] text-muted-foreground">Supir: {b.driver?.name}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right">
                            <BookingStatusBadge status={b.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Incoming Trips */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                  Trip Masuk Aktif (Incoming - {active_incoming.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Perjalanan dari kantor/site lain yang menuju ke {region.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                      <TableHead className="py-2.5 px-3">Kode & Pemohon</TableHead>
                      <TableHead className="py-2.5 px-3">Asal Berangkat</TableHead>
                      <TableHead className="py-2.5 px-3">Armada & Supir</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {active_incoming.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada trip menuju wilayah ini saat ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      active_incoming.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="py-3 px-3">
                            <div className="font-mono font-bold text-blue-400 text-xs">{b.booking_code}</div>
                            <div className="text-[11px] text-foreground font-semibold">{b.requester_name}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-bold text-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {b.origin_region?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground italic">"{b.purpose}"</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-semibold text-foreground">{b.vehicle?.name}</div>
                            <div className="text-[11px] text-muted-foreground">Supir: {b.driver?.name}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right">
                            <BookingStatusBadge status={b.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Recent Completed Trips */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Riwayat 10 Perjalanan Selesai Terakhir
              </CardTitle>
              <CardDescription className="text-xs">
                Log historis pemakaian armada yang berkaitan dengan {region.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                    <TableHead className="py-2.5 px-3">Kode Booking</TableHead>
                    <TableHead className="py-2.5 px-3">Pemohon & Divisi</TableHead>
                    <TableHead className="py-2.5 px-3">Rute Perjalanan</TableHead>
                    <TableHead className="py-2.5 px-3">Kendaraan & Supir</TableHead>
                    <TableHead className="py-2.5 px-3">Jadwal Pakai</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Odometer Akhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent_completed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        Belum ada riwayat perjalanan selesai di wilayah ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent_completed.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono font-bold text-amber-500 text-xs py-3 px-3">
                          {b.booking_code}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-xs">
                          <div className="font-bold text-foreground">{b.requester_name}</div>
                          <div className="text-[10px] text-muted-foreground">{b.requester_department}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-xs">
                          <span>{b.origin_region?.name} &rarr; <strong>{b.destination_region?.name}</strong></span>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-xs">
                          <div className="font-semibold text-foreground">{b.vehicle?.name}</div>
                          <div className="text-[10px] text-muted-foreground">Supir: {b.driver?.name}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-xs text-muted-foreground">
                          {new Date(b.start_date).toLocaleDateString('id-ID')} s/d {new Date(b.end_date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-right font-mono text-xs text-foreground">
                          {b.end_odometer ? `${Number(b.end_odometer).toLocaleString('id-ID')} km` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: FUEL & MAINTENANCE ──────────────────────────────── */}
        <TabsContent value="fuel-maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuel Logs */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-emerald-500" />
                  10 Log Pengisian Bahan Bakar Terbaru
                </CardTitle>
                <CardDescription className="text-xs">
                  Catatan transaksi konsumsi BBM armada di wilayah ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                      <TableHead className="py-2.5 px-3">Tanggal & Armada</TableHead>
                      <TableHead className="py-2.5 px-3">Volume & Biaya</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Odometer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuel_logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">
                          Belum ada catatan pengisian BBM di wilayah ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      fuel_logs.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-bold text-foreground">{f.vehicle?.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(f.log_date).toLocaleDateString('id-ID')} &middot; {f.station_name || 'SPBU Pool'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-bold text-emerald-500">{formatRupiah(f.total_cost)}</div>
                            <div className="text-[10px] text-muted-foreground">{Number(f.liters).toLocaleString('id-ID')} Liter</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right font-mono text-xs text-foreground">
                            {f.odometer_at_fueling ? `${Number(f.odometer_at_fueling).toLocaleString('id-ID')} km` : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Service Logs */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  Jadwal & Riwayat Servis Pemeliharaan
                </CardTitle>
                <CardDescription className="text-xs">
                  Monitoring pemeliharaan rutin dan perbaikan armada lokal.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px] uppercase font-bold">
                      <TableHead className="py-2.5 px-3">Tanggal & Armada</TableHead>
                      <TableHead className="py-2.5 px-3">Tipe & Bengkel</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Biaya Servis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {service_logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">
                          Belum ada riwayat servis untuk armada wilayah ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      service_logs.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="font-bold text-foreground">{s.vehicle?.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {new Date(s.service_date).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs">
                            <div className="capitalize font-semibold text-foreground">{s.service_type || 'Rutin'}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{s.workshop_name || 'Bengkel Pool Tambang'}</div>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right font-bold text-xs text-amber-500">
                            {formatRupiah(s.cost)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 4: TOP DESTINATIONS ANALYTICS ──────────────────────── */}
        <TabsContent value="destinations" className="space-y-6">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                Peringkat Rute & Destinasi Utama dari {region.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Statistik frekuensi perjalanan logistik dan pergerakan armada ke wilayah tujuan lain.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-6">
              {top_destinations.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  Belum ada catatan perjalanan yang berangkat dari wilayah ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="h-64">
                    <Bar data={destinationChartData} options={destinationChartOptions} />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Tabel Rincian Destinasi:
                    </h3>
                    <div className="divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden text-xs">
                      {top_destinations.map((dest, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-muted/30">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-foreground">{dest.destination_name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{dest.destination_code}</div>
                            </div>
                          </div>
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs font-bold">
                            {dest.total_trips} Perjalanan
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
