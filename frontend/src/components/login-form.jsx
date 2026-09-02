import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, LogIn, Lock, Mail, MapPin, Truck } from 'lucide-react';

export function LoginForm({ className, ...props }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border/80 shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left: Login Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-10 flex flex-col justify-between">
            <div className="space-y-6">
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
                  className="w-full h-11 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  {submitting ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                </Button>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/60">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Otorisasi Berjenjang: Admin Pool & Approver L1/L2</span>
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
    </div>
  );
}
