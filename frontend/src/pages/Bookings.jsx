import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  User,
  MapPin,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookingStatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const Bookings = () => {
  const { user, isAdmin, isApprover } = useAuth();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Master options for create modal
  const [regions, setRegions] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [approversL1, setApproversL1] = useState([]);
  const [approversL2, setApproversL2] = useState([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Complete Trip modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [endOdo, setEndOdo] = useState('');

  // Form State for new booking
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_department: '',
    region_id: '',
    destination_region_id: '',
    vehicle_id: '',
    driver_id: '',
    start_date: '',
    end_date: '',
    purpose: '',
    approver_level_1_id: '',
    approver_level_2_id: '',
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setBookings(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar pemesanan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [regRes, vehRes, drivRes, usersRes] = await Promise.all([
        api.get('/regions'),
        api.get('/vehicles/available'),
        api.get('/drivers/available'),
        api.get('/auth/demo-users'),
      ]);

      if (regRes.data.success) setRegions(regRes.data.data.regions || []);
      if (vehRes.data.success) setAvailableVehicles(vehRes.data.data || []);
      if (drivRes.data.success) setAvailableDrivers(drivRes.data.data || []);

      if (usersRes.data.success) {
        const users = usersRes.data.data || [];
        setApproversL1(users.filter((u) => u.role === 'approver' && u.approval_tier === 1));
        setApproversL2(users.filter((u) => u.role === 'approver' && u.approval_tier === 2));
      }
    } catch (err) {
      console.error('Error fetching master data', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleOpenCreate = () => {
    fetchMasterData();
    setFormData({
      requester_name: '',
      requester_department: '',
      region_id: regions[0]?.id || '',
      destination_region_id: regions[2]?.id || '',
      vehicle_id: '',
      driver_id: '',
      start_date: '',
      end_date: '',
      purpose: '',
      approver_level_1_id: approversL1[0]?.id || '',
      approver_level_2_id: approversL2[0]?.id || '',
    });
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bookings', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsCreateOpen(false);
        fetchBookings();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membuat pemesanan.';
      toast.error(msg);
    }
  };

  const handleStartTrip = async (id) => {
    try {
      const res = await api.post(`/bookings/${id}/start-trip`);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsDetailOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memulai perjalanan.');
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/bookings/${selectedBooking.id}/complete-trip`, {
        end_odometer: parseInt(endOdo, 10),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsCompleteOpen(false);
        setIsDetailOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan perjalanan.');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pemesanan ini?')) return;
    try {
      const res = await api.post(`/bookings/${id}/cancel`);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsDetailOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pemesanan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Pemesanan Kendaraan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola pengajuan, penugasan driver, dan pelacakan alur persetujuan bertingkat.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Pemesanan Baru
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode booking, nama pemohon, divisi, mobil, supir..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">Semua Status</option>
            <option value="pending_level_1">Menunggu Level 1</option>
            <option value="pending_level_2">Menunggu Level 2</option>
            <option value="approved">Disetujui</option>
            <option value="in_use">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
            <option value="rejected">Ditolak</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">Kode Booking</th>
                <th className="py-4 px-4">Pemohon</th>
                <th className="py-4 px-4">Rute Perjalanan</th>
                <th className="py-4 px-4">Armada & Supir</th>
                <th className="py-4 px-4">Jadwal Pakai</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Alur Persetujuan</th>
                <th className="py-4 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-2" />
                    <p>Memuat data pemesanan...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Tidak ada data pemesanan yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const l1 = b.approvals?.find((a) => a.approval_level === 1);
                  const l2 = b.approvals?.find((a) => a.approval_level === 2);

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-amber-400">
                        {b.booking_code}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">{b.requester_name}</p>
                        <p className="text-[11px] text-slate-400">{b.requester_department}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white font-medium">{b.origin_region?.name}</p>
                        <p className="text-[11px] text-amber-400/90">&rarr; {b.destination_region?.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-white">{b.vehicle?.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {b.vehicle?.license_plate} • Supir: <span className="text-slate-200">{b.driver?.name}</span>
                        </p>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-white">
                          {new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          s/d {new Date(b.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              l1?.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : l1?.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            L1: {l1?.status}
                          </span>
                          <span>&rarr;</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              l2?.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : l2?.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            L2: {l2?.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buat Pemesanan Baru (Admin) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Pengajuan Pemesanan Kendaraan"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Pemohon *
              </label>
              <input
                type="text"
                required
                value={formData.requester_name}
                onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                placeholder="Contoh: Hendri Prasetya"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Departemen / Divisi *
              </label>
              <input
                type="text"
                required
                value={formData.requester_department}
                onChange={(e) => setFormData({ ...formData, requester_department: e.target.value })}
                placeholder="Contoh: Eksplorasi Geologi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lokasi Asal (Pool) *
              </label>
              <select
                required
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Lokasi Asal</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lokasi Tujuan *
              </label>
              <select
                required
                value={formData.destination_region_id}
                onChange={(e) => setFormData({ ...formData, destination_region_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Lokasi Tujuan</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pilih Kendaraan *
              </label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Kendaraan Tersedia</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate}) - {v.type === 'passenger' ? 'Orang' : 'Barang'} [{v.ownership_type === 'owned' ? 'Milik' : 'Sewa'}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tentukan Supir / Driver *
              </label>
              <select
                required
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Driver Siap Bertugas</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone}) - {d.region?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal & Waktu Mulai *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal & Waktu Selesai *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Multi-Level Approver Selection */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Pihak Penyetujui Berjenjang (Wajib 2 Level)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Penyetujui Level 1 (Supervisor / Atasan) *
                </label>
                <select
                  required
                  value={formData.approver_level_1_id}
                  onChange={(e) => setFormData({ ...formData, approver_level_1_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Pilih Penyetujui Level 1</option>
                  {approversL1.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.position})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Penyetujui Level 2 (Kepala Pool / GM) *
                </label>
                <select
                  required
                  value={formData.approver_level_2_id}
                  onChange={(e) => setFormData({ ...formData, approver_level_2_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Pilih Penyetujui Level 2</option>
                  {approversL2.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Keperluan Pemakaian Kendaraan *
            </label>
            <textarea
              required
              rows="3"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Jelaskan detail kegiatan operasional, tujuan survei, atau mobilisasi material..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Simpan & Kirim Persetujuan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail Pemesanan & Alur Persetujuan */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Pemesanan: ${selectedBooking?.booking_code || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Status Saat Ini</p>
                <div className="mt-1">
                  <BookingStatusBadge status={selectedBooking.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Dibuat Oleh</p>
                <p className="text-xs font-bold text-white mt-1">
                  {selectedBooking.created_by?.name || 'Admin'}
                </p>
              </div>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Informasi Pemohon</p>
                <p className="font-bold text-white text-sm">{selectedBooking.requester_name}</p>
                <p className="text-slate-300">Divisi: {selectedBooking.requester_department}</p>
                <p className="text-slate-300">
                  Keperluan: <span className="text-amber-300">{selectedBooking.purpose}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Armada & Supir</p>
                <p className="font-bold text-white text-sm">{selectedBooking.vehicle?.name}</p>
                <p className="text-slate-300">Plat: {selectedBooking.vehicle?.license_plate}</p>
                <p className="text-slate-300">Supir: {selectedBooking.driver?.name} ({selectedBooking.driver?.phone})</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Rute Tambang</p>
                <p className="text-slate-300">Asal: <span className="text-white font-semibold">{selectedBooking.origin_region?.name}</span></p>
                <p className="text-slate-300">Tujuan: <span className="text-amber-400 font-semibold">{selectedBooking.destination_region?.name}</span></p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Waktu & Odometer</p>
                <p className="text-slate-300">
                  Berangkat: {new Date(selectedBooking.start_date).toLocaleString('id-ID')}
                </p>
                <p className="text-slate-300">
                  Odometer Awal: {selectedBooking.start_odometer ? `${selectedBooking.start_odometer} km` : '-'}
                </p>
                <p className="text-slate-300">
                  Odometer Akhir: {selectedBooking.end_odometer ? `${selectedBooking.end_odometer} km` : '-'}
                </p>
              </div>
            </div>

            {/* Multi-Level Approval Step Timeline */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Alur Persetujuan Bertingkat (Multi-Level Approval)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedBooking.approvals?.map((app) => (
                  <div
                    key={app.id}
                    className={`p-4 rounded-xl border ${
                      app.status === 'approved'
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : app.status === 'rejected'
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">
                        Persetujuan Level {app.approval_level}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          app.status === 'approved'
                            ? 'bg-emerald-500 text-slate-950'
                            : app.status === 'rejected'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      {app.approver?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{app.approver?.position}</p>

                    {app.action_date && (
                      <p className="text-[10px] text-slate-500 mt-2">
                        Waktu: {new Date(app.action_date).toLocaleString('id-ID')}
                      </p>
                    )}

                    {app.notes && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 italic">
                        "{app.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                {isAdmin && selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
                  >
                    Batalkan Pemesanan
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && selectedBooking.status === 'approved' && (
                  <button
                    onClick={() => handleStartTrip(selectedBooking.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Mulai Perjalanan
                  </button>
                )}

                {isAdmin && selectedBooking.status === 'in_use' && (
                  <button
                    onClick={() => {
                      setEndOdo(selectedBooking.start_odometer || selectedBooking.vehicle?.current_odometer || 0);
                      setIsCompleteOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Selesaikan Perjalanan
                  </button>
                )}

                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Selesaikan Perjalanan (Input Odometer Akhir) */}
      <Modal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title="Konfirmasi Penyelesaian Perjalanan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCompleteTrip} className="space-y-4">
          <p className="text-xs text-slate-300">
            Perjalanan untuk <strong className="text-white">{selectedBooking?.vehicle?.name}</strong> akan ditandai selesai. Masukkan angka odometer akhir pada speedometer kendaraan:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Odometer Akhir (KM) *
            </label>
            <input
              type="number"
              required
              min={selectedBooking?.start_odometer || 0}
              value={endOdo}
              onChange={(e) => setEndOdo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Odometer awal: {selectedBooking?.start_odometer || 0} KM
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCompleteOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-blue-500/20"
            >
              Simpan & Selesaikan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
