import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, Wrench, Fuel, MapPin, Building2, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VehicleStatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const Vehicles = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [rentalCompanies, setRentalCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    type: 'passenger',
    ownership_type: 'owned',
    rental_company_id: '',
    region_id: '',
    fuel_type: 'Solar Dexlite',
    current_odometer: 0,
    status: 'available',
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles', {
        params: {
          search: search || undefined,
          type: typeFilter || undefined,
          ownership_type: ownershipFilter || undefined,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data armada.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaster = async () => {
    try {
      const res = await api.get('/regions');
      if (res.data.success) {
        setRegions(res.data.data.regions || []);
        setRentalCompanies(res.data.data.rental_companies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchMaster();
  }, [typeFilter, ownershipFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      license_plate: '',
      type: 'passenger',
      ownership_type: 'owned',
      rental_company_id: '',
      region_id: regions[0]?.id || '',
      fuel_type: 'Solar Dexlite',
      current_odometer: 0,
      status: 'available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({
      name: v.name,
      license_plate: v.license_plate,
      type: v.type,
      ownership_type: v.ownership_type,
      rental_company_id: v.rental_company_id || '',
      region_id: v.region_id,
      fuel_type: v.fuel_type,
      current_odometer: v.current_odometer,
      status: v.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        const res = await api.put(`/vehicles/${editingVehicle.id}`, formData);
        if (res.data.success) {
          toast.success(res.data.message);
        }
      } else {
        const res = await api.post('/vehicles', formData);
        if (res.data.success) {
          toast.success(res.data.message);
        }
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kendaraan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kendaraan ini?')) return;
    try {
      const res = await api.delete(`/vehicles/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchVehicles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kendaraan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-amber-400" />
            Inventaris Armada Kendaraan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring kendaraan angkutan orang & barang, status kepemilikan (milik sendiri & sewa), dan jadwal servis.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Kendaraan
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVehicles()}
            placeholder="Cari nama unit, plat nomor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">Semua Tipe</option>
          <option value="passenger">Angkutan Orang</option>
          <option value="cargo">Angkutan Barang</option>
        </select>

        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">Semua Kepemilikan</option>
          <option value="owned">Milik Perusahaan</option>
          <option value="rented">Sewa (Rental)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="in_use">Digunakan</option>
          <option value="in_service">Dalam Servis</option>
        </select>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <div className="inline-block w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-2" />
            <p className="text-xs">Memuat armada...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Tidak ada armada yang sesuai filter.
          </div>
        ) : (
          vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
                    {v.license_plate}
                  </span>
                  <VehicleStatusBadge status={v.status} />
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{v.name}</h3>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tipe Armada:</span>
                    <span className="font-semibold text-white">
                      {v.type === 'passenger' ? 'Angkutan Orang' : 'Angkutan Barang'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kepemilikan:</span>
                    <span
                      className={`font-semibold ${
                        v.ownership_type === 'owned' ? 'text-emerald-400' : 'text-cyan-400'
                      }`}
                    >
                      {v.ownership_type === 'owned'
                        ? 'Milik Perusahaan'
                        : `Sewa (${v.rental_company?.name || 'Vendor'})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lokasi Penempatan:</span>
                    <span className="font-medium text-slate-200">{v.region?.name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Odometer Terkini:</span>
                    <span className="font-mono font-bold text-white">
                      {Number(v.current_odometer).toLocaleString('id-ID')} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bahan Bakar:</span>
                    <span className="text-amber-400 font-medium">{v.fuel_type}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Vehicle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Data Kendaraan' : 'Tambah Armada Kendaraan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama / Tipe Kendaraan *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Toyota Hilux 4x4"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nomor Polisi (Plat) *</label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                placeholder="Contoh: B 9101 NKL"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jenis Angkutan *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="passenger">Angkutan Orang</option>
                <option value="cargo">Angkutan Barang</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status Kepemilikan *</label>
              <select
                value={formData.ownership_type}
                onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="owned">Milik Perusahaan</option>
                <option value="rented">Sewa (Rental)</option>
              </select>
            </div>
          </div>

          {formData.ownership_type === 'rented' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Perusahaan Persewaan (Vendor) *</label>
              <select
                required
                value={formData.rental_company_id}
                onChange={(e) => setFormData({ ...formData, rental_company_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Vendor Rental</option>
                {rentalCompanies.map((rc) => (
                  <option key={rc.id} value={rc.id}>
                    {rc.name} ({rc.contact_person})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lokasi Wilayah Tambang / Kantor *</label>
              <select
                required
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Pilih Lokasi</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Odometer Terkini (KM)</label>
              <input
                type="number"
                min="0"
                value={formData.current_odometer}
                onChange={(e) => setFormData({ ...formData, current_odometer: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status Ketersediaan</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="available">Tersedia</option>
                <option value="in_use">Sedang Digunakan</option>
                <option value="in_service">Dalam Servis</option>
              </select>
            </div>
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
