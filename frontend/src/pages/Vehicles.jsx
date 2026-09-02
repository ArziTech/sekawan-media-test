import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, Wrench, Fuel, MapPin, Building2, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VehicleStatusBadge } from '@/components/common/StatusBadge';

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
        if (res.data.success) toast.success(res.data.message);
      } else {
        const res = await api.post('/vehicles', formData);
        if (res.data.success) toast.success(res.data.message);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data kendaraan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus unit kendaraan ini dari armada?')) return;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            Inventaris Armada Kendaraan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen unit angkutan orang & barang, status kepemilikan (milik sendiri & sewa), serta pelacakan odometer.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenAdd} size="sm" className="font-bold text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Kendaraan
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVehicles()}
              placeholder="Cari nama unit, plat nomor..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Semua Tipe</option>
            <option value="passenger">Angkutan Orang</option>
            <option value="cargo">Angkutan Barang</option>
          </select>

          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Semua Kepemilikan</option>
            <option value="owned">Milik Sendiri</option>
            <option value="rented">Sewa (Rental)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="in_use">Digunakan</option>
            <option value="in_service">Dalam Servis</option>
          </select>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
            <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
            <p>Memuat armada...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
            Tidak ada armada yang sesuai filter.
          </div>
        ) : (
          vehicles.map((v) => (
            <Card key={v.id} className="flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted border border-border/80 text-foreground">
                    {v.license_plate}
                  </span>
                  <VehicleStatusBadge status={v.status} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">{v.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{v.region?.name}</p>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span>Tipe:</span>
                    <span className="font-medium text-foreground">
                      {v.type === 'passenger' ? 'Angkutan Orang' : 'Angkutan Barang'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kepemilikan:</span>
                    <span className={`font-medium ${v.ownership_type === 'owned' ? 'text-emerald-500' : 'text-cyan-500'}`}>
                      {v.ownership_type === 'owned' ? 'Milik Perusahaan' : `Sewa (${v.rental_company?.name || 'Vendor'})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Odometer:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {Number(v.current_odometer).toLocaleString('id-ID')} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bahan Bakar:</span>
                    <span className="text-amber-500 font-medium">{v.fuel_type}</span>
                  </div>
                </div>
              </CardContent>

              {isAdmin && (
                <div className="p-4 pt-3 flex items-center justify-end gap-2 border-t border-border/80">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(v)} className="h-8 px-2.5 text-xs">
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="h-8 px-2.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Add/Edit Vehicle */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Data Kendaraan' : 'Tambah Armada Kendaraan Baru'}</DialogTitle>
            <DialogDescription>Masukkan spesifikasi unit kendaraan tambang dan status penempatan.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nama / Tipe Unit *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Toyota Hilux 4x4"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nomor Polisi (Plat) *</label>
                <Input
                  required
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  placeholder="B 9101 NKL"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Jenis Angkutan *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="passenger">Angkutan Orang</option>
                  <option value="cargo">Angkutan Barang</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Status Kepemilikan *</label>
                <select
                  value={formData.ownership_type}
                  onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="owned">Milik Perusahaan</option>
                  <option value="rented">Sewa (Rental)</option>
                </select>
              </div>
            </div>

            {formData.ownership_type === 'rented' && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Perusahaan Persewaan (Vendor) *</label>
                <select
                  required
                  value={formData.rental_company_id}
                  onChange={(e) => setFormData({ ...formData, rental_company_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Lokasi Penempatan *</label>
                <select
                  required
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Pilih Lokasi</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Bahan Bakar *</label>
                <Input
                  required
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  placeholder="Solar Dexlite"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Odometer (KM)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.current_odometer}
                  onChange={(e) => setFormData({ ...formData, current_odometer: parseInt(e.target.value, 10) || 0 })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="available">Tersedia</option>
                  <option value="in_use">Sedang Digunakan</option>
                  <option value="in_service">Dalam Servis</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-bold text-xs">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
