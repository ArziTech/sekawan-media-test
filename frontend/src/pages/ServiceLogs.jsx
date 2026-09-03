import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wrench, Plus, Calendar, AlertTriangle, CheckCircle, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
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

const serviceLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Armada kendaraan wajib dipilih.'),
  service_date: z.string().min(1, 'Tanggal servis wajib diisi.'),
  service_type: z.enum(['routine', 'repair', 'inspection']),
  cost: z.coerce.number().min(0, 'Biaya servis tidak boleh negatif.'),
  workshop_name: z.string().min(2, 'Nama bengkel atau pihak mekanik minimal 2 karakter.'),
  odometer_at_service: z.coerce.number().min(0, 'Odometer tidak boleh negatif.'),
  next_service_date: z.string().optional(),
  next_service_odometer: z.coerce.number().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

export const ServiceLogs = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // React Hook Form
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

  // Mutation
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

  const onSubmit = (values) => {
    createMutation.mutate(values);
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
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const scheduledCount = logs.filter((l) => l.status === 'scheduled').length;
  const inProgressCount = logs.filter((l) => l.status === 'in_progress').length;
  const completedCount = logs.filter((l) => l.status === 'completed').length;

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
            Manajemen pemeliharaan rutin, perbaikan kendala teknis, dan jadwal servis berkala.
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
              className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs gap-1.5 h-9 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Servis</span>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Servis Terjadwal</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-amber-500">{scheduledCount} <span className="text-xs text-muted-foreground font-normal">Armada</span></div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Sedang Dikerjakan</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-blue-400">{inProgressCount} <span className="text-xs text-muted-foreground font-normal">Unit di Bengkel</span></div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Servis Selesai</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-500">{completedCount} <span className="text-xs text-muted-foreground font-normal">Riwayat</span></div>
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
                <TableHead className="py-3 px-4 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat riwayat servis...</p>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
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
                        {log.service_type === 'routine' ? 'Servis Rutin' : log.service_type === 'repair' ? 'Perbaikan' : 'Inspeksi'}
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
                    <TableCell className="py-3.5 px-4 text-right">
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form Jadwal Servis (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <FormLabel>Tanggal Pengerjaan *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <SelectItem value="inspection">Inspeksi Kelayakan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biaya Servis (Rp) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="1500000" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="workshop_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Bengkel / Rekanan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Bengkel Resmi Kendari" className="h-9 text-xs" {...field} />
                      </FormControl>
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
                          <SelectItem value="completed">Selesai (Completed)</SelectItem>
                          <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                          <SelectItem value="scheduled">Terjadwal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="odometer_at_service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odometer Saat Servis (KM) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
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
                      <FormLabel>Odometer Servis Berikutnya (KM)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Contoh: 25000" className="h-9 text-xs" {...field} />
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
                    <FormLabel>Deskripsi / Catatan Pengerjaan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Penggantian oli mesin, filter solar, tune-up..." rows={2} className="text-xs" {...field} />
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
                  disabled={createMutation.isPending}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs gap-1.5"
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
