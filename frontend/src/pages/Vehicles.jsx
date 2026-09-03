import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Truck, Plus, Search, Filter, Wrench, Fuel, MapPin, Building2, Edit2, Trash2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { VehicleStatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';

const vehicleSchema = z.object({
  name: z.string().min(2, 'Nama kendaraan minimal 2 karakter.'),
  license_plate: z.string().min(3, 'Nomor plat nomor wajib diisi.'),
  type: z.enum(['passenger', 'cargo']),
  ownership_type: z.enum(['owned', 'rented']),
  rental_company_id: z.string().optional(),
  region_id: z.string().min(1, 'Wilayah pool wajib dipilih.'),
  fuel_type: z.string().min(1, 'Jenis BBM wajib diisi.'),
  current_odometer: z.coerce.number().min(0, 'Odometer tidak boleh negatif.'),
  status: z.enum(['available', 'in_use', 'in_service']),
});

export const Vehicles = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(null);

  // TanStack Query: Master data
  const { data: masterData = { regions: [], rental_companies: [] } } = useQuery({
    queryKey: ['regions-master'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data?.data || { regions: [], rental_companies: [] };
    },
  });

  const regions = masterData.regions || [];
  const rentalCompanies = masterData.rental_companies || [];

  // TanStack Query: Vehicles list
  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicles', { search, typeFilter, ownershipFilter, statusFilter }],
    queryFn: async () => {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'all') params.type = typeFilter;
      if (ownershipFilter !== 'all') params.ownership_type = ownershipFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/vehicles', { params });
      return res.data?.data || [];
    },
  });

  // React Hook Form
  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: '',
      license_plate: '',
      type: 'passenger',
      ownership_type: 'owned',
      rental_company_id: '',
      region_id: '',
      fuel_type: 'Solar Dexlite',
      current_odometer: 0,
      status: 'available',
    },
  });

  const selectedOwnership = form.watch('ownership_type');

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        region_id: parseInt(values.region_id),
        rental_company_id: values.ownership_type === 'rented' && values.rental_company_id ? parseInt(values.rental_company_id) : null,
      };

      if (editingVehicle) {
        return api.put(`/vehicles/${editingVehicle.id}`, payload);
      } else {
        return api.post('/vehicles', payload);
      }
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Data kendaraan berhasil disimpan.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data kendaraan.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/vehicles/${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Kendaraan berhasil dihapus.');
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus kendaraan.');
    },
  });

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    form.reset({
      name: '',
      license_plate: '',
      type: 'passenger',
      ownership_type: 'owned',
      rental_company_id: rentalCompanies[0] ? String(rentalCompanies[0].id) : '',
      region_id: regions[0] ? String(regions[0].id) : '',
      fuel_type: 'Solar Dexlite',
      current_odometer: 0,
      status: 'available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    form.reset({
      name: v.name,
      license_plate: v.license_plate,
      type: v.type,
      ownership_type: v.ownership_type,
      rental_company_id: v.rental_company_id ? String(v.rental_company_id) : '',
      region_id: String(v.region_id),
      fuel_type: v.fuel_type,
      current_odometer: v.current_odometer,
      status: v.status,
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (v) => {
    setDeletingVehicle(v);
    setIsDeleteOpen(true);
  };

  const onSubmit = (values) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            Inventaris Armada Tambang
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen armada operasional milik perusahaan dan unit sewaan di seluruh wilayah pool.
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
              <span>Tambah Kendaraan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar with shadcn Select & Input */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari armada, plat nomor, atau model..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Tipe */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="passenger">Penumpang</SelectItem>
                <SelectItem value="cargo">Angkutan Barang</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Kepemilikan */}
            <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                <SelectValue placeholder="Semua Kepemilikan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kepemilikan</SelectItem>
                <SelectItem value="owned">Milik Sendiri</SelectItem>
                <SelectItem value="rented">Sewa (Rental)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="in_use">Digunakan</SelectItem>
                <SelectItem value="in_service">Dalam Servis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">Kendaraan</TableHead>
                <TableHead className="py-3 px-4">Tipe & BBM</TableHead>
                <TableHead className="py-3 px-4">Kepemilikan</TableHead>
                <TableHead className="py-3 px-4">Wilayah Pool</TableHead>
                <TableHead className="py-3 px-4">Odometer</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                {isAdmin && <TableHead className="py-3 px-4 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat inventaris armada...</p>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data kendaraan yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-xs">{v.name}</div>
                      <div className="font-mono text-[11px] text-amber-500 font-bold">{v.license_plate}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground">{v.type === 'passenger' ? 'Orang (Penumpang)' : 'Barang (Logistik)'}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-emerald-500" />
                        {v.fuel_type}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {v.ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa (Rental)'}
                      </Badge>
                      {v.rental_company && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          {v.rental_company.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        {v.region?.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{v.region?.code}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono font-medium text-foreground">
                      {Number(v.current_odometer).toLocaleString('id-ID')} km
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <VehicleStatusBadge status={v.status} />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleOpenEdit(v)}
                            title="Edit Kendaraan"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleOpenDelete(v)}
                            className="hover:border-rose-500/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"
                            title="Hapus Kendaraan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form Tambah/Edit Kendaraan (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              {editingVehicle ? 'Edit Data Kendaraan' : 'Tambah Unit Kendaraan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? `Perbarui spesifikasi dan status armada ${editingVehicle.name} (${editingVehicle.license_plate}).`
                : 'Daftarkan unit kendaraan baru ke dalam sistem inventaris tambang.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Model Kendaraan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota Hilux 4x4 D-Cab" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="license_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Polisi / Plat *</FormLabel>
                      <FormControl>
                        <Input placeholder="B 9101 NKL" className="h-9 text-xs font-mono uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Kendaraan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="passenger">Orang (Penumpang)</SelectItem>
                          <SelectItem value="cargo">Barang (Logistik Tambang)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownership_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kepemilikan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Kepemilikan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owned">Milik Sendiri (Perusahaan)</SelectItem>
                          <SelectItem value="rented">Sewa (Rental Eksternal)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedOwnership === 'rented' && (
                <FormField
                  control={form.control}
                  name="rental_company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perusahaan Penyedia Sewa (Vendor) *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Perusahaan Rental" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rentalCompanies.map((rc) => (
                            <SelectItem key={rc.id} value={String(rc.id)}>
                              {rc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="region_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wilayah Pool Penempatan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Wilayah Pool" />
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
                  control={form.control}
                  name="fuel_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Bahan Bakar *</FormLabel>
                      <FormControl>
                        <Input placeholder="Solar Dexlite" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="current_odometer"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Kesiapan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Tersedia (Ready)</SelectItem>
                          <SelectItem value="in_use">Sedang Digunakan</SelectItem>
                          <SelectItem value="in_service">Dalam Servis (Maintenance)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveMutation.isPending ? 'Menyimpan...' : editingVehicle ? 'Simpan Perubahan' : 'Tambah Unit'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Konfirmasi Hapus */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              Hapus Unit Kendaraan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deletingVehicle?.name}</strong> ({deletingVehicle?.license_plate}) dari armada?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1 text-rose-400">
            <p className="font-bold">Peringatan:</p>
            <p>Data kendaraan yang sedang memiliki jadwal pemesanan aktif tidak dapat dihapus.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingVehicle.id)}
              className="font-bold text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Kendaraan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
