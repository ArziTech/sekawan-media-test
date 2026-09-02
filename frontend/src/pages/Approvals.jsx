import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookingStatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const Approvals = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Action Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      if (res.data.success) {
        setPendingList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar tugas persetujuan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/history');
      if (res.data.success) {
        setHistoryList(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat riwayat persetujuan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPending();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  const handleOpenActionModal = (booking, type) => {
    setSelectedBooking(booking);
    setActionType(type);
    setNotes(type === 'approve' ? 'Disetujui untuk kegiatan operasional.' : '');
    setIsActionModalOpen(true);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (actionType === 'reject' && !notes.trim()) {
      toast.error('Wajib mengisi catatan alasan penolakan.');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(`/approvals/${selectedBooking.id}/action`, {
        action: actionType,
        notes: notes.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsActionModalOpen(false);
        fetchPending();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses persetujuan.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            Portal Persetujuan Berjenjang
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review dan berikan keputusan persetujuan bertingkat (Level 1 Supervisor & Level 2 Kepala Pool / GM).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Menunggu Tindakan ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Keputusan
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'pending' ? (
        <div>
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="inline-block w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-2" />
              <p className="text-xs">Memuat daftar tugas persetujuan...</p>
            </div>
          ) : pendingList.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Semua Persetujuan Selesai!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Tidak ada pemesanan kendaraan yang sedang menunggu persetujuan Anda saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingList.map((b) => {
                const l1 = b.approvals?.find((a) => a.approval_level === 1);
                const l2 = b.approvals?.find((a) => a.approval_level === 2);
                const currentLevel = b.status === 'pending_level_1' ? 1 : 2;

                return (
                  <div
                    key={b.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden"
                  >
                    {/* Top Level indicator tag */}
                    <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-amber-500/20 border-l border-b border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      Tahap Persetujuan Level {currentLevel}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {b.booking_code}
                        </span>
                        <BookingStatusBadge status={b.status} />
                      </div>

                      <div className="space-y-3 text-xs mb-4">
                        <div>
                          <p className="text-sm font-bold text-white">{b.requester_name}</p>
                          <p className="text-slate-400">{b.requester_department}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-semibold">{b.vehicle?.name}</span>
                            <span className="text-slate-400">({b.vehicle?.license_plate})</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <User className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>Driver: {b.driver?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{b.origin_region?.name} &rarr; <strong className="text-amber-300">{b.destination_region?.name}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              {new Date(b.start_date).toLocaleDateString('id-ID')} s/d {new Date(b.end_date).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Keperluan:
                          </span>
                          <p className="text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 italic">
                            "{b.purpose}"
                          </p>
                        </div>

                        {/* If in level 2, show level 1 approval notes */}
                        {currentLevel === 2 && l1 && (
                          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px]">
                            <p className="font-bold text-emerald-400">
                              Catatan Persetujuan Level 1 ({l1.approver?.name}):
                            </p>
                            <p className="text-slate-300 mt-0.5">"{l1.notes || 'Disetujui'}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => handleOpenActionModal(b, 'approve')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Setujui (Approve)
                      </button>

                      <button
                        onClick={() => handleOpenActionModal(b, 'reject')}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak (Reject)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4">Kode Booking</th>
                  <th className="py-4 px-4">Tingkat Approval</th>
                  <th className="py-4 px-4">Pemohon</th>
                  <th className="py-4 px-4">Kendaraan</th>
                  <th className="py-4 px-4">Keputusan</th>
                  <th className="py-4 px-4">Catatan</th>
                  <th className="py-4 px-4">Waktu Diproses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      Memuat riwayat...
                    </td>
                  </tr>
                ) : historyList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      Belum ada riwayat persetujuan.
                    </td>
                  </tr>
                ) : (
                  historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-4 px-4 font-mono font-bold text-amber-400">
                        {item.booking?.booking_code}
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">
                        Level {item.approval_level}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">{item.booking?.requester_name}</p>
                        <p className="text-[11px] text-slate-400">{item.booking?.requester_department}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white">{item.booking?.vehicle?.name}</p>
                        <p className="text-[11px] text-slate-400">{item.booking?.vehicle?.license_plate}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            item.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate text-slate-300">
                        "{item.notes || '-'}"
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                        {item.action_date ? new Date(item.action_date).toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Proses Persetujuan / Penolakan */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={
          actionType === 'approve'
            ? `Persetujuan Pemesanan: ${selectedBooking?.booking_code}`
            : `Penolakan Pemesanan: ${selectedBooking?.booking_code}`
        }
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitAction} className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              actionType === 'approve'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
            }`}
          >
            {actionType === 'approve' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-bold text-sm">
                {actionType === 'approve'
                  ? 'Konfirmasi Memberikan Persetujuan'
                  : 'Konfirmasi Menolak Pemesanan'}
              </p>
              <p className="mt-1 opacity-90">
                Pemesanan untuk <strong>{selectedBooking?.requester_name}</strong> ({selectedBooking?.vehicle?.name}) rute {selectedBooking?.origin_region?.name} &rarr; {selectedBooking?.destination_region?.name}.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan / Alasan {actionType === 'reject' ? '(Wajib Diisi)*' : '(Opsional)'}
            </label>
            <textarea
              required={actionType === 'reject'}
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'Tuliskan catatan persetujuan jika ada...'
                  : 'Jelaskan alasan mengapa pemesanan ini ditolak...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 ${
                actionType === 'approve'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              {processing
                ? 'Memproses...'
                : actionType === 'approve'
                ? 'Konfirmasi Setujui'
                : 'Konfirmasi Tolak'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
