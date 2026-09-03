import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Wrench,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit3,
  SlidersHorizontal,
  Ban,
  Truck,
  Sparkles,
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from '@/lib/utils';

// Schema: Buat Jadwal Servis Baru
const serviceLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Armada kendaraan wajib dipilih.'),
  service_date: z.string().min(1, 'Tanggal servis wajib diisi.'),
  service_type: z.enum(['routine', 'repair', 'inspection', 'overhaul']),
  cost: z.coerce.number().min(0, 'Biaya servis tidak boleh negatif.'),
  workshop_name: z.string().min(2, 'Nama bengkel atau pihak mekanik minimal 2 karakter.'),
  odometer_at_service: z.coerce.number().min(0, 'Odometer tidak boleh negatif.'),
  next_service_date: z.string().optional(),
  next_service_odometer: z.coerce.number().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

// Schema: Update Status Servis
const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  cost: z.coerce.number().min(0, 'Biaya tidak boleh negatif.').optional(),
  odometer_at_service: z.coerce.number().min(0, 'Odometer tidak boleh negatif.').optional(),
  next_service_date: z.string().optional(),
  next_service_odometer: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const ServiceLogs = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // TanStack Query: Master Vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data?.data || [];
    },
  });

  // TanStack Query: Service Logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['service-logs'],
    queryFn: async () => {
      const res = await api.get('/service-logs');
      return res.data?.data?.data || [];
    },
  });

  // React Hook Form for Create Service
  const form = useForm({
    resolver: zodResolver(serviceLogSchema),
    defaultValues: {
      vehicle_id: '',
      service_date: new Date().toISOString().split('T')[0],
      service_type: 'routine',
      cost: 1500000,
      workshop_name: 'Bengkel Resmi Kendari',
      odometer_at_service: 0,
      next_service_date: '',
      next_service_odometer: '',
      status: 'completed',
      notes: '',
    },
  });

  // React Hook Form for Update Status
  const statusForm = useForm({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: 'completed',
      cost: 0,
      odometer_at_service: 0,
      next_service_date: '',
      next_service_odometer: '',
      notes: '',
    },
  });

  const watchUpdateStatus = statusForm.watch('status');

  // Mutation: Create Service Log
  const createMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        vehicle_id: parseInt(values.vehicle_id),
        service_date: values.service_date,
        service_type: values.service_type,
        cost: Number(values.cost),
        workshop_name: values.workshop_name,
        odometer_at_service: Number(values.odometer_at_service),
        next_service_date: values.next_service_date || null,
        next_service_odometer: values.next_service_odometer ? Number(values.next_service_odometer) : null,
        status: values.status,
        notes: values.notes || null,
      };
      return api.post('/service-logs', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Data servis berhasil dicatat.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['service-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['regions-overview'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data servis.');
    },
  });

  // Mutation: Update Status Servis
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/service-logs/${id}/status`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Status servis armada berhasil diperbarui.');
      setIsStatusModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['service-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['regions-overview'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status servis.');
    },
  });

  const handleOpenAdd = () => {
    form.reset({
      vehicle_id: vehicles[0] ? String(vehicles[0].id) : '',
      service_date: new Date().toISOString().split('T')[0],
      service_type: 'routine',
      cost: 1500000,
      workshop_name: 'Bengkel Resmi Kendari',
      odometer_at_service: vehicles[0] ? vehicles[0].current_odometer : 0,
      next_service_date: '',
      next_service_odometer: '',
      status: 'completed',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenStatusModal = (service) => {
    setSelectedService(service);
    statusForm.reset({
      status: service.status || 'completed',
      cost: Number(service.cost || 0),
      odometer_at_service: service.odometer_at_service || service.vehicle?.current_odometer || 0,
      next_service_date: service.next_service_date ? service.next_service_date.split('T')[0] : '',
      next_service_odometer: service.next_service_odometer || '',
      notes: service.notes || '',
    });
    setIsStatusModalOpen(true);
  };

  const onSubmitCreate = (values) => {
    createMutation.mutate(values);
  };

  const onSubmitUpdateStatus = (values) => {
    if (!selectedService) return;
    const payload = {
      status: values.status,
      cost: Number(values.cost || 0),
      odometer_at_service: Number(values.odometer_at_service || 0),
      next_service_date: values.next_service_date || null,
      next_service_odometer: values.next_service_odometer ? Number(values.next_service_odometer) : null,
      notes: values.notes || null,
    };
    updateStatusMutation.mutate({ id: selectedService.id, payload });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
            <CheckCircle className="w-3 h-3 mr-1" /> Selesai
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">
            <Wrench className="w-3 h-3 mr-1" /> Dikerjakan
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
            <Clock className="w-3 h-3 mr-1" /> Terjadwal
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">
            <XCircle className="w-3 h-3 mr-1" /> Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const scheduledCount = logs.filter((l) => l.status === 'scheduled').length;
  const inProgressCount = logs.filter((l) => l.status === 'in_progress').length;
  const completedCount = logs.filter((l) => l.status === 'completed').length;
  const cancelledCount = logs.filter((l) => l.status === 'cancelled').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-500" />
            Jadwal & Riwayat Servis Armada
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen pemeliharaan rutin, perbaikan kendala teknis, jadwal servis berkala, serta pembaruan status pengerjaan armada.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="text-xs gap-1.5 h-9"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              <span>Segarkan</span>
            </Button>

            <Button
              onClick={handleOpenAdd}
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Servis</span>
            </Button>
          </div>
        )}
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Servis Terjadwal */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Servis Terjadwal</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-amber-500">{scheduledCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Menunggu masuk bengkel</p>
          </CardContent>
        </Card>

        {/* Card 2: Sedang Dikerjakan */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Sedang Dikerjakan</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-blue-400">{inProgressCount}</div>
            <p className="text-[11px] text-blue-400 font-medium mt-0.5">Unit berada di bengkel</p>
          </CardContent>
        </Card>

        {/* Card 3: Servis Selesai */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Servis Selesai</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-500">{completedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Armada kembali siap operasi</p>
          </CardContent>
        </Card>

        {/* Card 4: Dibatalkan */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Servis Dibatalkan</span>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-rose-400">{cancelledCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Jadwal tidak direalisasikan</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">Tanggal Servis</TableHead>
                <TableHead className="py-3 px-4">Armada Kendaraan</TableHead>
                <TableHead className="py-3 px-4">Kategori Servis</TableHead>
                <TableHead className="py-3 px-4">Bengkel / Rekanan</TableHead>
                <TableHead className="py-3 px-4">Biaya (Rp)</TableHead>
                <TableHead className="py-3 px-4">Odometer</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                {isAdmin && <TableHead className="py-3 px-4 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat riwayat servis...</p>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-muted-foreground text-xs">
                    Belum ada riwayat servis tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(log.service_date).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-foreground">{log.vehicle?.name}</div>
                      <div className="text-[11px] text-amber-500 font-mono font-semibold">{log.vehicle?.license_plate}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <Badge variant="outline" className="text-[10px] capitalize font-semibold">
                        {log.service_type === 'routine' ? 'Servis Rutin' : log.service_type === 'repair' ? 'Perbaikan' : log.service_type === 'overhaul' ? 'Overhaul' : 'Inspeksi'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-medium text-foreground">
                      {log.workshop_name}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-bold text-foreground">
                      Rp {Number(log.cost || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                      {log.odometer_at_service ? `${Number(log.odometer_at_service).toLocaleString('id-ID')} km` : '-'}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {getStatusBadge(log.status)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenStatusModal(log)}
                          className="text-[11px] gap-1.5 h-7"
                        >
                          <Edit3 className="w-3 h-3 text-amber-500" />
                          <span>Update Status</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── MODAL DIALOG: UPDATE STATUS SERVIS ARMADA ───────────────────── */}
      {selectedService && (
        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                Perbarui Status Servis Armada
              </DialogTitle>
              <DialogDescription>
                Ubah tahapan pengerjaan servis untuk <strong>{selectedService.vehicle?.name}</strong> ({selectedService.vehicle?.license_plate}).
              </DialogDescription>
            </DialogHeader>

            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(onSubmitUpdateStatus)} className="space-y-4 text-xs">
                {/* Info Ringkas Kendaraan & Bengkel */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bengkel Rekanan:</span>
                    <strong className="text-foreground">{selectedService.workshop_name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tanggal Servis:</span>
                    <span className="font-mono text-foreground">
                      {new Date(selectedService.service_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Pilih Status Baru */}
                <FormField
                  control={statusForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground">Status Pengerjaan Servis *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">
                            Terjadwal (Menunggu Masuk Bengkel)
                          </SelectItem>
                          <SelectItem value="in_progress">
                            Sedang Dikerjakan (Armada Masuk Status Dalam Servis)
                          </SelectItem>
                          <SelectItem value="completed">
                            Selesai (Armada Otomatis Kembali Tersedia)
                          </SelectItem>
                          <SelectItem value="cancelled">
                            Dibatalkan (Jadwal Dibatalkan & Armada Kembali Tersedia)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info Penjelasan Efek Status */}
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground">
                  {watchUpdateStatus === 'in_progress' && (
                    <p className="text-blue-400 font-medium">
                      &bull; Status armada akan otomatis diubah menjadi <strong>Dalam Servis (in_service)</strong> sehingga tidak dapat dipesan untuk dinas lain.
                    </p>
                  )}
                  {watchUpdateStatus === 'completed' && (
                    <p className="text-emerald-400 font-medium">
                      &bull; Status armada akan otomatis kembali menjadi <strong>Tersedia (available)</strong> di pool dan riwayat servis akan diperbarui.
                    </p>
                  )}
                  {watchUpdateStatus === 'cancelled' && (
                    <p className="text-rose-400 font-medium">
                      &bull; Jadwal servis dibatalkan dan status armada akan dipulihkan menjadi <strong>Tersedia (available)</strong> di pool.
                    </p>
                  )}
                  {watchUpdateStatus === 'scheduled' && (
                    <p>
                      &bull; Servis diagendakan untuk tanggal terkait.
                    </p>
                  )}
                </div>

                {/* Biaya & Odometer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={statusForm.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Biaya Servis Riil (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={statusForm.control}
                    name="odometer_at_service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Odometer Saat Servis (KM)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Jadwal Servis Berikutnya (jika status completed) */}
                {watchUpdateStatus === 'completed' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/20 rounded-xl border border-border/60">
                    <FormField
                      control={statusForm.control}
                      name="next_service_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perkiraan Servis Berikutnya</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-9 text-xs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={statusForm.control}
                      name="next_service_odometer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Odometer Berikutnya (KM)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="Contoh: 50000" className="h-9 text-xs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Catatan / Alasan */}
                <FormField
                  control={statusForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Mekanik / Alasan Pembatalan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan rincian pengerjaan, pergantian sparepart, atau alasan pembatalan..."
                          rows={2}
                          className="text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {updateStatusMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan Status'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── MODAL DIALOG: JADWALKAN SERVIS BARU ─────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              Catat & Jadwalkan Servis Armada
            </DialogTitle>
            <DialogDescription>
              Masukkan rincian pemeliharaan atau perbaikan kendaraan operasional.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Armada Kendaraan *</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          const v = vehicles.find((x) => String(x.id) === String(val));
                          if (v) form.setValue('odometer_at_service', v.current_odometer);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Kendaraan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>
                              {v.name} ({v.license_plate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Pengerjaan Servis *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Servis *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="routine">Servis Berkala / Rutin</SelectItem>
                          <SelectItem value="repair">Perbaikan Kerusakan</SelectItem>
                          <SelectItem value="overhaul">Turun Mesin (Overhaul)</SelectItem>
                          <SelectItem value="inspection">Uji Kelayakan (KIR / Inspeksi)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Servis *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">Selesai Dikerjakan</SelectItem>
                          <SelectItem value="in_progress">Sedang Masuk Bengkel</SelectItem>
                          <SelectItem value="scheduled">Jadwal Terencana</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workshop_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Bengkel / Rekanan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Bengkel Sentral Pool Kendari" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimasi / Total Biaya (Rp) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="odometer_at_service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odometer Saat Ini (KM) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Servis Berikutnya</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_service_odometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odometer Servis Berikutnya</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Contoh: 50000" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan & Rincian Penggantian Sparepart</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Contoh: Penggantian oli mesin, filter oli, kampas rem depan..." rows={2} className="text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Data Servis'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
