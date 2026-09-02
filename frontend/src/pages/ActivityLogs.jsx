import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Eye, Shield, Terminal } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';

export const ActivityLogs = () => {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  // Modal Detail Payload
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs', {
        params: {
          search: search || undefined,
          module: moduleFilter || undefined,
        },
      });

      if (res.data.success) {
        setLogs(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getModuleBadgeColor = (mod) => {
    switch (mod) {
      case 'bookings':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approvals':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'vehicles':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'drivers':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'fuel':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'service':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'auth':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-amber-400" />
            Log Aktivitas Aplikasi (Audit Trail)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rekam jejak audit keamanan dan pencatatan riwayat setiap proses operasional pada sistem.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Cari deskripsi log, nama user, alamat IP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">Semua Modul</option>
          <option value="bookings">Pemesanan (Bookings)</option>
          <option value="approvals">Persetujuan (Approvals)</option>
          <option value="vehicles">Armada Kendaraan</option>
          <option value="drivers">Driver</option>
          <option value="fuel">Konsumsi BBM</option>
          <option value="service">Servis Perawatan</option>
          <option value="auth">Autentikasi (Auth)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">Waktu (Timestamp)</th>
                <th className="py-4 px-4">Pengguna (User)</th>
                <th className="py-4 px-4">Modul</th>
                <th className="py-4 px-4">Aksi / Deskripsi Aktivitas</th>
                <th className="py-4 px-4">Alamat IP</th>
                <th className="py-4 px-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Belum ada log yang sesuai filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{log.user?.name || 'Sistem'}</p>
                      <p className="text-[10px] text-slate-400">{log.user?.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getModuleBadgeColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-200">
                      <span className="font-mono text-amber-400 text-[11px] block">{log.action}</span>
                      <p className="text-xs text-slate-300 mt-0.5">{log.description}</p>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      {log.ip_address || '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {log.payload ? (
                        <button
                          onClick={() => handleOpenDetail(log)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3 h-3" />
                          JSON
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail JSON Payload */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Detail Audit Log #${selectedLog?.id}`}
        maxWidth="max-w-xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="text-slate-400">
                Aksi: <strong className="text-amber-400 font-mono">{selectedLog.action}</strong>
              </p>
              <p className="text-slate-400">
                Deskripsi: <span className="text-white">{selectedLog.description}</span>
              </p>
              <p className="text-slate-400">
                Waktu: <span className="text-slate-200 font-mono">{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Raw Payload Data (JSON):
              </label>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-[11px] overflow-x-auto max-h-72">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
