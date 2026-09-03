import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Search,
  Calendar,
  Eye,
  Play,
  CheckCircle,
  Truck,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
import { BookingStatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';

const bookingSchema = z.object({
  requester_name: z.string().min(2, 'Nama pemohon minimal 2 karakter.'),
  requester_department: z.string().min(2, 'Divisi/departemen wajib diisi.'),
  region_id: z.string().min(1, 'Wilayah asal pool wajib dipilih.'),
  destination_region_id: z.string().min(1, 'Wilayah tujuan wajib dipilih.'),
  vehicle_id: z.string().min(1, 'Armada kendaraan wajib dipilih.'),
  driver_id: z.string().optional(),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi.'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi.'),
  purpose: z.string().min(5, 'Keperluan pemakaian minimal 5 karakter.'),
  approver_level_1_id: z.string().min(1, 'Penyetujui Level 1 wajib dipilih.'),
  approver_level_2_id: z.string().min(1, 'Penyetujui Level 2 wajib dipilih.'),
});

const completeTripSchema = z.object({
  end_odometer: z.coerce.number().min(0, 'Odometer akhir tidak boleh negatif.'),
});

export const Bookings = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  // TanStack Query: Master Options
  const { data: masterData = { regions: [], vehicles: [], drivers: [], approversL1: [], approversL2: [] } } = useQuery({
    queryKey: ['booking-master-options'],
    queryFn: async () => {
      const [regRes, vehRes, drivRes, usersRes] = await Promise.all([
        api.get('/regions'),
        api.get('/vehicles/available'),
        api.get('/drivers/available'),
        api.get('/auth/demo-users'),
      ]);

      const users = usersRes.data?.data || [];
      return {
        regions: regRes.data?.data?.regions || [],
        vehicles: vehRes.data?.data || [],
        drivers: drivRes.data?.data || [],
        approversL1: users.filter((u) => u.role === 'approver' && u.approval_tier === 1),
        approversL2: users.filter((u) => u.role === 'approver' && u.approval_tier === 2),
      };
    },
  });

  const regions = masterData.regions || [];
  const availableVehicles = masterData.vehicles || [];
  const availableDrivers = masterData.drivers || [];
  const approversL1 = masterData.approversL1 || [];
  const approversL2 = masterData.approversL2 || [];

  // TanStack Query: Bookings
  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['bookings', { search, statusFilter }],
    queryFn: async () => {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/bookings', { params });
      return res.data?.data?.data || [];
    },
  });

  // React Hook Form for Create Booking
  const createForm = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      requester_name: '',
      requester_department: '',
      region_id: '',
      destination_region_id: '',
      vehicle_id: '',
      driver_id: '',
      start_date: '',
      end_date: '',
      purpose: '',
      approver_level_1_id: '',
      approver_level_2_id: '',
    },
  });

  // React Hook Form for Complete Trip
  const completeForm = useForm({
    resolver: zodResolver(completeTripSchema),
    defaultValues: {
      end_odometer: 0,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        requester_name: values.requester_name.trim(),
        requester_department: values.requester_department.trim(),
        department: values.requester_department.trim(),
        region_id: parseInt(values.region_id),
        destination_region_id: parseInt(values.destination_region_id),
        vehicle_id: parseInt(values.vehicle_id),
        driver_id: values.driver_id ? parseInt(values.driver_id) : null,
        start_date: values.start_date,
        end_date: values.end_date,
        purpose: values.purpose.trim(),
        approver_level_1_id: parseInt(values.approver_level_1_id),
        approver_level_2_id: parseInt(values.approver_level_2_id),
      };
      return api.post('/bookings', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Pemesanan kendaraan berhasil dibuat.');
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-master-options'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal membuat pemesanan.');
    },
  });

  const startTripMutation = useMutation({
    mutationFn: async (bookingId) => {
      return api.post(`/bookings/${bookingId}/start-trip`);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Perjalanan kendaraan telah dimulai.');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['regions-overview'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal memulai perjalanan.');
    },
  });

  const completeTripMutation = useMutation({
    mutationFn: async ({ bookingId, endOdo }) => {
      return api.post(`/bookings/${bookingId}/complete-trip`, {
        end_odometer: endOdo,
      });
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Perjalanan selesai & odometer berhasil diperbarui.');
      setIsCompleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['regions-overview'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan perjalanan.');
    },
  });

  const handleOpenCreate = () => {
    createForm.reset({
      requester_name: '',
      requester_department: '',
      region_id: regions[0] ? String(regions[0].id) : '',
      destination_region_id: regions[2] ? String(regions[2].id) : regions[1] ? String(regions[1].id) : '',
      vehicle_id: availableVehicles[0] ? String(availableVehicles[0].id) : '',
      driver_id: availableDrivers[0] ? String(availableDrivers[0].id) : '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      purpose: '',
      approver_level_1_id: approversL1[0] ? String(approversL1[0].id) : '',
      approver_level_2_id: approversL2[0] ? String(approversL2[0].id) : '',
    });
    setIsCreateOpen(true);
  };

  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const handleOpenComplete = (booking) => {
    setSelectedBooking(booking);
    completeForm.reset({
      end_odometer: (booking.start_odometer || booking.vehicle?.current_odometer || 0) + 25,
    });
    setIsCompleteOpen(true);
  };

  const onSubmitCreate = (values) => {
    createMutation.mutate(values);
  };

  const onSubmitComplete = (values) => {
    const startOdo = selectedBooking?.start_odometer || selectedBooking?.vehicle?.current_odometer || 0;
    if (values.end_odometer < startOdo) {
      completeForm.setError('end_odometer', {
        message: `Odometer akhir (${values.end_odometer} km) tidak boleh lebih kecil dari odometer awal (${startOdo} km).`,
      });
      return;
    }
    completeTripMutation.mutate({
      bookingId: selectedBooking.id,
      endOdo: values.end_odometer,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-500" />
              Pemesanan Kendaraan (Bookings)
            </h1>
            {!isAdmin && user?.region && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs font-semibold gap-1">
                <MapPin className="w-3 h-3" />
                Wilayah: {user.region.name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar permohonan kendaraan dinas tambang, tracking persetujuan 2 tingkat, dan siklus perjalanan.
          </p>
        </div>

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

          {isAdmin && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pemesanan Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar with shadcn Select & Input */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode booking, pemohon, plat nomor, atau divisi..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52 h-9 text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending_approval_1">Menunggu Persetujuan L1</SelectItem>
              <SelectItem value="pending_approval_2">Menunggu Persetujuan L2</SelectItem>
              <SelectItem value="approved">Disetujui (Siap Berangkat)</SelectItem>
              <SelectItem value="in_progress">Dalam Perjalanan</SelectItem>
              <SelectItem value="completed">Selesai (Completed)</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">No. Booking</TableHead>
                <TableHead className="py-3 px-4">Pemohon & Divisi</TableHead>
                <TableHead className="py-3 px-4">Armada & Supir</TableHead>
                <TableHead className="py-3 px-4">Rute (Asal &rarr; Tujuan)</TableHead>
                <TableHead className="py-3 px-4">Jadwal Pakai</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                <TableHead className="py-3 px-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat data pemesanan kendaraan...</p>
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data pemesanan yang sesuai dengan kriteria.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4 text-xs font-mono font-bold text-amber-500">
                      {b.booking_code}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-foreground">{b.requester_name}</div>
                      <div className="text-[10px] text-muted-foreground">{b.requester_department || b.department}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        {b.vehicle?.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">{b.vehicle?.license_plate}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        {b.driver ? b.driver.name : 'Tanpa Supir'}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{b.origin_region?.name}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>{b.destination_region?.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{b.purpose}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono">
                      <div className="text-foreground">{new Date(b.start_date).toLocaleDateString('id-ID')}</div>
                      <div className="text-[10px] text-muted-foreground">s/d {new Date(b.end_date).toLocaleDateString('id-ID')}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <BookingStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() => handleOpenDetail(b)}
                          title="Lihat Detail Pemesanan"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>

                        {/* Start Trip Button */}
                        {isAdmin && b.status === 'approved' && (
                          <Button
                            type="button"
                            variant="blue"
                            size="xs"
                            onClick={() => startTripMutation.mutate(b.id)}
                            disabled={startTripMutation.isPending}
                          >
                            <Play className="w-3 h-3" />
                            <span>Mulai Trip</span>
                          </Button>
                        )}

                        {/* Complete Trip Button */}
                        {isAdmin && b.status === 'in_progress' && (
                          <Button
                            type="button"
                            variant="emerald"
                            size="xs"
                            onClick={() => handleOpenComplete(b)}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Selesai</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form: Buat Pemesanan Baru (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Buat Permohonan Pemesanan Kendaraan
            </DialogTitle>
            <DialogDescription>
              Isi formulir di bawah untuk mengajukan permohonan armada operasional dinas.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4 text-xs">
              {/* Pemohon & Divisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="requester_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pemohon *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Budi Pratama" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="requester_department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Divisi / Departemen *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Geologi & Eksplorasi" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Rute Asal & Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="region_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wilayah Pool Asal *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Pool Asal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.name} ({r.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="destination_region_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wilayah Tujuan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Tujuan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.name} ({r.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pilihan Kendaraan & Supir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Unit Armada Siap *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Armada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>
                              {v.name} ({v.license_plate}) - {v.region?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="driver_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Personil Supir (Opsional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Tanpa Supir (Lepas Kunci)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Tanpa Supir (Lepas Kunci)</SelectItem>
                          {availableDrivers.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name} ({d.region?.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tanggal Mulai & Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Keberangkatan *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Pengembalian *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Keperluan Dinas */}
              <FormField
                control={createForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keperluan & Justifikasi Pemakaian *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Contoh: Inspeksi geologi dan survei pit tambang nikel..." rows={2} className="text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Penyetujui Berjenjang (Level 1 & Level 2) */}
              <div className="p-3.5 bg-muted/30 border border-border/80 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Alur Otorisasi Bertingkat (Approval Flow)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="approver_level_1_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penyetujui Level 1 (Supervisor) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pilih Approver L1" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {approversL1.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.name} ({u.position || 'Supervisor'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="approver_level_2_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penyetujui Level 2 (Kepala Pool/GM) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pilih Approver L2" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {approversL2.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.name} ({u.position || 'General Manager'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {createMutation.isPending ? 'Mengajukan...' : 'Ajukan Pemesanan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Selesaikan Perjalanan (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
              Selesaikan Perjalanan Kendaraan
            </DialogTitle>
            <DialogDescription>
              Catat odometer akhir armada saat kembali ke pool untuk permohonan <strong>{selectedBooking?.booking_code}</strong>.
            </DialogDescription>
          </DialogHeader>

          <Form {...completeForm}>
            <form onSubmit={completeForm.handleSubmit(onSubmitComplete)} className="space-y-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 border border-border/60">
                <div className="flex justify-between text-muted-foreground">
                  <span>Odometer Awal Keberangkatan:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedBooking?.start_odometer || selectedBooking?.vehicle?.current_odometer || 0} km
                  </span>
                </div>
              </div>

              <FormField
                control={completeForm.control}
                name="end_odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer Akhir Kedatangan (KM) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={selectedBooking?.start_odometer || 0}
                        placeholder="Contoh: 15450"
                        className="h-9 text-xs font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCompleteOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="emerald"
                  size="sm"
                  disabled={completeTripMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completeTripMutation.isPending ? 'Menyimpan...' : 'Selesaikan & Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Detail Pemesanan */}
      {selectedBooking && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="font-mono text-amber-500 font-bold">{selectedBooking.booking_code}</span>
                <BookingStatusBadge status={selectedBooking.status} />
              </DialogTitle>
              <DialogDescription>
                Rincian informasi permohonan armada dan riwayat persetujuan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nama Pemohon</span>
                  <span className="font-bold text-foreground">{selectedBooking.requester_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Divisi / Departemen</span>
                  <span className="font-bold text-foreground">{selectedBooking.requester_department || selectedBooking.department}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Armada Kendaraan</span>
                  <span className="font-bold text-foreground">{selectedBooking.vehicle?.name} ({selectedBooking.vehicle?.license_plate})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Personil Supir</span>
                  <span className="font-bold text-foreground">{selectedBooking.driver?.name || 'Tanpa Supir (Lepas Kunci)'}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold block mb-1">Rute & Tujuan:</span>
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border/60">
                  <div className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedBooking.origin_region?.name}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedBooking.destination_region?.name}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{selectedBooking.purpose}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold block mb-1">Alur Persetujuan:</span>
                <div className="space-y-2">
                  {selectedBooking.approvals?.map((a) => (
                    <div key={a.id} className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">
                          {a.tier_level === 1 ? 'Penyetujui Level 1 (Supervisor)' : 'Penyetujui Level 2 (Kepala Pool/GM)'}
                        </span>
                        {a.notes && <p className="text-[11px] text-muted-foreground mt-0.5 font-italic">"{a.notes}"</p>}
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {a.status === 'approved' ? 'Disetujui' : a.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
