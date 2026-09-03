import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { cn } from "@/lib/utils";

export function UsersManagement() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Modal Form State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'approver',
    approval_tier: '1',
    position: '',
    region_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
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
      if (res.data?.success) {
        setUsers(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await api.get('/regions');
      if (res.data?.success && res.data.data?.regions) {
        setRegions(res.data.data.regions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, regionFilter]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
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
    setFormData({
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

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Nama dan Email wajib diisi.');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('Kata sandi wajib diisi untuk pengguna baru.');
      return;
    }

    if (!formData.region_id) {
      toast.error('Wilayah tugas wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        approval_tier: formData.role === 'approver' ? parseInt(formData.approval_tier) : null,
        position: formData.position.trim(),
        region_id: parseInt(formData.region_id),
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingUser) {
        const res = await api.put(`/users/${editingUser.id}`, payload);
        if (res.data?.success) {
          toast.success('Data pengguna berhasil diperbarui.');
          setIsFormModalOpen(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', payload);
        if (res.data?.success) {
          toast.success('Pengguna baru berhasil ditambahkan.');
          setIsFormModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (u) => {
    setDeletingUser(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/users/${deletingUser.id}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Pengguna berhasil dihapus.');
        setIsDeleteModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna.');
    } finally {
      setDeleting(false);
    }
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
            onClick={fetchUsers}
            disabled={loading}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Segarkan</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs gap-1.5 h-9 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
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

            {/* Filter Role */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Semua Peran / Role</option>
                <option value="admin">Administrator (Admin Pool)</option>
                <option value="approver_1">Penyetujui Level 1 (Supervisor)</option>
                <option value="approver_2">Penyetujui Level 2 (Kepala Pool/GM)</option>
              </select>

              {/* Filter Region */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Semua Wilayah</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
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
              {loading ? (
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

      {/* Modal Form: Tambah / Edit Pengguna */}
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

          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nama Lengkap & Gelar *</label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Ir. Bambang Sutrisno, M.T."
                className="text-xs h-9"
              />
            </div>

            {/* Email Login */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Email Login *</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Contoh: approver1@tambang.com"
                className="text-xs h-9"
              />
            </div>

            {/* Kata Sandi */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Kata Sandi {editingUser ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Minimal 6 karakter baru...' : 'Minimal 6 karakter...'}
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>

            {/* Grid: Role & Approval Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Peran Sistem (Role) *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:ring-1 focus:ring-amber-500"
                >
                  <option value="approver">Penyetujui (Approver)</option>
                  <option value="admin">Administrator Pool</option>
                </select>
              </div>

              {formData.role === 'approver' && (
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Tingkat Persetujuan (Tier) *</label>
                  <select
                    value={formData.approval_tier}
                    onChange={(e) => setFormData({ ...formData, approval_tier: e.target.value })}
                    className="w-full h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="1">Level 1 - Supervisor Operasional</option>
                    <option value="2">Level 2 - Kepala Pool / GM Tambang</option>
                  </select>
                </div>
              )}
            </div>

            {/* Jabatan Resmi */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Jabatan Resmi (Position)</label>
              <Input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Contoh: Supervisor Operasional Lapangan"
                className="text-xs h-9"
              />
            </div>

            {/* Wilayah Tugas */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Wilayah Penempatan / Tugas *</label>
              <select
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:ring-1 focus:ring-amber-500"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {submitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Daftarkan User'}
              </Button>
            </DialogFooter>
          </form>
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
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="font-bold text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
