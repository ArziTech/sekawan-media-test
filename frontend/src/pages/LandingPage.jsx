import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Truck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  MapPin,
  Database,
  Code2,
  Server,
  CheckSquare,
  Sparkles,
  GitBranch,
  KeyRound,
  Cpu,
  Compass,
  Activity,
} from 'lucide-react';
import logoSekawan from '@/assets/sekawan-media-logo.png';

export const LandingPage = () => {
  const { user } = useAuth();
  const [activeDiagramStep, setActiveDiagramStep] = useState(1);
  const [activePdmTable, setActivePdmTable] = useState('bookings');

  // Activity Diagram Steps Data
  const diagramSteps = [
    {
      id: 1,
      title: '1. Pengajuan Pemesanan',
      actor: 'Admin Pool Kendaraan',
      status: 'pending_level_1',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      description: 'Admin memasukkan reservasi kendaraan baru, memilih jenis kendaraan (Milik/Sewa, Angkutan Orang/Barang), menugaskan supir yang tersedia, serta menentukan Atasan Level 1 & Level 2 yang berwenang.',
      actionDetail: [
        'Formulir input booking dengan validasi tanggal & kapasitas',
        'Filter armada tersedia & bebas jadwal servis pada tanggal terkait',
        'Penetapan rantai otorisasi bertingkat: Approver Level 1 & Level 2',
        'Pencatatan awal pada tabel `bookings` dan trigger status `pending_level_1`',
      ],
      systemOutput: 'Tercatat di `activity_logs` sebagai aksi "booking_create"',
    },
    {
      id: 2,
      title: '2. Persetujuan Level 1',
      actor: 'Supervisor / Atasan Unit (L1)',
      status: 'pending_level_2 / rejected',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Penyetujui Tingkat Pertama melakukan verifikasi urgensi dinas operasional dan rute perjalanan. Approver dapat memberikan keputusan Setuju (Approve) atau Tolak (Reject) disertai catatan resmi.',
      actionDetail: [
        'Notifikasi antrean persetujuan pada portal Approver L1',
        'Pemeriksaan justifikasi keperluan pemakaian kendaraan',
        'Jika DISETUJUI: State beralih ke `pending_level_2` (Eskalasi ke Level 2)',
        'Jika DITOLAK: State berubah menjadi `rejected` (Selesai/Batal)',
      ],
      systemOutput: 'Tercatat di `activity_logs` sebagai aksi "approval_l1"',
    },
    {
      id: 3,
      title: '3. Otorisasi Final Level 2',
      actor: 'Kepala Pool / GM Tambang (L2)',
      status: 'approved / rejected',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      description: 'Penyetujui Tingkat Kedua melakukan otorisasi final alokasi aset tambang. Setelah disetujui pada tahap ini, pemesanan kendaraan resmi disahkan dan siap untuk diberangkatkan.',
      actionDetail: [
        'Hanya dapat diproses setelah lolos verifikasi Level 1 (Sekuensial Berjenjang)',
        'Otorisasi kebijakan penggunaan bahan bakar & rute antar-wilayah',
        'Jika DISETUJUI: State beralih ke `approved` (Siap Berangkat)',
        'Jika DITOLAK: State berubah menjadi `rejected`',
      ],
      systemOutput: 'Tercatat di `activity_logs` sebagai aksi "approval_l2"',
    },
    {
      id: 4,
      title: '4. Dispatch & Keberangkatan',
      actor: 'Admin Pool & Driver',
      status: 'in_use',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Admin mengonfirmasi keberangkatan armada dengan menekan tombol "Mulai Perjalanan". Status kendaraan dan supir secara real-time berubah menjadi aktif bertugas di lapangan.',
      actionDetail: [
        'Pencatatan Odometer awal keberangkatan',
        'Status pemesanan beralih menjadi `in_use`',
        'Armada & Driver dikunci agar tidak dapat dipesan ganda (Collision prevention)',
      ],
      systemOutput: 'Tercatat di `activity_logs` sebagai aksi "trip_start"',
    },
    {
      id: 5,
      title: '5. Selesai & Audit Trail',
      actor: 'Admin Pool & Sistem',
      status: 'completed',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Kendaraan kembali ke pool, Admin memasukkan pembacaan odometer akhir. Sistem menghitung total jarak tempuh, memperbarui status armada menjadi siap pakai kembali, dan merekam audit log.',
      actionDetail: [
        'Input Odometer akhir & penghitungan jarak tempuh aktual (KM)',
        'Status pemesanan menjadi `completed`',
        'Armada & Driver kembali ke status `available`',
        'Data masuk ke rekapitulasi grafik analitik dan laporan Excel',
      ],
      systemOutput: 'Tercatat di `activity_logs` sebagai aksi "trip_complete"',
    },
  ];

  // PDM Tables Data
  const pdmTables = {
    bookings: {
      name: 'bookings',
      desc: 'Tabel transaksi utama pemesanan kendaraan dinas operasional.',
      columns: [
        { name: 'id', type: 'BIGINT UNSIGNED', key: 'PK', desc: 'Primary Key auto-increment' },
        { name: 'booking_code', type: 'VARCHAR(30)', key: 'UNI', desc: 'Kode unik pemesanan (format: TRP-YYYYMM-XXXX)' },
        { name: 'requester_name', type: 'VARCHAR(100)', desc: 'Nama pegawai pemesan' },
        { name: 'vehicle_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke vehicles.id' },
        { name: 'driver_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke drivers.id' },
        { name: 'origin_region_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke regions.id (Lokasi Asal)' },
        { name: 'destination_region_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke regions.id (Lokasi Tujuan)' },
        { name: 'start_date', type: 'DATE', desc: 'Tanggal mulai dinas' },
        { name: 'end_date', type: 'DATE', desc: 'Tanggal perkiraan selesai' },
        { name: 'status', type: 'ENUM', desc: 'draft, pending_level_1, pending_level_2, approved, rejected, in_use, completed, cancelled' },
        { name: 'current_approval_level', type: 'TINYINT', desc: 'Tingkat approval aktif (1, 2, atau 0 saat selesai)' },
        { name: 'start_odometer', type: 'INT UNSIGNED', desc: 'KM awal saat mulai jalan' },
        { name: 'end_odometer', type: 'INT UNSIGNED', desc: 'KM akhir saat kepulangan' },
      ],
      relations: ['vehicles (N:1)', 'drivers (N:1)', 'regions (N:1)', 'booking_approvals (1:N)'],
    },
    booking_approvals: {
      name: 'booking_approvals',
      desc: 'Tabel jejak audit otorisasi persetujuan berjenjang per tingkat.',
      columns: [
        { name: 'id', type: 'BIGINT UNSIGNED', key: 'PK', desc: 'Primary Key auto-increment' },
        { name: 'booking_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke bookings.id' },
        { name: 'approver_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke users.id (Penyetujui)' },
        { name: 'level', type: 'TINYINT', desc: 'Tingkat persetujuan: 1 (L1) atau 2 (L2)' },
        { name: 'status', type: 'ENUM', desc: 'pending, approved, rejected' },
        { name: 'notes', type: 'TEXT', desc: 'Catatan/alasan persetujuan atau penolakan' },
        { name: 'action_at', type: 'TIMESTAMP', desc: 'Waktu eksekusi keputusan approval' },
      ],
      relations: ['bookings (N:1)', 'users (N:1)'],
    },
    vehicles: {
      name: 'vehicles',
      desc: 'Tabel inventaris armada angkutan orang & barang (milik vs sewa).',
      columns: [
        { name: 'id', type: 'BIGINT UNSIGNED', key: 'PK', desc: 'Primary Key auto-increment' },
        { name: 'license_plate', type: 'VARCHAR(20)', key: 'UNI', desc: 'Nomor plat registrasi kendaraan' },
        { name: 'name', type: 'VARCHAR(100)', desc: 'Nama/model unit (e.g., Hilux 4x4, Scania Dump Truck)' },
        { name: 'type', type: 'ENUM', desc: 'passenger (orang) atau cargo (barang)' },
        { name: 'ownership', type: 'ENUM', desc: 'owned (milik perusahaan) atau rented (sewa vendor)' },
        { name: 'rental_company_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke rental_companies.id (opsional)' },
        { name: 'region_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Homebase wilayah armada (regions.id)' },
        { name: 'status', type: 'ENUM', desc: 'available, in_use, in_service, decommissioned' },
        { name: 'fuel_consumption_rate', type: 'DECIMAL(4,2)', desc: 'Rasio konsumsi BBM (KM/Liter)' },
      ],
      relations: ['regions (N:1)', 'rental_companies (N:1)', 'bookings (1:N)', 'fuel_logs (1:N)', 'service_logs (1:N)'],
    },
    activity_logs: {
      name: 'activity_logs',
      desc: 'Tabel audit trail aplikasi untuk merekam setiap aktivitas pengguna.',
      columns: [
        { name: 'id', type: 'BIGINT UNSIGNED', key: 'PK', desc: 'Primary Key auto-increment' },
        { name: 'user_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke users.id (pelaku aksi)' },
        { name: 'action', type: 'VARCHAR(50)', desc: 'Nama aksi: login, booking_create, approval_l1, trip_start, dll' },
        { name: 'module', type: 'VARCHAR(50)', desc: 'Modul sistem: auth, bookings, approvals, fleet, reports' },
        { name: 'description', type: 'VARCHAR(255)', desc: 'Deskripsi detail aksi yang dilakukan' },
        { name: 'payload', type: 'JSON', desc: 'Data snapshot konteks / perubahan dalam JSON' },
        { name: 'ip_address', type: 'VARCHAR(45)', desc: 'Alamat IP pengguna' },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Waktu presisi pencatatan aktivitas' },
      ],
      relations: ['users (N:1)'],
    },
    fuel_logs: {
      name: 'fuel_logs',
      desc: 'Tabel pencatatan transaksi konsumsi bahan bakar (BBM).',
      columns: [
        { name: 'id', type: 'BIGINT UNSIGNED', key: 'PK', desc: 'Primary Key auto-increment' },
        { name: 'vehicle_id', type: 'BIGINT UNSIGNED', key: 'FK', desc: 'Relasi ke vehicles.id' },
        { name: 'liters', type: 'DECIMAL(8,2)', desc: 'Volume pengisian bahan bakar (Liter)' },
        { name: 'cost', type: 'DECIMAL(12,2)', desc: 'Total biaya pembelian BBM (Rupiah)' },
        { name: 'odometer_reading', type: 'INT UNSIGNED', desc: 'KM kendaraan saat pengisian' },
        { name: 'refuel_date', type: 'DATE', desc: 'Tanggal pengisian BBM' },
      ],
      relations: ['vehicles (N:1)'],
    },
  };

  // Requirement Compliance Matrix
  const requirements = [
    {
      id: 'A',
      title: 'Terdapat 2 Jenis User (Admin & Pihak yang Menyetujui)',
      category: 'Otorisasi & Akun',
      status: 'Terpenuhi 100%',
      detail: 'Admin Pool memiliki wewenang penuh manajemen armada, penugasan supir, dan pembuatan booking. Pihak Penyetujui (Approver) memiliki portal khusus persetujuan berjenjang Level 1 dan Level 2.',
      files: 'backend/app/Models/User.php · frontend/src/context/AuthContext.jsx',
    },
    {
      id: 'B',
      title: 'Admin Input Pemesanan, Driver & Approver',
      category: 'Manajemen Pemesanan',
      status: 'Terpenuhi 100%',
      detail: 'Admin dapat membuat reservasi kendaraan, memilih armada tersedia, menugaskan driver bebas tugas, serta menentukan atasan Level 1 & Level 2 secara fleksibel.',
      files: 'backend/app/Http/Controllers/Api/BookingController.php · frontend/src/pages/Bookings.jsx',
    },
    {
      id: 'C',
      title: 'Persetujuan Berjenjang Minimal 2 Level',
      category: 'Workflow Approval',
      status: 'Terpenuhi 100%',
      detail: 'Alur persetujuan sekuensial (Level 1 Supervisor Operasional dilanjutkan Level 2 Kepala Pool / GM Tambang). Persetujuan Level 2 hanya terbuka setelah Level 1 menyetujui.',
      files: 'backend/app/Http/Controllers/Api/ApprovalController.php · docs/alur-persetujuan-berjenjang.md',
    },
    {
      id: 'D',
      title: 'Pihak yang Menyetujui Melakukan Approval di Aplikasi',
      category: 'Portal Approver',
      status: 'Terpenuhi 100%',
      detail: 'Approver memiliki portal interaktif untuk memeriksa rute, justifikasi dinas, riwayat status, dan memberikan keputusan Setuju/Tolak disertai catatan/alasan.',
      files: 'frontend/src/pages/Approvals.jsx · backend/routes/api.php',
    },
    {
      id: 'E',
      title: 'Dashboard Grafik Pemakaian Kendaraan',
      category: 'Visualisasi Data',
      status: 'Terpenuhi 100%',
      detail: 'Dashboard analitik interaktif menampilkan 3 grafik utama: Bar Chart Tren Pemakaian Bulanan, Doughnut Chart Komposisi Armada (Orang vs Barang & Milik vs Sewa), dan Line Chart Konsumsi BBM & Biaya.',
      files: 'frontend/src/pages/Dashboard.jsx · Chart.js & React-Chartjs-2',
    },
    {
      id: 'F',
      title: 'Laporan Periodik Pemesanan & Export Excel (.xlsx)',
      category: 'Pelaporan & Ekspor',
      status: 'Terpenuhi 100%',
      detail: 'Filter rentang tanggal, wilayah/site tambang, tipe armada, dan status kepemilikan. Fitur export ke spreadsheet Excel resmi (.xlsx) menggunakan PhpSpreadsheet dengan formula kalkulasi otomatis.',
      files: 'backend/app/Http/Controllers/Api/ReportController.php · frontend/src/pages/Reports.jsx',
    },
    {
      id: 'G',
      title: 'File README Komprehensif & Panduan Penggunaan',
      category: 'Dokumentasi',
      status: 'Terpenuhi 100%',
      detail: 'Dokumentasi lengkap memuat daftar akun login, versi PHP, Laravel, React, database MySQL, Docker Compose guide, arsitektur sistem, dan panduan operasional.',
      files: 'README.md · docs/panduan-penggunaan.md · docs/arsitektur-aplikasi.md',
    },
    {
      id: 'Bonus-1',
      title: 'Physical Data Model (PDM) Berhubungan dengan Fitur Pemesanan',
      category: 'Bonus Point',
      status: 'Terpenuhi 100%',
      detail: 'Skema basis data 10 tabel relasional ternormalisasi (Users, Regions, Rental Companies, Vehicles, Drivers, Bookings, Booking Approvals, Fuel Logs, Service Logs, Activity Logs).',
      files: 'docs/skema-basis-data.md · backend/database/migrations/',
    },
    {
      id: 'Bonus-2',
      title: 'Activity Diagram untuk Fitur Pemesanan Kendaraan',
      category: 'Bonus Point',
      status: 'Terpenuhi 100%',
      detail: 'Diagram aktivitas terperinci yang menggambarkan transisi state pemesanan dari pengajuan, verifikasi L1, otorisasi L2, dispatch armada, hingga penyelesaian trip dan odometer.',
      files: 'docs/alur-persetujuan-berjenjang.md · Landing Page Interactive Diagram',
    },
    {
      id: 'Bonus-3',
      title: 'Log Aplikasi (Audit Trail) pada Setiap Proses',
      category: 'Bonus Point',
      status: 'Terpenuhi 100%',
      detail: 'ActivityLogger mencatat otomatis seluruh transaksi sistem: pembuatan booking, approval/rejection, dispatch, input BBM, jadwal servis, dan login/logout lengkap dengan IP & snapshot JSON.',
      files: 'backend/app/Services/ActivityLogger.php · frontend/src/pages/ActivityLogs.jsx',
    },
    {
      id: 'Bonus-4',
      title: 'UI/UX yang Baik, Modern & Responsive',
      category: 'Bonus Point',
      status: 'Terpenuhi 100%',
      detail: 'Antarmuka terkurasi dengan visual hierarchy industri pertambangan, dark/light theme toggle, badge status informatif, collapsible sidebar, dan responsif di seluruh resolusi layar.',
      files: 'frontend/src/index.css · Tailwind CSS v4 · Shadcn UI',
    },
  ];

  // Tech Stack Data
  const techStack = [
    {
      category: 'Backend Core',
      icon: Server,
      items: [
        { name: 'Laravel Framework', version: 'v13.x (13.30.1)', desc: 'REST API Engine, Form Request Validation, Eloquent ORM' },
        { name: 'PHP Language', version: 'v8.2+ / v8.3', desc: 'Modern typed PHP backend execution' },
        { name: 'MySQL Database', version: 'v8.0', desc: 'Relational database with InnoDB foreign key constraints' },
        { name: 'Laravel Sanctum', version: 'v4.x', desc: 'Secure token-based API authentication & session guard' },
        { name: 'PhpSpreadsheet', version: 'v5.9', desc: 'Server-side native Excel (.xlsx) report generation' },
      ],
    },
    {
      category: 'Frontend SPA',
      icon: Code2,
      items: [
        { name: 'React.js SPA', version: 'v19.x (Vite v8)', desc: 'Single Page Application architecture with fast HMR' },
        { name: 'Tailwind CSS', version: 'v4.x', desc: 'Modern styling system with industrial nickel theme palette' },
        { name: 'Chart.js & React-Chartjs-2', version: 'v4.x & v5.x', desc: 'High-performance interactive data visualization' },
        { name: 'Lucide React Icons', version: 'v1.x', desc: 'Clean, consistent interface iconography' },
        { name: 'Axios & Context API', version: 'v1.x', desc: 'Reactive state management and interceptor-based API client' },
      ],
    },
    {
      category: 'Infrastructure & DevOps',
      icon: Cpu,
      items: [
        { name: 'Docker Compose', version: 'v5.x / Compose v2', desc: 'One-command container orchestration' },
        { name: 'Nginx Web Server', version: 'Alpine Linux', desc: 'Reverse proxy & static asset delivery' },
        { name: 'PHP-FPM Alpine', version: 'PHP 8.2 Alpine', desc: 'Lightweight, optimized backend container' },
        { name: 'Database Seeder', version: 'Automated', desc: '16 vehicles, 8 drivers, 8 regions, realistic operational data' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500/20 selection:text-amber-500 font-sans antialiased">
      {/* ─── Top Navigation Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logoSekawan}
                alt="Logo Sekawan Media"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="h-5 w-px bg-border/80 hidden sm:block" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black tracking-wider uppercase text-foreground leading-tight flex items-center gap-1.5">
                  NICKEL FLEET
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                    TEST RESULT
                  </span>
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  PT Sekawan Media Informatika
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#overview" className="hover:text-foreground transition-colors">Overview</a>
            <a href="#requirements" className="hover:text-foreground transition-colors">Requirements</a>
            <a href="#activity-diagram" className="hover:text-foreground transition-colors">Activity Diagram</a>
            <a href="#pdm" className="hover:text-foreground transition-colors">Data Model (PDM)</a>
            <a href="#tech-stack" className="hover:text-foreground transition-colors">Tech Stack</a>
            <a href="#credits" className="hover:text-foreground transition-colors">Kredit</a>
          </nav>

          <div className="flex items-center gap-3">
            <ModeToggle />
            {user ? (
              <Link
                to="/dashboard"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'h-9 px-4 text-xs font-bold gap-1.5 shadow-sm bg-amber-500 text-slate-950 hover:bg-amber-400'
                )}
              >
                <LayoutDashboardIcon className="w-3.5 h-3.5" />
                <span>Buka Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'h-9 px-4 text-xs font-bold gap-1.5 shadow-sm bg-amber-500 text-slate-950 hover:bg-amber-400'
                )}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Masuk Portal</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section id="overview" className="relative pt-12 pb-20 overflow-hidden border-b border-border/60">
        {/* Subtle Ambient Mining Grid Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Technical Assessment &middot; Fullstack Developer Intern</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                  Monitoring & Pemesanan Armada Tambang Nikel Terdistribusi
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Solusi digital menyeluruh untuk koordinasi mobilitas angkutan orang & barang pada 8 wilayah operasional tambang (1 Kantor Pusat, 1 Kantor Cabang, dan 6 Blok Tambang) dengan sistem <strong className="text-foreground">Persetujuan Berjenjang 2 Level</strong>, pemantauan konsumsi BBM, jadwal servis, dan export laporan Excel.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 px-6 font-bold text-xs uppercase tracking-wider bg-amber-500 text-slate-950 hover:bg-amber-400 gap-2 shadow-lg shadow-amber-500/10"
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
                    "h-11 px-5 font-bold text-xs gap-2 border-border/80 hover:bg-muted/60"
                  )}
                >
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <span>Repository GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>

                <a
                  href="#activity-diagram"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "h-11 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  )}
                >
                  Lihat Diagram Alur &rarr;
                </a>
              </div>

              {/* Telemetry Operational Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-xl font-extrabold text-amber-500">8 Wilayah</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">1 HQ, 1 Cabang, 6 Site</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-xl font-extrabold text-foreground">16 Unit</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Angkutan Orang & Barang</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-xl font-extrabold text-emerald-500">2-Tier</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Multi-Level Approval</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-xl font-extrabold text-blue-500">100%</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Audit Trail Activity Log</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Operational Card Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/60 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Live Telemetry Preview
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500">
                    TRP-202609-0012
                  </Badge>
                </div>

                {/* Sample Booking Status Stream */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Rute Perjalanan</span>
                      <span className="font-bold text-foreground">Kendari (BC-KDR) &rarr; Pomalaa (SITE-POM)</span>
                    </div>
                    <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">In-Use</Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Armada Ditugaskan</span>
                      <span className="font-bold text-foreground">Toyota Hilux 4x4 Double Cabin (DT 8921 AB)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Milik Perusahaan</span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                    <span className="text-muted-foreground block text-[10px] uppercase">Status Persetujuan Berjenjang</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Level 1: Disetujui</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Level 2: Disetujui</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Credit Footer inside Showcase */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50">
                  <span>Candidate: <strong className="text-foreground">Gunawan</strong></span>
                  <span className="font-mono">Laravel 13 &middot; React 19</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section: Tentang Proyek & Requirements Compliance ─────────────── */}
      <section id="requirements" className="py-20 border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Compass className="w-4 h-4" />
              <span>Spesifikasi & Kepatuhan Soal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Pemenuhan Kebutuhan & Matriks Fitur Teknis
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Seluruh ketentuan soal utama (Soal a s/d g) dan instruksi penambahan poin (Instruksi a s/d d) telah diimplementasikan secara komprehensif pada arsitektur sistem.
            </p>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((req) => (
              <Card key={req.id} className="border-border/70 bg-card hover:border-border transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                      Poin {req.id}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {req.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground mt-2">
                    {req.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Kategori: {req.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs">
                  <p className="text-muted-foreground leading-relaxed">
                    {req.detail}
                  </p>
                  <div className="p-2 rounded bg-muted/40 font-mono text-[11px] text-muted-foreground truncate border border-border/50">
                    <span className="text-amber-500 font-semibold">Terkait: </span>
                    {req.files}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section: Activity Diagram (Interactive Workflow) ──────────────── */}
      <section id="activity-diagram" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Activity className="w-4 h-4" />
              <span>Activity Diagram & Alur Proses</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Alur Pemesanan & Persetujuan Berjenjang 2 Level
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Klik setiap tahapan di bawah untuk meninjau peran aktor, validasi sistem, transisi status, serta pencatatan audit log otomatis pada setiap siklus pemesanan.
            </p>
          </div>

          {/* Interactive Stepper Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {diagramSteps.map((step) => {
              const isActive = activeDiagramStep === step.id;
              return (
                <Button
                  key={step.id}
                  type="button"
                  variant="outline"
                  onClick={() => setActiveDiagramStep(step.id)}
                  className={cn(
                    "p-3 h-auto rounded-xl text-left border transition-all text-xs font-medium space-y-1.5 flex flex-col justify-between items-stretch cursor-pointer",
                    isActive
                      ? "bg-amber-500/10 border-amber-500/40 text-foreground ring-1 ring-amber-500/30"
                      : "bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-500">Step {step.id}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="font-bold text-xs truncate w-full">{step.title.split('. ')[1]}</div>
                  <div className="text-[10px] text-muted-foreground truncate w-full">{step.actor}</div>
                </Button>
              );
            })}
          </div>

          {/* Active Step Detailed Inspector */}
          {(() => {
            const current = diagramSteps.find((s) => s.id === activeDiagramStep) || diagramSteps[0];
            return (
              <Card className="border-border/80 shadow-xl overflow-hidden bg-gradient-to-b from-card to-card/70">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={current.badgeColor}>
                          Status: {current.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs font-semibold text-foreground">Aktor: {current.actor}</span>
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {current.title}
                      </CardTitle>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60 shrink-0">
                      {current.systemOutput}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    {current.description}
                  </p>

                  <div className="space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Rincian Logika & Operasional Tahap Ini:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {current.actionDetail.map((act, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs flex items-start gap-2.5">
                          <CheckSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Visual Activity Diagram Flowchart Representation */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-border/70 text-zinc-300 space-y-4 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
              <span className="font-bold flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                State Machine Diagram Transisi Status
              </span>
              <span>Sequential Multi-Level Engine</span>
            </div>
            <pre className="leading-relaxed whitespace-pre text-[11px] text-zinc-300">
{`[ADMIN POOL] ──► Input Booking ──► [pending_level_1]
                                          │
                                          ▼
                                [APPROVER LEVEL 1 (Supervisor)]
                                    ├─► [REJECT] ──────► [rejected] ──► (Selesai/Batal)
                                    │
                                    └─► [APPROVE] ─────► [pending_level_2]
                                                              │
                                                              ▼
                                                    [APPROVER LEVEL 2 (Head of Pool / GM)]
                                                        ├─► [REJECT] ──► [rejected] ──► (Selesai/Batal)
                                                        │
                                                        └─► [APPROVE] ─► [approved]
                                                                             │
                                                                             ▼
                                                                [ADMIN: Mulai Perjalanan]
                                                                             │
                                                                             ▼
                                                                        [in_use] (Armada & Driver Aktif)
                                                                             │
                                                                             ▼
                                                                [ADMIN: Selesai & Odometer]
                                                                             │
                                                                             ▼
                                                                        [completed] (Audit Recorded)`}
            </pre>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: PHYSICAL DATA MODEL (PDM) ─────────────────────────── */}
      <section id="pdm-section" className="py-16 sm:py-24 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Database className="w-3.5 h-3.5" />
              <span>Physical Data Model (PDM)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Struktur Skema Basis Data Relasional (MySQL)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Arsitektur basis data ternormalisasi dirancang untuk keutuhan referensial (FK constraints), indeks performa, dan pencatatan audit log secara menyeluruh.
            </p>
          </div>

          {/* Table Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(pdmTables).map((tblKey) => {
              const isActive = activePdmTable === tblKey;
              return (
                <Button
                  key={tblKey}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePdmTable(tblKey)}
                  className={cn(
                    "px-4 py-2 text-xs font-mono font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-500 shadow-sm"
                      : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {tblKey}
                </Button>
              );
            })}
          </div>

          {/* Active Table Viewer */}
          {(() => {
            const table = pdmTables[activePdmTable];
            return (
              <Card className="border-border/80 shadow-lg overflow-hidden bg-card">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-mono font-bold text-amber-500">
                        TABLE `{table.name}`
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        {table.desc}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Relasi:</span>
                      {table.relations.map((rel, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-mono border-border/80">
                          {rel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/50 text-[11px] text-muted-foreground uppercase border-b border-border/60">
                      <tr>
                        <th className="px-4 py-2.5">Field Name</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Key</th>
                        <th className="px-4 py-2.5">Keterangan / Fungsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {table.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-foreground">{col.name}</td>
                          <td className="px-4 py-2.5 text-amber-500">{col.type}</td>
                          <td className="px-4 py-2.5">
                            {col.key ? (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                col.key === 'PK' ? "bg-amber-500/20 text-amber-400" :
                                col.key === 'FK' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                              )}>
                                {col.key}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground font-sans">{col.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </section>

      {/* ─── Section: Tech Stack Specifications ────────────────────────────── */}
      <section id="tech-stack" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Code2 className="w-4 h-4" />
              <span>Teknologi & Stack</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Spesifikasi Teknologi & Arsitektur Sistem
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Kombinasi backend REST API Laravel 13.x yang tangguh dengan frontend Single Page Application (SPA) React 19 yang interaktif dan responsif.
            </p>
          </div>

          {/* Tech Stack Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {techStack.map((group, idx) => {
              const Icon = group.icon;
              return (
                <Card key={idx} className="border-border/80 bg-card flex flex-col justify-between">
                  <CardHeader className="border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">{group.category}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {group.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground">{item.name}</span>
                          <span className="font-mono text-[10px] text-amber-500 font-semibold">{item.version}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Section: Credits & Company Information Footer ─────────────────── */}
      <footer id="credits" className="py-16 bg-muted/40 text-foreground border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Company & Logo */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoSekawan}
                  alt="PT Sekawan Media Informatika Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Aplikasi ini dikembangkan khusus sebagai hasil pengerjaan <strong className="text-foreground">Technical Test - Fullstack Developer (Intern)</strong> pada <strong className="text-foreground">PT Sekawan Media Informatika</strong>.
              </p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Cluster Coding Factory, KEK Singhasari, Jl. Raya Klampok RT 04/RW 04, Desa Klampok, Kec. Singosari, Kab. Malang 65153
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                  <a href="https://www.sekawanmedia.co.id" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">
                    www.sekawanmedia.co.id
                  </a>
                </div>
              </div>
            </div>

            {/* Candidate Credit & Quick Links */}
            <div className="md:col-span-6 space-y-4 md:text-right flex flex-col md:items-end">
              <div className="p-4 rounded-xl bg-card border border-border/80 max-w-sm space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    G
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Developed By</span>
                    <span className="text-xs font-bold text-foreground">Gunawan</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Fullstack Developer Candidate &middot; Technical Recruitment Test 2026
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 gap-1.5"
                  )}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Masuk Portal Aplikasi
                </Link>
                <a
                  href="https://github.com/ArziTech/sekawan-media-test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "text-xs font-semibold gap-1.5"
                  )}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              &copy; 2026 PT Sekawan Media Informatika &middot; Developed by Gunawan
            </p>
            <p className="font-mono text-[11px]">
              Nickel Fleet Management System v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function LayoutDashboardIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
