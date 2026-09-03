import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Code2,
  Server,
  CheckSquare,
  Sparkles,
  GitBranch,
  Compass,
  Activity,
  KeyRound,
  Globe,
  ExternalLink,
} from 'lucide-react';
import logoSekawan from '@/assets/sekawan-media-logo.png';
import { FeaturesSectionWithHoverEffects } from '@/components/ui/feature-section-with-hover-effects';
import { HeroSectionOne } from '@/components/ui/hero-section-demo-1';
import { GlassmorphismPortfolioBlock } from '@/components/ui/glassmorphism-portfolio-block-shadcnui';
import activityDiagramImg from '@/assets/activity-diagram.png';
import erdImg from '@/assets/erd.png';

export const LandingPage = () => {
  const { user } = useAuth();
  const [activeDiagramStep, setActiveDiagramStep] = useState(1);

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

  // Tech Stack Data (Actual Installed Versions)
  const techStack = [
    {
      category: 'Backend Core & API Engine',
      icon: Server,
      items: [
        { name: 'Laravel Framework', version: 'v13.30.1', desc: 'REST API Engine, Form Request Validation, Eloquent ORM & Activity Logging' },
        { name: 'PHP Runtime', version: 'v8.4.25', desc: 'Modern typed PHP 8.4 engine running in isolated Docker container' },
        { name: 'MySQL Database', version: 'v8.0', desc: 'Relational data store with InnoDB foreign key integrity constraints' },
        { name: 'Laravel Sanctum & Excel', version: 'v4.0 & v5.9', desc: 'Secure token authentication & PhpSpreadsheet dynamic .xlsx generator' },
      ],
    },
    {
      category: 'Frontend Single Page Application',
      icon: Code2,
      items: [
        { name: 'React.js & Vite', version: 'v19.2.8 (Vite v8.2.2)', desc: 'Single Page Application architecture with fast HMR & React Router v7' },
        { name: 'Tailwind CSS & Motion', version: 'v4.3.3 (Motion v13.2.0)', desc: 'Tailwind v4 styling system with industrial nickel theme & motion animations' },
        { name: 'TanStack Query & Table', version: 'v5.102.8 & v9.2.4', desc: 'Asynchronous server state caching, auto-refetch, and data table management' },
        { name: 'Chart.js & React Hook Form', desc: 'Interactive telemetry charts & schema-driven client validation with shadcn UI' },
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

              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black tracking-wider uppercase text-foreground leading-tight flex items-center gap-1.5">
                  NICKEL FLEET
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            {user ? (
              <Link
                to={user.role === 'approver' ? '/approvals' : '/dashboard'}
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                )}
              >
                <LayoutDashboardIcon className="w-3.5 h-3.5" />
                <span>{user.role === 'approver' ? 'Portal Persetujuan' : 'Buka Dashboard'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                )}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Masuk Portal</span>
              </Link>

            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section (Aceternity Animated Hero with Mining Theme) ──── */}
      <section id="overview" className="relative border-b border-border/60 bg-gradient-to-b from-background via-muted/10 to-background">
        <HeroSectionOne />
      </section>

      {/* ─── Section: Fitur Utama & Keunggulan Sistem (Hover Effects Grid) ─ */}
      <section id="features" className="py-20 border-b border-border/60 bg-muted/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Sparkles className="w-4 h-4" />
              <span>Kapabilitas & Fitur Unggulan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Arsitektur Fitur & Pemantauan Armada Modern
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Dirancang untuk memenuhi seluruh standar operasional industri pertambangan nikel, memastikan transparansi alokasi armada, dan akurasi pelaporan terpusat.
            </p>
          </div>

          <FeaturesSectionWithHoverEffects />
        </div>
      </section>


      {/* ─── Section: Activity Diagram (Interactive Workflow) ──────────────── */}
      <section id="activity-diagram" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
              Diagram swimlane alur otorisasi berjenjang (Admin Pool, Approver Level 1, dan Approver Level 2) serta simulator interaktif logika validasi pada setiap siklus pemesanan.
            </p>
          </div>

          {/* Unified Two-Column Layout: Left = Activity Diagram, Right = Stepper & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Visual Activity Diagram */}

            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Stepper Tabs */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {diagramSteps.map((step) => {
                  const isActive = activeDiagramStep === step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveDiagramStep(step.id)}
                      className={cn(
                        "p-2 sm:p-2.5 rounded-xl text-left border transition-all text-xs font-medium flex flex-col justify-between items-stretch cursor-pointer",
                        isActive
                          ? "bg-amber-500/10 border-amber-500/50 text-foreground ring-1 ring-amber-500/30"
                          : "bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-500">Step {step.id}</span>
                        {isActive && <ChevronRight className="w-3 h-3 text-amber-500" />}
                      </div>
                      <div className="font-bold text-[11px] sm:text-xs truncate w-full mt-1">{step.title.split('. ')[1]}</div>
                      <div className="text-[10px] text-muted-foreground truncate w-full hidden sm:block">{step.actor}</div>
                    </button>
                  );
                })}
              </div>

              {/* Step Inspector Card */}
              {(() => {
                const current = diagramSteps.find((s) => s.id === activeDiagramStep) || diagramSteps[0];
                return (
                  <Card className="border-border/80 flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-card to-card/70">
                    <CardHeader className="border-b border-border/60 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={current.badgeColor}>
                              Status: {current.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">&middot;</span>
                            <span className="text-xs font-semibold text-foreground">Aktor: {current.actor}</span>
                          </div>
                          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                            {current.title}
                          </CardTitle>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60 shrink-0 self-start sm:self-auto">
                          {current.systemOutput}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6 space-y-5 flex-1">
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {current.description}
                      </p>

                      <div className="space-y-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                          Rincian Logika & Operasional Tahap Ini:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {current.actionDetail.map((act, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-start gap-2.5">
                              <CheckSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-foreground/90 leading-relaxed">{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
            {/* Right Column: Interactive Stepper & Step Inspector */}


            <div className="lg:col-span-5 flex flex-col rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                <div className="text-left space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Swimlane Workflow
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    Admin &middot; Approver 1 &middot; Approver 2
                  </p>
                </div>
                <a
                  href="/activity-diagram.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'text-xs font-semibold gap-1.5 h-8 px-2.5 shrink-0'
                  )}
                >
                  <span>Resolusi Penuh</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex-1 w-full flex items-center justify-center bg-white dark:bg-white rounded-xl p-3 border border-border/40 overflow-hidden">
                <img
                  src={activityDiagramImg}
                  alt="Activity Diagram Alur Pemesanan dan Persetujuan Armada Tambang"
                  className="w-full h-auto max-h-[640px] object-contain mx-auto transition-transform hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: PHYSICAL DATA MODEL (PDM / ERD) ────────────────────── */}
      <section id="pdm-section" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-3 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                <Database className="w-4 h-4" />
                <span>Physical Data Model & ERD</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Struktur Skema Basis Data Relasional (MySQL)
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Diagram relasi 10 tabel basis data ternormalisasi dirancang untuk keutuhan referensial (FK constraints), indeks performa, dan pencatatan audit log secara menyeluruh.
              </p>
            </div>
            <a
              href="/erd.png"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'text-xs font-semibold gap-1.5 self-start sm:self-auto shrink-0'
              )}
            >
              <span>Buka Resolusi Penuh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ERD Diagram Container */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 space-y-4">
            <div className="w-full flex justify-center bg-white dark:bg-white rounded-xl p-3 sm:p-6 border border-border/40 overflow-x-auto">
              <img
                src={erdImg}
                alt="Entity Relationship Diagram (ERD) Sistem Pemesanan Kendaraan Tambang"
                className="w-full h-auto max-w-6xl object-contain mx-auto transition-transform hover:scale-[1.01]"
              />
            </div>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {techStack.map((group, idx) => {
              const Icon = group.icon;
              return (
                <Card key={idx} className="border-border/80 bg-card flex flex-col">
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
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-start">
                    {group.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="p-3 rounded-xl bg-muted/40 border w-full border-border/50 space-y-1 text-left">
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

      {/* ─── Section: Tentang Saya / Profil Pengembang (Glassmorphism Portfolio Block) ── */}
      <section id="about" className="py-16 md:py-24 border-b border-border/60 bg-muted/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlassmorphismPortfolioBlock />
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
                  className="h-14 w-auto object-contain dark:bg-white px-4 py-2"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Aplikasi ini dikembangkan khusus sebagai hasil pengerjaan <strong className="text-foreground">Technical Test - Fullstack Developer (Intern)</strong> pada <strong className="text-foreground">PT Sekawan Media Informatika</strong>.
              </p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                  <a href="https://www.sekawanmedia.co.id" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">
                    www.sekawanmedia.co.id
                  </a>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Developed by <a href="https://gunawan05.pro" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-amber-500 underline underline-offset-2">Gunawan</a> &middot; Portfolio: <a href="https://gunawan05.pro" target="_blank" rel="noopener noreferrer" className="font-mono text-amber-500 hover:underline">https://gunawan05.pro</a>
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
