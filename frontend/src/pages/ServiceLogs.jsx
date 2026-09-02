import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
    workshop_name: 'Bengkel Resmi Kendari',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Jadwal & Riwayat Servis Armada
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pengingat servis berkala (tanggal & odometer) serta pencatatan biaya pemeliharaan.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenAdd} size="sm" className="font-bold text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Jadwalkan / Catat Servis
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal Servis</TableHead>
                <TableHead>Armada Kendaraan</TableHead>
                <TableHead>Jenis Perawatan</TableHead>
                <TableHead>Bengkel</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Biaya Servis</TableHead>
                <TableHead>Jadwal Berikutnya</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                    Memuat data servis...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                    Belum ada riwayat servis.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground text-xs">
                      {new Date(s.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-foreground">{s.vehicle?.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.vehicle?.license_plate}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-500 border-amber-500/30">
                        {s.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground">{s.workshop_name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {Number(s.odometer_at_service).toLocaleString('id-ID')} km
                    </TableCell>
                    <TableCell className="font-mono font-bold text-emerald-500 text-xs">
                      Rp {Number(s.cost).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {s.next_service_date ? (
                        <span className="text-foreground font-medium">
                          {new Date(s.next_service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        '-'
                      )}
                      {s.next_service_odometer && (
                        <span className="block text-[10px] text-muted-foreground">
                          ({Number(s.next_service_odometer).toLocaleString('id-ID')} km)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={s.status === 'completed' ? 'emerald' : s.status === 'in_progress' ? 'blue' : 'amber'}
                        className="uppercase text-[10px] font-bold"
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Add/Schedule Service */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Jadwalkan / Catat Servis Kendaraan</DialogTitle>
            <DialogDescription>Masukkan detail bengkel, jenis perawatan berkala, dan jadwal selanjutnya.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Pilih Kendaraan *</label>
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
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Pilih Kendaraan</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.license_plate})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tanggal Servis *</label>
                <Input
                  type="date"
                  required
                  value={formData.service_date}
                  onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Jenis Perawatan *</label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="routine">Rutin / Berkala</option>
                  <option value="repair">Perbaikan</option>
                  <option value="overhaul">Overhaul Mesin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Status Pengerjaan *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="completed">Selesai</option>
                  <option value="in_progress">Dalam Proses</option>
                  <option value="scheduled">Terjadwal</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Biaya (Rp)</label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="1500000"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Bengkel / Workshop *</label>
                <Input
                  type="text"
                  required
                  value={formData.workshop_name}
                  onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
                  placeholder="Bengkel Resmi Kendari"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Odometer Servis (KM) *</label>
                <Input
                  type="number"
                  required
                  value={formData.odometer_at_service}
                  onChange={(e) => setFormData({ ...formData, odometer_at_service: e.target.value })}
                  placeholder="45000"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Servis Berikutnya (Tanggal)</label>
                <Input
                  type="date"
                  value={formData.next_service_date}
                  onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Servis Berikutnya (KM)</label>
                <Input
                  type="number"
                  value={formData.next_service_odometer}
                  onChange={(e) => setFormData({ ...formData, next_service_odometer: e.target.value })}
                  placeholder="50000"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Rincian Tindakan</label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ganti oli mesin, filter oli, filter bahan bakar, balancing..."
                className="text-xs"
              />
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
