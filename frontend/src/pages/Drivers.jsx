import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, CreditCard, MapPin } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DriverStatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const Drivers = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [drivers, setDrivers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    region_id: '',
    status: 'available',
  });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setDrivers(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar driver.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await api.get('/regions');
      if (res.data.success) {
        setRegions(res.data.data.regions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchRegions();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      license_number: '',
      region_id: regions[0]?.id || '',
      status: 'available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDriver(d);
    setFormData({
      name: d.name,
      phone: d.phone,
      license_number: d.license_number || '',
      region_id: d.region_id,
      status: d.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        const res = await api.put(`/drivers/${editingDriver.id}`, formData);
        if (res.data.success) toast.success(res.data.message);
      } else {
        const res = await api.post('/drivers', formData);
        if (res.data.success) toast.success(res.data.message);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data driver.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus driver ini?')) return;
    try {
      const res = await api.delete(`/drivers/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchDrivers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus driver.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            Master Data Driver (Supir Operasional)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personil supir operasional tambang untuk penugasan perjalanan pool armada.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Driver Baru
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDrivers()}
            placeholder="Cari nama driver, no. SIM, nomor telepon..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">Semua Status</option>
          <option value="available">Siap Bertugas</option>
          <option value="on_duty">Sedang Bertugas</option>
          <option value="off">Off / Libur</option>
        </select>
      </div>

      {/* Drivers List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <p className="text-xs">Memuat data driver...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Tidak ada driver yang cocok.
          </div>
        ) : (
          drivers.map((d) => (
            <div
              key={d.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold">
                    {d.name.charAt(0)}
                  </div>
                  <DriverStatusBadge status={d.status} />
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{d.name}</h3>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{d.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{d.license_number || 'SIM -'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{d.region?.name}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-3 mt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Driver */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? 'Edit Data Supir' : 'Tambah Supir Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap Supir *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">No. Handphone / WA *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0812-xxxx-xxxx"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nomor SIM</label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              placeholder="Contoh: SIM-BII-881290"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Lokasi Penempatan *</label>
            <select
              required
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">Pilih Lokasi</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="available">Siap Bertugas</option>
              <option value="on_duty">Sedang Bertugas</option>
              <option value="off">Off / Libur</option>
            </select>
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
