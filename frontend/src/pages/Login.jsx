import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, Sparkles, UserCheck } from 'lucide-react';

export const Login = () => {
  const { user, login, demoUsers, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSubmitting(true);
    await login(demoEmail, 'password123');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-3xl shadow-xl shadow-amber-500/20 mb-4">
            ⛏
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
            NICKEL FLEET SYSTEM
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Aplikasi Pemesanan & Monitoring Kendaraan Operasional Tambang Nikel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@tambang.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Memproses Masuk...' : 'Masuk ke Aplikasi'}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1-Klik Login Demo Reviewer:
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@tambang.com')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs flex items-center justify-between transition-all group"
              >
                <div>
                  <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                    Admin Pool Kendaraan
                  </p>
                  <p className="text-[11px] text-slate-400">admin@tambang.com (Input booking, armada, BBM)</p>
                </div>
                <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('approver1@tambang.com')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs flex items-center justify-between transition-all group"
              >
                <div>
                  <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                    Penyetujui Level 1 (Supervisor Operasional)
                  </p>
                  <p className="text-[11px] text-slate-400">approver1@tambang.com (Approval Tahap 1)</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('approver2@tambang.com')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs flex items-center justify-between transition-all group"
              >
                <div>
                  <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                    Penyetujui Level 2 (Kepala Pool / GM Tambang)
                  </p>
                  <p className="text-[11px] text-slate-400">approver2@tambang.com (Otorisasi Final)</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Sistem Terdistribusi: Kantor Pusat Jakarta · Kantor Cabang Kendari · 6 Blok Tambang Nikel
        </p>
      </div>
    </div>
  );
};
