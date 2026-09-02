import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';

export const ServiceLogs = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: 'routine',
    cost: 1500000,
    workshop_name: 'Bengkel Resmi',
    odometer_at_service: '',
    next_service_date: '',
    next_service_odometer: '',
    status: 'completed',
    notes: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-logs');
      if (res.data.success) {
        setLogs(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat jadwal & riwayat servis.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      vehicle_id: vehicles[0]?.id || '',
      service_date: new Date().toISOString().split('T')[0],
      service_type: 'routine',
      cost: 1500000,
      workshop_name: 'Bengkel Resmi Kendari',
      odometer_at_service: '',
      next_service_date: '',
      next_service_odometer: '',
      status: 'completed',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/service-logs', {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        odometer_at_service: parseInt(formData.odometer_at_service, 10),
        next_service_odometer: formData.next_service_odometer ? parseInt(formData.next_service_odometer, 10) : undefined,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchLogs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencatat servis.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-400" />
            Jadwal & Riwayat Servis Armada
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pengingat servis berkala (berdasarkan tanggal & KM odometer) serta pencatatan biaya perbaikan.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Jadwalkan / Catat Servis
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">Tanggal Servis</th>
                <th className="py-4 px-4">Armada Kendaraan</th>
                <th className="py-4 px-4">Jenis Perawatan</th>
                <th className="py-4 px-4">Nama Bengkel</th>
                <th className="py-4 px-4">Odometer Servis</th>
                <th className="py-4 px-4">Estimasi / Biaya</th>
                <th className="py-4 px-4">Jadwal Servis Berikutnya</th>
                <th className="py-4 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Memuat data servis...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Belum ada riwayat servis.
                  </td>
                </tr>
              ) : (
                logs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-4 px-4 whitespace-nowrap font-medium text-white">
                      {new Date(s.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{s.vehicle?.name}</p>
                      <p className="text-[11px] text-slate-400">{s.vehicle?.license_plate}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300 font-semibold uppercase text-[10px]">
                        {s.service_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{s.workshop_name}</td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {Number(s.odometer_at_service).toLocaleString('id-ID')} km
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                      Rp {Number(s.cost).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                      {s.next_service_date ? (
                        <span className="text-amber-400 font-medium">
                          {new Date(s.next_service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        '-'
                      )}
                      {s.next_service_odometer && (
                        <span className="block text-[10px] text-slate-500">
                          ({Number(s.next_service_odometer).toLocaleString('id-ID')} km)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          s.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : s.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Schedule Service */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan / Catat Servis Kendaraan"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pilih Kendaraan *</label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => {
                  const v = vehicles.find((veh) => veh.id == e.target.value);
                  setFormData({
                    ...formData,
                    vehicle_id: e.target.value,
                    odometer_at_service: v?.current_odometer || formData.odometer_at_service,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Kendaraan</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tanggal Servis *</label>
              <input
                type="date"
                required
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jenis Perawatan *</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="routine">Rutin / Berkala</option>
                <option value="repair">Perbaikan Kerusakan</option>
                <option value="overhaul">Overhaul Mesin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status Pengerjaan *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="completed">Selesai (Completed)</option>
                <option value="in_progress">Sedang Pengerjaan</option>
                <option value="scheduled">Terjadwal Mendatang</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Biaya (Rp)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="1500000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Bengkel / Workshop *</label>
              <input
                type="text"
                required
                value={formData.workshop_name}
                onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
                placeholder="Contoh: Auto2000 Kendari"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Odometer Saat Servis (KM) *</label>
              <input
                type="number"
                required
                value={formData.odometer_at_service}
                onChange={(e) => setFormData({ ...formData, odometer_at_service: e.target.value })}
                placeholder="Contoh: 45000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jadwal Servis Berikutnya (Tanggal)</label>
              <input
                type="date"
                value={formData.next_service_date}
                onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jadwal Servis Berikutnya (KM)</label>
              <input
                type="number"
                value={formData.next_service_odometer}
                onChange={(e) => setFormData({ ...formData, next_service_odometer: e.target.value })}
                placeholder="Contoh: 50000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rincian Tindakan Servis & Penggantian Part</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ganti oli, filter oli, filter udara, rotasi ban..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Simpan Data Servis
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
