import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, CreditCard, MapPin } from 'lucide-react';
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
import { DriverStatusBadge } from '@/components/common/StatusBadge';

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
    if (!window.confirm('Hapus supir ini dari daftar master?')) return;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Master Data Driver (Supir Operasional)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personil supir operasional tambang untuk penugasan perjalanan dinas pool armada.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenAdd} size="sm" className="font-bold text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Driver Baru
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDrivers()}
              placeholder="Cari nama driver, no. SIM, telepon..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Semua Status</option>
            <option value="available">Siap Bertugas</option>
            <option value="on_duty">Sedang Bertugas</option>
            <option value="off">Off / Libur</option>
          </select>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
            <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
            <p>Memuat data driver...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
            Tidak ada data driver yang cocok.
          </div>
        ) : (
          drivers.map((d) => (
            <Card key={d.id} className="flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                    {d.name.charAt(0)}
                  </div>
                  <DriverStatusBadge status={d.status} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">{d.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{d.region?.name}</p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{d.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{d.license_number || 'SIM -'}</span>
                  </div>
                </div>
              </CardContent>

              {isAdmin && (
                <div className="p-4 pt-0 flex items-center justify-end gap-1 border-t border-border/60 mt-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)} className="h-8 px-2 text-xs">
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Add/Edit Driver */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Data Supir' : 'Tambah Supir Baru'}</DialogTitle>
            <DialogDescription>Masukkan identitas dan penempatan lokasi operasional supir.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nama Lengkap *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Budi Santoso"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">No. Handphone / WA *</label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nomor SIM</label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="SIM-BII-881290"
                className="h-9 text-xs font-mono"
              />
            </div>

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
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="available">Siap Bertugas</option>
                <option value="on_duty">Sedang Bertugas</option>
                <option value="off">Off / Libur</option>
              </select>
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
