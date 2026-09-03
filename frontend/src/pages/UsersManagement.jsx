import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  UserCog,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { cn } from "@/lib/utils";

const userSchema = z.object({
  name: z.string().min(3, 'Nama lengkap minimal 3 karakter.'),
  email: z.string().min(1, 'Email login wajib diisi.').email('Format email tidak valid.'),
  password: z.string().optional(),
  role: z.enum(['admin', 'approver']),
  approval_tier: z.string().optional(),
  position: z.string().optional(),
  region_id: z.string().min(1, 'Wilayah tugas wajib dipilih.'),
});

export function UsersManagement() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Modal Form State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // TanStack Query: Fetch Regions
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data?.data?.regions || [];
    },
  });

  // TanStack Query: Fetch Users
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users', { search, roleFilter, regionFilter }],
    queryFn: async () => {
      let params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'all') {
        if (roleFilter === 'admin') {
          params.role = 'admin';
        } else if (roleFilter === 'approver_1') {
          params.role = 'approver';
          params.approval_tier = 1;
        } else if (roleFilter === 'approver_2') {
          params.role = 'approver';
          params.approval_tier = 2;
        }
      }
      if (regionFilter !== 'all') {
        params.region_id = regionFilter;
      }
      const res = await api.get('/users', { params });
      return res.data?.data?.data || [];
    },
  });

  // React Hook Form
  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'approver',
      approval_tier: '1',
      position: '',
      region_id: '',
    },
  });

  const selectedRole = form.watch('role');

  // TanStack Query: Mutations
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        approval_tier: values.role === 'approver' ? parseInt(values.approval_tier) : null,
        position: values.position?.trim() || null,
        region_id: parseInt(values.region_id),
      };

      if (values.password && values.password.trim()) {
        payload.password = values.password.trim();
      }

      if (editingUser) {
        return api.put(`/users/${editingUser.id}`, payload);
      } else {
        if (!payload.password) {
          throw new Error('Kata sandi wajib diisi untuk pengguna baru.');
        }
        return api.post('/users', payload);
      }
    },
    onSuccess: (res) => {
      toast.success(editingUser ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.');
      setIsFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan data pengguna.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Pengguna berhasil dihapus.');
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna.');
    },
  });

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    form.reset({
      name: '',
      email: '',
      password: '',
      role: 'approver',
      approval_tier: '1',
      position: '',
      region_id: regions.length > 0 ? String(regions[0].id) : '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    form.reset({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      approval_tier: u.approval_tier ? String(u.approval_tier) : '1',
      position: u.position || '',
      region_id: u.region_id ? String(u.region_id) : (regions.length > 0 ? String(regions[0].id) : ''),
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (u) => {
    setDeletingUser(u);
    setIsDeleteModalOpen(true);
  };

  const onSubmitForm = (values) => {
    if (!editingUser && (!values.password || values.password.length < 6)) {
      form.setError('password', { message: 'Kata sandi minimal 6 karakter untuk pengguna baru.' });
      return;
    }
    saveMutation.mutate(values);
  };

  const getRoleBadge = (u) => {
    if (u.role === 'admin') {
      return (
        <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1 text-[10px]">
          <Shield className="w-3 h-3" />
          Admin Pool
        </Badge>
      );
    }
    if (u.approval_tier === 1) {
      return (
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 text-[10px]">
          <ShieldCheck className="w-3 h-3" />
          Penyetujui L1 (Supervisor)
        </Badge>
      );
    }
    return (
      <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 gap-1 text-[10px]">
        <ShieldCheck className="w-3 h-3" />
        Penyetujui L2 (Kepala Pool/GM)
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-amber-500" />
            Manajemen Pengguna & Otorisasi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pengelolaan akun administrator pool, penugasan pihak penyetujui (Approver Level 1 & 2), dan penempatan wilayah kerja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetchUsers()}
            disabled={loadingUsers}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loadingUsers && "animate-spin")} />
            <span>Segarkan</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateModal}
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar with shadcn Select */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama, email, atau jabatan..."
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Filter Role (shadcn Select) */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-56 h-9 text-xs">
                  <SelectValue placeholder="Semua Peran / Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Peran / Role</SelectItem>
                  <SelectItem value="admin">Administrator (Admin Pool)</SelectItem>
                  <SelectItem value="approver_1">Penyetujui Level 1 (Supervisor)</SelectItem>
                  <SelectItem value="approver_2">Penyetujui Level 2 (Kepala Pool/GM)</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Region (shadcn Select) */}
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full md:w-52 h-9 text-xs">
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">Nama & Kredensial</TableHead>
                <TableHead className="py-3 px-4">Peran & Tingkat</TableHead>
                <TableHead className="py-3 px-4">Jabatan Resmi</TableHead>
                <TableHead className="py-3 px-4">Wilayah Tugas</TableHead>
                <TableHead className="py-3 px-4">Terdaftar</TableHead>
                <TableHead className="py-3 px-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat data pengguna...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data pengguna yang sesuai dengan filter pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-500/20">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                                  (Anda)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(u)}</td>
                      <td className="py-3.5 px-4 text-xs font-medium text-foreground max-w-xs truncate">
                        {u.position || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{u.region?.name || 'Semua Wilayah'}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{u.region?.code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit Data Pengguna"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                            className="hover:border-rose-500/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form: Tambah / Edit Pengguna (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-amber-500" />
              {editingUser ? 'Perbarui Data Pengguna' : 'Tambah Pengguna Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? `Mengubah informasi akun ${editingUser.name}.`
                : 'Lengkapi formulir di bawah untuk mendaftarkan akun administrator atau approver baru.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4 text-xs">
              {/* Nama Lengkap */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap & Gelar *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Ir. Bambang Sutrisno, M.T."
                        className="text-xs h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Login */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Login *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Contoh: approver1@tambang.com"
                        className="text-xs h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kata Sandi */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kata Sandi {editingUser ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={editingUser ? 'Minimal 6 karakter baru...' : 'Minimal 6 karakter...'}
                          className="pl-9 text-xs h-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grid: Role & Approval Tier (shadcn Select) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peran Sistem (Role) *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="approver">Penyetujui (Approver)</SelectItem>
                          <SelectItem value="admin">Administrator Pool</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRole === 'approver' && (
                  <FormField
                    control={form.control}
                    name="approval_tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tingkat Persetujuan (Tier) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pilih Tingkat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Level 1 - Supervisor</SelectItem>
                            <SelectItem value="2">Level 2 - Kepala Pool/GM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Jabatan Resmi */}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan Resmi (Position)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Supervisor Operasional Lapangan"
                        className="text-xs h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Wilayah Tugas (shadcn Select) */}
              <FormField
                control={form.control}
                name="region_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wilayah Penempatan / Tugas *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Wilayah Penugasan" />
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

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saveMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveMutation.isPending
                    ? 'Menyimpan...'
                    : editingUser
                    ? 'Simpan Perubahan'
                    : 'Daftarkan User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Konfirmasi Hapus */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              Hapus Akun Pengguna
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{deletingUser?.name}</strong> ({deletingUser?.email})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1 text-rose-400">
            <p className="font-bold">Perhatian:</p>
            <p>Pengguna yang memiliki riwayat transaksi aktif tidak dapat dihapus demi menjaga integritas data audit log.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingUser.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
