import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [recent, setRecent] = useState({ recent_bookings: [], upcoming_services: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes, recentRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
          api.get('/dashboard/recent'),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (chartsRes.data.success) setChartsData(chartsRes.data.data);
        if (recentRes.data.success) setRecent(recentRes.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
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
        bodyColor: '#fafafa',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a1a1aa', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a1a1aa', font: { size: 11 }, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  // Chart 2: Fleet Distribution (Doughnut Chart)
  const fleetDist = chartsData?.fleet_distribution || {};
  const fleetChartData = {
    labels: [
      'Angkutan Orang (Milik)',
      'Angkutan Orang (Sewa)',
      'Angkutan Barang (Milik)',
      'Angkutan Barang (Sewa)',
    ],
    datasets: [
      {
        data: [
          fleetDist.passenger_owned || 0,
          fleetDist.passenger_rented || 0,
          fleetDist.cargo_owned || 0,
          fleetDist.cargo_rented || 0,
        ],
        backgroundColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#f43f5e'],
        borderColor: '#18181b',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const fleetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#d4d4d8',
          padding: 12,
          font: { size: 11 },
          usePointStyle: true,
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
  };

  // Chart 3: Fuel Trends (Line Chart)
  const fuelChartData = {
    labels: chartsData?.fuel_trend?.labels || [],
    datasets: [
      {
        label: 'Konsumsi BBM (Liter)',
        data: chartsData?.fuel_trend?.liters || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Biaya BBM (Juta Rp)',
        data: chartsData?.fuel_trend?.cost_millions || [],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const fuelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#d4d4d8', usePointStyle: true, font: { size: 11 } },
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
        ticks: { color: '#a1a1aa', font: { size: 11 } },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#10b981', font: { size: 11 } },
        title: { display: true, text: 'Liter', color: '#10b981' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#f59e0b', font: { size: 11 } },
        title: { display: true, text: 'Juta Rp', color: '#f59e0b' },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
              Monitoring Operasional Tambang
            </span>
            <span className="text-xs text-muted-foreground">&middot;</span>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Kendaraan & Logistik
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan ketersediaan armada, status persetujuan berjenjang, dan efisiensi konsumsi bahan bakar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="default" size="sm" className="h-9 px-4 font-bold text-xs">
            <Link to="/bookings">
              <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
              Kelola Pemesanan
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs">
            <Link to="/reports">Lihat Laporan</Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Menunggu Approval
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.bookings?.pending_approval || 0}
            </div>
            <p className="text-[11px] text-amber-500 font-medium mt-1">
              Alur persetujuan Level 1 & Level 2
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Active Trips */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sedang Beroperasi
            </CardTitle>
            <Truck className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.bookings?.active_trips || 0}{' '}
              <span className="text-xs font-normal text-muted-foreground">unit</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stats?.bookings?.completed_trips || 0} perjalanan telah selesai
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Fleet Availability */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Kesiapan Armada
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.fleet?.available || 0}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                / {stats?.fleet?.total || 0} unit
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">{stats?.fleet?.owned || 0} Milik</span>
              <span>&middot;</span>
              <span className="text-cyan-500 font-medium">{stats?.fleet?.rented || 0} Sewa</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Monthly Fuel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Konsumsi BBM Bulan Ini
            </CardTitle>
            <Fuel className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.fuel?.monthly_liters ? Number(stats.fuel.monthly_liters).toLocaleString('id-ID') : 0}{' '}
              <span className="text-xs font-normal text-muted-foreground">Liter</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-500 mt-1">
              Rp {stats?.fuel?.monthly_cost ? Number(stats.fuel.monthly_cost).toLocaleString('id-ID') : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Vehicle Usage Frequency */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-bold">Frekuensi Pemakaian Kendaraan</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tren frekuensi pemesanan kendaraan dinas per bulan (6 bulan terakhir)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-72">
              <Bar data={usageChartData} options={usageChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Fleet Composition */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-bold">Komposisi Armada Tambang</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Angkutan Orang vs Barang & Milik Sendiri vs Sewa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-72">
              <Doughnut data={fleetChartData} options={fleetChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Fuel Consumption & Cost Trend */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-sm font-bold">Tren Konsumsi BBM & Biaya Operasional</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Monitoring volume bahan bakar dan estimasi beban biaya bulanan armada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <Line data={fuelChartData} options={fuelChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables: Recent Bookings & Upcoming Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-500" />
                Pemesanan Terkini
              </CardTitle>
              <CardDescription className="text-xs">Daftar transaksi pemesanan terbaru</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-400">
              <Link to="/bookings">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.recent_bookings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Belum ada data pemesanan.</p>
              ) : (
                recent.recent_bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-3 hover:border-border transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {b.booking_code}
                        </span>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-1 truncate">
                        {b.requester_name} &middot; <span className="text-muted-foreground">{b.requester_department}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {b.vehicle?.name} &middot; {b.origin_region?.name} &rarr; {b.destination_region?.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0 text-xs text-muted-foreground">
                      {new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Jadwal Servis Terdekat
              </CardTitle>
              <CardDescription className="text-xs">Armada dalam antrean perawatan</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-400">
              <Link to="/service-logs">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.upcoming_services.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Tidak ada jadwal servis yang menunggu.</p>
              ) : (
                recent.upcoming_services.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-3 hover:border-border transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <VehicleStatusBadge status="in_service" />
                        <span className="text-xs font-bold text-foreground">{s.vehicle?.name}</span>
                        <span className="text-[11px] text-muted-foreground">({s.vehicle?.license_plate})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        Bengkel: {s.workshop_name} &middot; Tipe: {s.service_type}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-500 block">
                        {new Date(s.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">{s.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
