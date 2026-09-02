import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Search, Calendar, FileText, DollarSign, Gauge } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-500" />
            Monitoring Konsumsi BBM Armada
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pencatatan pengisian bahan bakar, biaya operasional, dan tracking odometer.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenAdd} size="sm" className="font-bold text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Catat Pengisian BBM
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Jenis BBM</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Harga / Liter</TableHead>
                <TableHead>Total Biaya</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead className="text-right">No. Struk / Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                    Belum ada catatan BBM.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground text-xs">
                      {new Date(l.log_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-foreground">{l.vehicle?.name}</p>
                      <p className="text-[11px] text-muted-foreground">{l.vehicle?.license_plate}</p>
                    </TableCell>
                    <TableCell className="text-amber-500 font-medium text-xs">{l.fuel_type}</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-500 text-xs">
                      {Number(l.liters).toLocaleString('id-ID', { minimumFractionDigits: 2 })} L
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      Rp {Number(l.cost_per_liter).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground text-xs">
                      Rp {Number(l.total_cost).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {Number(l.odometer_reading).toLocaleString('id-ID')} km
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground max-w-xs truncate">
                      {l.receipt_no && <span className="font-mono text-foreground">[{l.receipt_no}] </span>}
                      {l.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Add Fuel Log */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pengisian Bahan Bakar</DialogTitle>
            <DialogDescription>Masukkan volume liter, biaya, dan angka odometer saat pengisian.</DialogDescription>
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
                      fuel_type: v?.fuel_type || formData.fuel_type,
                      odometer_reading: v?.current_odometer || formData.odometer_reading,
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
                <label className="font-semibold text-foreground">Tanggal Pengisian *</label>
                <Input
                  type="date"
                  required
                  value={formData.log_date}
                  onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Volume (Liter) *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  min="0.1"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                  placeholder="65.50"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Harga / Liter (Rp) *</label>
                <Input
                  type="number"
                  required
                  value={formData.cost_per_liter}
                  onChange={(e) => setFormData({ ...formData, cost_per_liter: e.target.value })}
                  placeholder="16500"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Odometer (KM) *</label>
                <Input
                  type="number"
                  required
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  placeholder="45100"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Jenis BBM *</label>
                <Input
                  type="text"
                  required
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  placeholder="Solar Dexlite"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">No. Nota / Struk SPBU</label>
              <Input
                type="text"
                value={formData.receipt_no}
                onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                placeholder="SPBU-KDR-8812"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Catatan Tambahan</label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Keterangan..."
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
