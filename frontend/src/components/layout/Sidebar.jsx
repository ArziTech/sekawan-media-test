import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  Truck,
  Users,
  Fuel,
  Wrench,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, pendingCount = 0 }) => {
  const { user, isAdmin, isApprover } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'approver'],
    },
    {
      label: 'Pemesanan Kendaraan',
      path: '/bookings',
      icon: CalendarCheck,
      roles: ['admin', 'approver'],
    },
    {
      label: 'Portal Persetujuan',
      path: '/approvals',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500 text-slate-950',
      roles: ['admin', 'approver'],
    },
    {
      label: 'Armada Kendaraan',
      path: '/vehicles',
      icon: Truck,
      roles: ['admin'],
    },
    {
      label: 'Master Driver',
      path: '/drivers',
      icon: Users,
      roles: ['admin'],
    },
    {
      label: 'Konsumsi BBM',
      path: '/fuel-logs',
      icon: Fuel,
      roles: ['admin'],
    },
    {
      label: 'Jadwal & Riwayat Servis',
      path: '/service-logs',
      icon: Wrench,
      roles: ['admin'],
    },
    {
      label: 'Laporan & Export Excel',
      path: '/reports',
      icon: FileSpreadsheet,
      roles: ['admin', 'approver'],
    },
    {
      label: 'Log Aktivitas (Audit Trail)',
      path: '/activity-logs',
      icon: Activity,
      roles: ['admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              ⛏
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-wider block">
                NICKEL FLEET
              </span>
              <span className="text-[11px] font-medium text-amber-400/90 tracking-widest block uppercase">
                Mining Operations
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Operasional
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card Info at Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 m-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-400 truncate">
                  {user?.role === 'admin'
                    ? 'Admin Pool'
                    : `Approver L${user?.approval_tier || 1}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
