import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Search, Calendar, FileText, DollarSign, Gauge } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';

export const FuelLogs = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    log_date: new Date().toISOString().split('T')[0],
    liters: '',
    cost_per_liter: 16500,
    odometer_reading: '',
    fuel_type: 'Solar Dexlite',
    receipt_no: '',
    notes: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fuel-logs');
      if (res.data.success) {
        setLogs(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data konsumsi BBM.');
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
      log_date: new Date().toISOString().split('T')[0],
      liters: '',
      cost_per_liter: 16500,
      odometer_reading: '',
      fuel_type: 'Solar Dexlite',
      receipt_no: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/fuel-logs', {
        ...formData,
        liters: parseFloat(formData.liters),
        cost_per_liter: parseFloat(formData.cost_per_liter),
        odometer_reading: parseInt(formData.odometer_reading, 10),
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchLogs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencatat BBM.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Fuel className="w-6 h-6 text-amber-400" />
            Monitoring Konsumsi BBM Armada
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan pengisian bahan bakar, tracking biaya operasional, dan efisiensi konsumsi BBM.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Catat Pengisian BBM
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">Tanggal</th>
                <th className="py-4 px-4">Kendaraan</th>
                <th className="py-4 px-4">Tipe Bahan Bakar</th>
                <th className="py-4 px-4">Volume (Liter)</th>
                <th className="py-4 px-4">Harga / Liter</th>
                <th className="py-4 px-4">Total Biaya</th>
                <th className="py-4 px-4">Odometer</th>
                <th className="py-4 px-4">No. Struk / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Belum ada catatan BBM.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="py-4 px-4 whitespace-nowrap text-white font-medium">
                      {new Date(l.log_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{l.vehicle?.name}</p>
                      <p className="text-[11px] text-slate-400">{l.vehicle?.license_plate}</p>
                    </td>
                    <td className="py-4 px-4 text-amber-400 font-semibold">{l.fuel_type}</td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                      {Number(l.liters).toLocaleString('id-ID', { minimumFractionDigits: 2 })} L
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      Rp {Number(l.cost_per_liter).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      Rp {Number(l.total_cost).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {Number(l.odometer_reading).toLocaleString('id-ID')} km
                    </td>
                    <td className="py-4 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                      {l.receipt_no && <span className="text-slate-300 font-mono">[{l.receipt_no}] </span>}
                      {l.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Fuel Log */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Pengisian Bahan Bakar (BBM)"
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
                    fuel_type: v?.fuel_type || formData.fuel_type,
                    odometer_reading: v?.current_odometer || formData.odometer_reading,
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
              <label className="block text-slate-300 font-semibold mb-1">Tanggal Pengisian *</label>
              <input
                type="date"
                required
                value={formData.log_date}
                onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jumlah Liter *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.1"
                value={formData.liters}
                onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                placeholder="Contoh: 65.50"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Harga per Liter (Rp) *</label>
              <input
                type="number"
                required
                value={formData.cost_per_liter}
                onChange={(e) => setFormData({ ...formData, cost_per_liter: e.target.value })}
                placeholder="16500"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Angka Odometer Speedometer (KM) *</label>
              <input
                type="number"
                required
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                placeholder="Contoh: 45100"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jenis Bahan Bakar *</label>
              <input
                type="text"
                required
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                placeholder="Solar Dexlite / Biosolar"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">No. Nota / Struk SPBU</label>
            <input
              type="text"
              value={formData.receipt_no}
              onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
              placeholder="Contoh: SPBU-KDR-8812"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Catatan Tambahan</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Keterangan pengisian..."
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
              Simpan Data BBM
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
