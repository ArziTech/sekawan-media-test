import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  LogIn,
  Lock,
  Mail,
  MapPin,
  Truck,
  AlertCircle,
  HelpCircle,
  Check,
  Copy,
  ArrowLeft,
  UserCheck,
  Info,
  X,
} from 'lucide-react';

export function LoginForm({ className, ...props }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);

  const demoAccounts = [
    {
      role: 'Admin Pool Kendaraan',
      badge: 'Admin',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      email: 'admin@tambang.com',
      password: 'password123',
      name: 'Admin Pool Kendaraan',
      desc: 'Kelola seluruh armada, booking, supir, input BBM, jadwal servis, export Excel, dan audit log.',
    },
    {
      role: 'Approver Level 1 (Supervisor)',
      badge: 'Approver L1',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      email: 'approver1@tambang.com',
      password: 'password123',
      name: 'Bambang Sutrisno, S.T.',
      desc: 'Persetujuan tahap pertama untuk verifikasi operasional dan justifikasi kebutuhan dinas.',
    },
    {
      role: 'Approver Level 2 (Kepala Pool & GM)',
      badge: 'Approver L2',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      email: 'approver2@tambang.com',
      password: 'password123',
      name: 'Ir. Hartono Gunawan, M.M.',
      desc: 'Otorisasi final tahap kedua alokasi armada sebelum keberangkatan kendaraan.',
    },
    {
      role: 'Approver Level 1 Site Pomalaa',
      badge: 'Approver Site',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      email: 'approver1.site@tambang.com',
      password: 'password123',
      name: 'Rahmat Hidayat, M.T.',
      desc: 'Penyetujui tingkat satu untuk area tambang nikel Site A (Pomalaa).',
    },
  ];

  const handleSelectAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setShowDemoModal(false);
  };

  const handleCopyCredentials = (acc, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Email: ${acc.email} | Password: ${acc.password}`);
    setCopiedAccount(acc.email);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  return (
    <div className={cn("flex flex-col gap-6 relative", className)} {...props}>
      <Card className=" p-0 border-border/80 shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left: Login Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header with Demo Credentials Info Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-lg shadow-sm">
                    ⛏
                  </div>
                  <div>
                    <span className="text-sm font-black tracking-wider uppercase block text-foreground">
                      Nickel Fleet
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest block">
                      Mining Dispatch System
                    </span>
                  </div>
                </div>


              </div>

              <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Masuk ke Portal Operasional
                </h1>
                <p className="text-xs text-muted-foreground">
                  Masukkan kredensial akun Anda untuk mengelola pemesanan armada dan persetujuan.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Alamat Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="nama@tambang.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      Kata Sandi
                    </label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <LogIn className="w-4 h-4" />
                  {submitting ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                </Button>
              </div>
              {/* Info '!' Demo Credentials Trigger */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(!showDemoModal)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                  title="Klik untuk melihat kredensial akun demo"
                >
                  <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                  <span>Demo Login</span>
                </button>

                {/* Hover tooltip hint */}
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-20 w-56 p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 shadow-xl pointer-events-none">
                  <p className="font-semibold text-amber-400">💡 Kredensial Uji Coba</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Klik tombol ini untuk melihat akun demo Admin & Approver dengan fitur auto-fill instan.
                  </p>
                </div>
              </div>
            </div>

          </form>

          {/* Right: Operational Showcase Panel */}
          <div className="relative hidden md:flex flex-col justify-between p-8 bg-zinc-900 text-zinc-100 border-l border-border/60">
            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Truck className="w-3.5 h-3.5" />
                Sistem Pemantauan Terpadu
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
                Manajemen Logistik & Armada Tambang Nikel Terdistribusi
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mengoordinasikan mobilitas angkutan orang dan barang di seluruh wilayah operasional dengan transparansi audit trail dan alur persetujuan bertingkat.
              </p>
            </div>

            <div className="space-y-3 relative z-10 pt-6">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Cakupan Wilayah Operasional:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-amber-400 font-bold block">1 Kantor Pusat</span>
                  Jakarta Selatan
                </div>
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-amber-400 font-bold block">1 Kantor Cabang</span>
                  Kendari, Sultra
                </div>
                <div className="col-span-2 p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-amber-400 font-bold block">6 Blok Tambang Nikel</span>
                  Pomalaa, Morowali, Konawe, Kolaka, Weda Bay Halmahera, Sorowako
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Modal / Popover: Demo Credentials & Disclaimer ───────────────── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-card border border-border/90 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-foreground">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Kredensial Demo & Akun Pengujian</h3>
                  <p className="text-[11px] text-muted-foreground">Pilih peran akun untuk mengisi form login secara otomatis</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowDemoModal(false)}
                className="rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Disclaimer Box */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Disclaimer Evaluasi Rekrutmen:
              </span>
              <p className="text-[11px] text-amber-500/90">
                Informasi kredensial ini disediakan secara terbuka untuk mempermudah reviewer & tim rekrutmen <strong>PT Sekawan Media Informatika</strong> dalam mengevaluasi fitur otorisasi multi-role (Admin Pool & Multi-Level Approver).
              </p>
            </div>

            {/* Account List Cards */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  className="p-3 rounded-xl border border-border/70 bg-muted/30 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={acc.badgeColor}>{acc.badge}</Badge>
                      <span className="text-xs font-bold text-foreground">{acc.name}</span>
                    </div>
                    {/* <p className="text-[11px] text-muted-foreground line-clamp-1">{acc.desc}</p> */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <span>Email: <strong className="text-foreground">{acc.email}</strong></span>
                      <span>&middot;</span>
                      <span>Pass: <strong className="text-foreground">{acc.password}</strong></span>
                    </div>
                  </div>


                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDemoModal(false)}
                className="h-8 text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
