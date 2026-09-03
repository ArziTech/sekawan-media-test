import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  CalendarCheck,
  Clock,
  Truck,
  Fuel,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { BookingStatusBadge, VehicleStatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-all-data'],
    queryFn: async () => {
      const [statsRes, chartsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent'),
      ]);

      return {
        stats: statsRes.data?.data || null,
        chartsData: chartsRes.data?.data || null,
        recent: recentRes.data?.data || { recent_bookings: [], upcoming_services: [] },
      };
    },
  });

  const stats = dashboardData?.stats;
  const chartsData = dashboardData?.chartsData;
  const recent = dashboardData?.recent || { recent_bookings: [], upcoming_services: [] };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Memuat data monitoring armada...</p>
        </div>
      </div>
    );
  }

  // Chart 1: Usage Trend (Bar Chart)
  const usageChartData = {
    labels: chartsData?.usage_trend?.labels || [],
    datasets: [
      {
        label: 'Frekuensi Pemesanan',
        data: chartsData?.usage_trend?.datasets[0]?.data || [],
        backgroundColor: '#f59e0b',
        hoverBackgroundColor: '#fbbf24',
        borderRadius: 6,
        barPercentage: 0.55,
      },
    ],
  };

  const usageChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#71717a', font: { size: 10 }, stepSize: 1 },
      },
    },
  };

  // Chart 2: Fuel Trend (Line Chart)
  const fuelChartData = {
    labels: chartsData?.fuel_trend?.labels || [],
    datasets: [
      {
        label: 'Konsumsi BBM (Liter)',
        data: chartsData?.fuel_trend?.datasets[0]?.data || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#09090b',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const fuelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.parsed.y.toLocaleString('id-ID')} Liter`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#71717a',
          font: { size: 10 },
          callback: (value) => `${value} L`,
        },
      },
    },
  };

  // Chart 3: Fleet Status (Doughnut Chart)
  const fleetDistributionData = {
    labels: ['Tersedia', 'Sedang Digunakan', 'Dalam Servis'],
    datasets: [
      {
        data: [
          stats?.vehicles_available || 0,
          stats?.vehicles_in_use || 0,
          stats?.vehicles_in_service || 0,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  const kpis = [
    {
      title: 'Total Booking Aktif',
      value: stats?.total_bookings || 0,
      description: 'Pemesanan kendaraan dinas',
      icon: CalendarCheck,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Menunggu Persetujuan',
      value: stats?.pending_approvals || 0,
      description: 'Butuh otorisasi berjenjang',
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20',
      highlight: stats?.pending_approvals > 0,
    },
    {
      title: 'Kesiapan Armada',
      value: `${stats?.vehicles_available || 0} / ${stats?.total_vehicles || 0}`,
      description: `${stats?.vehicles_in_use || 0} jalan · ${stats?.vehicles_in_service || 0} servis`,
      icon: Truck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Konsumsi BBM Bulan Ini',
      value: `${stats?.monthly_fuel_liters?.toLocaleString('id-ID') || 0} L`,
      description: `Rp ${stats?.monthly_fuel_cost?.toLocaleString('id-ID') || 0}`,
      icon: Fuel,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Hero / Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Selamat Datang, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sistem Pemesanan & Monitoring Logistik Armada Tambang Terintegrasi (2 Tingkat Persetujuan).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </Button>

          {isAdmin ? (
            <Link
              to="/bookings"
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pemesanan</span>
            </Link>
          ) : (
            <Link
              to="/approvals"
              className={buttonVariants({ size: "sm" })}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Buka Portal Approval</span>
            </Link>
          )}
        </div>
      </div>

      {/* ─── Approver Alert Banner ─────────────────────────────────────── */}
      {!isAdmin && stats?.pending_approvals > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Ada Permohonan Menunggu Otorisasi Anda</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Terdapat <strong className="text-amber-500">{stats?.pending_approvals} pemesanan kendaraan</strong> yang memerlukan persetujuan tingkat Anda sebelum dapat beroperasi.
              </p>
            </div>
          </div>
          <Link
            to="/approvals"
            className={buttonVariants({ size: "sm" })}
          >
            Proses Sekarang &rarr;
          </Link>
        </div>
      )}

      {/* ─── KPI Metric Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              className={cn(
                "border-border/80 shadow-xs transition-all",
                kpi.highlight && "border-amber-500/50 ring-1 ring-amber-500/20"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                <div className={cn("p-1.5 rounded-lg border", kpi.bg)}>
                  <Icon className={cn("w-4 h-4", kpi.color)} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Charts Section ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Usage Trend */}
        <Card className="lg:col-span-2 border-border/80 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Tren Pemakaian Kendaraan
                </CardTitle>
                <CardDescription className="text-xs">
                  Frekuensi permohonan kendaraan dinas operasional dalam 6 bulan terakhir.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-64 w-full">
              <Bar data={usageChartData} options={usageChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Fleet Status Distribution */}
        <Card className="border-border/80 shadow-xs flex flex-col justify-between">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              Kesiapan Armada
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi status unit kendaraan saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex flex-col items-center justify-center flex-1">
            <div className="h-44 w-full relative flex items-center justify-center">
              <Doughnut data={fleetDistributionData} options={doughnutOptions} />
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-foreground">{stats?.total_vehicles || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Unit</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/60 text-center">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 block">{stats?.vehicles_available || 0}</span>
                <span className="text-[10px] text-muted-foreground">Tersedia</span>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-bold text-blue-400 block">{stats?.vehicles_in_use || 0}</span>
                <span className="text-[10px] text-muted-foreground">Dipakai</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs font-bold text-amber-400 block">{stats?.vehicles_in_service || 0}</span>
                <span className="text-[10px] text-muted-foreground">Servis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Fuel Consumption Trend */}
        <Card className="lg:col-span-3 border-border/80 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-emerald-500" />
                  Tren Konsumsi Bahan Bakar (BBM)
                </CardTitle>
                <CardDescription className="text-xs">
                  Monitoring volume konsumsi bahan bakar (Liter) per bulan untuk efisiensi logistik.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-60 w-full">
              <Line data={fuelChartData} options={fuelChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Tables Section ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2 border-border/80 shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-foreground">Permohonan Terbaru</CardTitle>
              <CardDescription className="text-xs">5 pengajuan kendaraan dinas terakhir</CardDescription>
            </div>
            <Link to="/bookings" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
              Lihat Semua &rarr;
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                  <TableHead className="py-2.5 px-4">No. Booking</TableHead>
                  <TableHead className="py-2.5 px-4">Pemohon</TableHead>
                  <TableHead className="py-2.5 px-4">Kendaraan</TableHead>
                  <TableHead className="py-2.5 px-4">Tujuan</TableHead>
                  <TableHead className="py-2.5 px-4 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {recent.recent_bookings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                      Belum ada permohonan pemesanan kendaraan.
                    </TableCell>
                  </TableRow>
                ) : (
                  recent.recent_bookings?.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 px-4 font-mono text-xs font-bold text-amber-500">
                        {b.booking_code}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs font-medium text-foreground">
                        {b.requester_name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                        {b.vehicle?.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                        {b.destination_region?.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <BookingStatusBadge status={b.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upcoming Maintenance */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Jadwal Servis Terdekat
              </CardTitle>
              <CardDescription className="text-xs">Armada dalam pemeliharaan</CardDescription>
            </div>
            {isAdmin && (
              <Link to="/service-logs" className="text-xs font-semibold text-amber-500 hover:underline">
                Kelola &rarr;
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {recent.upcoming_services?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Tidak ada armada yang memerlukan servis dalam waktu dekat.
              </p>
            ) : (
              recent.upcoming_services?.map((s) => (
                <div key={s.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{s.vehicle?.name}</span>
                    <span className="font-mono text-[10px] text-amber-500 font-bold">{s.vehicle?.license_plate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Tgl: {s.service_date}</span>
                    <span className="capitalize">{s.service_type}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Bengkel: {s.workshop_name}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
