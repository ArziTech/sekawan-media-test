import React, { useState } from 'react';
import { Menu, LogOut, Sparkles, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onMenuClick }) => {
  const { user, demoUsers, quickSwitchUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 lg:px-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Left section: Hamburger button for mobile */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-300">
            Wilayah Operasional: <span className="text-amber-400">1 HQ, 1 Cabang, 6 Tambang</span>
          </span>
        </div>
      </div>

      {/* Right section: Quick Demo Role Switcher & Logout */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Ganti Akun Demo:</span>
            <span className="text-amber-400 font-bold max-w-[120px] truncate">
              {user?.role === 'admin' ? 'Admin Pool' : `Approver L${user?.approval_tier}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Pilih Akun Demo Pengujian:
                </div>
                {demoUsers.map((dUser) => {
                  const isCurrent = dUser.id === user?.id;
                  return (
                    <button
                      key={dUser.id}
                      onClick={() => {
                        quickSwitchUser(dUser.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{dUser.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {dUser.role === 'admin'
                            ? 'Admin Pengelola Pool'
                            : `Approver Tier ${dUser.approval_tier} (${dUser.position})`}
                        </p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Keluar"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
