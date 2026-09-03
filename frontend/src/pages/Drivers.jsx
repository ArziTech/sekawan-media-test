import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Plus, Search, Edit2, Trash2, Phone, CreditCard, MapPin, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { DriverStatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';

const driverSchema = z.object({
  name: z.string().min(2, 'Nama supir minimal 2 karakter.'),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit.').regex(/^[0-9\-\+\s]+$/, 'Format nomor telepon tidak valid.'),
  license_number: z.string().min(5, 'Nomor SIM minimal 5 karakter.'),
  region_id: z.string().min(1, 'Wilayah penempatan wajib dipilih.'),
  status: z.enum(['available', 'on_duty', 'off_duty']),
});

export const Drivers = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState(null);

  // TanStack Query: Fetch Regions
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data?.data?.regions || [];
    },
  });

  // TanStack Query: Fetch Drivers
  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ['drivers', { search, statusFilter, regionFilter }],
    queryFn: async () => {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (regionFilter !== 'all') params.region_id = regionFilter;
      const res = await api.get('/drivers', { params });
      return res.data?.data || [];
    },
  });

  // React Hook Form
  const form = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      phone: '',
      license_number: '',
      region_id: '',
      status: 'available',
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        region_id: parseInt(values.region_id),
      };

      if (editingDriver) {
        return api.put(`/drivers/${editingDriver.id}`, payload);
      } else {
        return api.post('/drivers', payload);
      }
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Data supir berhasil disimpan.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data supir.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/drivers/${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Supir berhasil dihapus.');
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus supir.');
    },
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    form.reset({
      name: '',
      phone: '',
      license_number: '',
      region_id: regions[0] ? String(regions[0].id) : '',
      status: 'available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDriver(d);
    form.reset({
      name: d.name,
      phone: d.phone,
      license_number: d.license_number,
      region_id: String(d.region_id),
      status: d.status,
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (d) => {
    setDeletingDriver(d);
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
            <Users className="w-6 h-6 text-cyan-500" />
            Master Personil Supir
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar supir operasional tambang, lisensi mengemudi, dan penempatan wilayah pool.
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
              <span>Tambah Supir</span>
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
              placeholder="Cari supir, nomor SIM, atau nomor HP..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Status (shadcn Select) */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="available">Tersedia (Siap)</SelectItem>
                <SelectItem value="on_duty">Sedang Bertugas</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Wilayah (shadcn Select) */}
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-52 h-9 text-xs">
                <SelectValue placeholder="Semua Wilayah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Wilayah</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name} ({r.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">Nama Personil</TableHead>
                <TableHead className="py-3 px-4">Nomor SIM</TableHead>
                <TableHead className="py-3 px-4">Kontak Telepon</TableHead>
                <TableHead className="py-3 px-4">Wilayah Tugas</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                {isAdmin && <TableHead className="py-3 px-4 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat personil supir...</p>
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data supir yang cocok dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-xs">{d.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">ID: #{d.id}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                        <span>{d.license_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{d.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        {d.region?.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{d.region?.code}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <DriverStatusBadge status={d.status} />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleOpenEdit(d)}
                            title="Edit Data Supir"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleOpenDelete(d)}
                            className="hover:border-rose-500/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"
                            title="Hapus Supir"
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

      {/* Modal Form Tambah/Edit Supir (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-500" />
              {editingDriver ? 'Edit Data Supir' : 'Tambah Personil Supir Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingDriver
                ? `Perbarui informasi personil supir ${editingDriver.name}.`
                : 'Daftarkan personil supir operasional baru ke sistem pool tambang.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap Supir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Budi Santoso" className="h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor SIM BII Umum *</FormLabel>
                      <FormControl>
                        <Input placeholder="SIM-99887766" className="h-9 text-xs font-mono uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon / WA *</FormLabel>
                      <FormControl>
                        <Input placeholder="0812-3456-7890" className="h-9 text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="region_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wilayah Tugas *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Wilayah" />
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
                          <SelectItem value="available">Tersedia (Siap)</SelectItem>
                          <SelectItem value="on_duty">Sedang Bertugas</SelectItem>
                          <SelectItem value="off_duty">Off Duty</SelectItem>
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
                  size="sm"
                  disabled={saveMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveMutation.isPending ? 'Menyimpan...' : editingDriver ? 'Simpan Perubahan' : 'Daftarkan Supir'}
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
              Hapus Data Supir
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data supir <strong>{deletingDriver?.name}</strong> ({deletingDriver?.license_number})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1 text-rose-400">
            <p className="font-bold">Peringatan:</p>
            <p>Supir yang sedang menjalankan tugas perjalanan aktif tidak dapat dihapus.</p>
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
              onClick={() => deleteMutation.mutate(deletingDriver.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Supir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
