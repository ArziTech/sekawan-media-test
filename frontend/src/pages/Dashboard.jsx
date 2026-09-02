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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ChartCard } from '../components/common/ChartCard';
import { BookingStatusBadge, VehicleStatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

// Register Chart.js components
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
  const { user, isApprover } = useAuth();
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Memuat data monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart 1: Vehicle Usage Frequency (Bar Chart)
  const usageChartData = {
    labels: chartsData?.usage_trend?.labels || [],
    datasets: [
      {
        label: 'Frekuensi Pemesanan',
        data: chartsData?.usage_trend?.datasets[0]?.data || [],
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        hoverBackgroundColor: 'rgba(251, 191, 36, 1)',
        borderRadius: 8,
      },
    ],
  };

  const usageChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 12 }, precision: 0 },
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
        backgroundColor: [
          '#3b82f6', // blue
          '#06b6d4', // cyan
          '#f59e0b', // amber
          '#ef4444', // rose
        ],
        borderColor: '#0f172a',
        borderWidth: 3,
        hoverOffset: 6,
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
          color: '#cbd5e1',
          padding: 16,
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 12,
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
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: 'Biaya BBM (Juta Rp)',
        data: chartsData?.fuel_trend?.cost_millions || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.35,
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
        labels: { color: '#cbd5e1', usePointStyle: true, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#10b981' },
        title: { display: true, text: 'Liter', color: '#10b981' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#f59e0b' },
        title: { display: true, text: 'Juta Rp', color: '#f59e0b' },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Dashboard Operasional Tambang
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Monitoring Armada Tambang Nikel
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Memantau aktivitas 1 Kantor Pusat, 1 Kantor Cabang, dan 6 Blok Tambang Nikel dengan alur persetujuan berjenjang.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/bookings"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              Kelola Pemesanan
            </Link>
            <Link
              to="/reports"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              Lihat Laporan
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Pending Approvals */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Menunggu Approval
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {stats?.bookings?.pending_approval || 0}
            </span>
            <span className="text-xs text-amber-400 font-medium">butuh tindakan</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Persetujuan berjenjang Level 1 & Level 2
          </p>
        </div>

        {/* Card 2: Active Trips */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sedang Berjalan
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {stats?.bookings?.active_trips || 0}
            </span>
            <span className="text-xs text-blue-400 font-medium">unit mobil aktif</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Total {stats?.bookings?.completed_trips || 0} perjalanan telah selesai
          </p>
        </div>

        {/* Card 3: Fleet Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kesiapan Armada
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {stats?.fleet?.available || 0}
            </span>
            <span className="text-xs text-slate-400">/ {stats?.fleet?.total || 0} unit tersedia</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
            <span className="text-emerald-400">{stats?.fleet?.owned || 0} Milik</span>
            <span>•</span>
            <span className="text-cyan-400">{stats?.fleet?.rented || 0} Sewa</span>
            <span>•</span>
            <span className="text-amber-400">{stats?.fleet?.in_service || 0} Servis</span>
          </div>
        </div>

        {/* Card 4: Fuel Cost This Month */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Konsumsi BBM Bulan Ini
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {stats?.fuel?.monthly_liters ? Number(stats.fuel.monthly_liters).toLocaleString('id-ID') : 0}
            </span>
            <span className="text-xs text-slate-400">Liter</span>
          </div>
          <p className="text-xs font-semibold text-emerald-400 mt-2">
            Rp {stats?.fuel?.monthly_cost ? Number(stats.fuel.monthly_cost).toLocaleString('id-ID') : 0}
          </p>
        </div>
      </div>

      {/* Visual Charts Grid (3 Main Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Vehicle Usage Frequency (Bar Chart) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Frekuensi Pemakaian Kendaraan"
            subtitle="Tren total frekuensi booking kendaraan dalam 6 bulan terakhir"
            icon={TrendingUp}
          >
            <div className="w-full h-72">
              <Bar data={usageChartData} options={usageChartOptions} />
            </div>
          </ChartCard>
        </div>

        {/* Chart 2: Fleet Distribution (Doughnut Chart) */}
        <div>
          <ChartCard
            title="Komposisi Armada"
            subtitle="Angkutan Orang vs Barang & Milik Sendiri vs Sewa"
            icon={Truck}
          >
            <div className="w-full h-72">
              <Doughnut data={fleetChartData} options={fleetChartOptions} />
            </div>
          </ChartCard>
        </div>

        {/* Chart 3: Fuel Consumption & Cost Trend (Line Chart) */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Tren Konsumsi BBM & Biaya Operasional"
            subtitle="Monitoring pemakaian bahan bakar armada dan estimasi biaya bulanan"
            icon={Fuel}
          >
            <div className="w-full h-80">
              <Line data={fuelChartData} options={fuelChartOptions} />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Quick Tables: Recent Bookings & Upcoming Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              Pemesanan Kendaraan Terkini
            </h3>
            <Link
              to="/bookings"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent.recent_bookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada data pemesanan.</p>
            ) : (
              recent.recent_bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {b.booking_code}
                      </span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="text-xs font-semibold text-white mt-1 truncate">
                      {b.requester_name} ({b.requester_department})
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {b.vehicle?.name} • {b.origin_region?.name} &rarr; {b.destination_region?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">
                      {new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Services */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Jadwal Servis Armada Mendatang
            </h3>
            <Link
              to="/service-logs"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent.upcoming_services.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Tidak ada jadwal servis yang menunggu.</p>
            ) : (
              recent.upcoming_services.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <VehicleStatusBadge status="in_service" />
                      <span className="text-xs font-bold text-white">{s.vehicle?.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      Bengkel: {s.workshop_name} • Tipe: {s.service_type}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-400 block">
                      {new Date(s.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">{s.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
