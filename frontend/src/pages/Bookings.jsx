import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  User,
  MapPin,
  FileText,
  ShieldCheck,
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

export const Bookings = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Master options
  const [regions, setRegions] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [approversL1, setApproversL1] = useState([]);
  const [approversL2, setApproversL2] = useState([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Complete Trip modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [endOdo, setEndOdo] = useState('');

  // Form State
  const [formData, setFormData] = useState({
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
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setBookings(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar pemesanan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [regRes, vehRes, drivRes, usersRes] = await Promise.all([
        api.get('/regions'),
        api.get('/vehicles/available'),
        api.get('/drivers/available'),
        api.get('/auth/demo-users'),
      ]);

      if (regRes.data.success) setRegions(regRes.data.data.regions || []);
      if (vehRes.data.success) setAvailableVehicles(vehRes.data.data || []);
      if (drivRes.data.success) setAvailableDrivers(drivRes.data.data || []);

      if (usersRes.data.success) {
        const users = usersRes.data.data || [];
        setApproversL1(users.filter((u) => u.role === 'approver' && u.approval_tier === 1));
        setApproversL2(users.filter((u) => u.role === 'approver' && u.approval_tier === 2));
      }
    } catch (err) {
      console.error('Error fetching master data', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleOpenCreate = () => {
    fetchMasterData();
    setFormData({
      requester_name: '',
      requester_department: '',
      region_id: regions[0]?.id || '',
      destination_region_id: regions[2]?.id || '',
      vehicle_id: '',
      driver_id: '',
      start_date: '',
      end_date: '',
      purpose: '',
      approver_level_1_id: approversL1[0]?.id || '',
      approver_level_2_id: approversL2[0]?.id || '',
    });
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bookings', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsCreateOpen(false);
        fetchBookings();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membuat pemesanan.';
      toast.error(msg);
    }
  };

  const handleStartTrip = async (id) => {
    try {
      const res = await api.post(`/bookings/${id}/start-trip`);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsDetailOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memulai perjalanan.');
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/bookings/${selectedBooking.id}/complete-trip`, {
        end_odometer: parseInt(endOdo, 10),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsCompleteOpen(false);
        setIsDetailOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan perjalanan.');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Batalkan pemesanan ini?')) return;
    try {
      const res = await api.post(`/bookings/${id}/cancel`);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsDetailOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pemesanan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pemesanan Kendaraan
            </h1>
            {!isAdmin && user?.region && (
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs px-2.5 py-0.5 gap-1 font-semibold">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>{user.region.name}</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin
              ? 'Kelola transaksi pemesanan, penugasan supir, dan tracking alur persetujuan bertingkat.'
              : `Daftar pemesanan kendaraan yang berkaitan dengan wilayah cabang/site tugas Anda (${user?.region?.name || 'Cabang'}).`}
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenCreate} size="sm" className="font-bold text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Buat Pemesanan Baru
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-3 flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode booking, nama pemohon, divisi, mobil, supir..."
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
              Cari
            </Button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-44 h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Status</option>
              <option value="pending_level_1">Menunggu Level 1</option>
              <option value="pending_level_2">Menunggu Level 2</option>
              <option value="approved">Disetujui</option>
              <option value="in_use">Sedang Berjalan</option>
              <option value="completed">Selesai</option>
              <option value="rejected">Ditolak</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Kode Booking</TableHead>
                <TableHead>Pemohon & Divisi</TableHead>
                <TableHead>Rute Tambang</TableHead>
                <TableHead>Armada & Supir</TableHead>
                <TableHead>Jadwal Pakai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alur Persetujuan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p className="text-xs">Memuat data pemesanan...</p>
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data pemesanan yang cocok dengan kriteria.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => {
                  const l1 = b.approvals?.find((a) => a.approval_level === 1);
                  const l2 = b.approvals?.find((a) => a.approval_level === 2);

                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-bold text-amber-500 text-xs">
                        {b.booking_code}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground text-xs">{b.requester_name}</p>
                        <p className="text-[11px] text-muted-foreground">{b.requester_department}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground font-medium text-xs">{b.origin_region?.name}</p>
                        <p className="text-[11px] text-amber-500/90">&rarr; {b.destination_region?.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground text-xs">{b.vehicle?.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {b.vehicle?.license_plate} &middot; Supir: <span className="text-foreground">{b.driver?.name}</span>
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        <p className="text-foreground">
                          {new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          s/d {new Date(b.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={b.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <Badge
                            variant={l1?.status === 'approved' ? 'emerald' : l1?.status === 'rejected' ? 'destructive' : 'amber'}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            L1: {l1?.status}
                          </Badge>
                          <span className="text-muted-foreground">&rarr;</span>
                          <Badge
                            variant={l2?.status === 'approved' ? 'emerald' : l2?.status === 'rejected' ? 'destructive' : 'outline'}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            L2: {l2?.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 text-xs font-semibold text-amber-500 hover:text-amber-400 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Buat Pemesanan Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Pengajuan Pemesanan Kendaraan</DialogTitle>
            <DialogDescription>
              Isi parameter perjalanan dinas, tentukan armada & driver, serta penugasan approver berjenjang.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nama Pemohon *</label>
                <Input
                  required
                  value={formData.requester_name}
                  onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                  placeholder="Contoh: Hendri Prasetya"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Departemen / Divisi *</label>
                <Input
                  required
                  value={formData.requester_department}
                  onChange={(e) => setFormData({ ...formData, requester_department: e.target.value })}
                  placeholder="Contoh: Eksplorasi Geologi"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Lokasi Asal (Pool) *</label>
                <select
                  required
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Pilih Lokasi Asal</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Lokasi Tujuan *</label>
                <select
                  required
                  value={formData.destination_region_id}
                  onChange={(e) => setFormData({ ...formData, destination_region_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Pilih Lokasi Tujuan</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Pilih Kendaraan *</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Pilih Kendaraan Tersedia</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.license_plate}) - {v.type === 'passenger' ? 'Orang' : 'Barang'} [{v.ownership_type === 'owned' ? 'Milik' : 'Sewa'}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tentukan Supir / Driver *</label>
                <select
                  required
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Pilih Driver Siap Bertugas</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone}) - {d.region?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tanggal & Waktu Mulai *</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tanggal & Waktu Selesai *</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Approvers Tier Section */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Penetapan Pihak Penyetujui (2 Level Wajib)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground text-[11px]">
                    Penyetujui Level 1 (Supervisor) *
                  </label>
                  <select
                    required
                    value={formData.approver_level_1_id}
                    onChange={(e) => setFormData({ ...formData, approver_level_1_id: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Pilih Penyetujui Level 1</option>
                    {approversL1.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground text-[11px]">
                    Penyetujui Level 2 (Kepala Pool / GM) *
                  </label>
                  <select
                    required
                    value={formData.approver_level_2_id}
                    onChange={(e) => setFormData({ ...formData, approver_level_2_id: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Pilih Penyetujui Level 2</option>
                    {approversL2.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Keperluan Pemakaian *</label>
              <Textarea
                required
                rows={2}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Jelaskan kebutuhan operasional lapangan..."
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-bold">
                Kirim Pengajuan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail Pemesanan */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Detail Pemesanan:</span>
              <span className="font-mono text-amber-500">{selectedBooking?.booking_code}</span>
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap rute, armada, pengemudi, dan riwayat persetujuan bertingkat.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Status</span>
                  <div className="mt-1">
                    <BookingStatusBadge status={selectedBooking.status} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Pemohon</span>
                  <p className="font-bold text-foreground mt-1">{selectedBooking.requester_name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedBooking.requester_department}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Armada</span>
                  <p className="font-semibold text-foreground mt-1">{selectedBooking.vehicle?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedBooking.vehicle?.license_plate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Supir</span>
                  <p className="font-semibold text-foreground mt-1">{selectedBooking.driver?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedBooking.driver?.phone}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/60 space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Keperluan Pemakaian
                </span>
                <p className="text-foreground italic bg-muted/30 p-2 rounded-lg">
                  "{selectedBooking.purpose}"
                </p>
              </div>

              {/* Multi-Level Approval Step Timeline */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Alur Persetujuan Bertingkat (Level 1 & 2)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedBooking.approvals?.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">
                          Persetujuan Level {app.approval_level}
                        </span>
                        <Badge
                          variant={app.status === 'approved' ? 'emerald' : app.status === 'rejected' ? 'destructive' : 'amber'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground">{app.approver?.name}</p>
                      <p className="text-[11px] text-muted-foreground">{app.approver?.position}</p>
                      {app.notes && (
                        <p className="text-[11px] text-muted-foreground italic mt-1 bg-muted/40 p-1.5 rounded">
                          "{app.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2 border-t border-border/60">
                <div>
                  {isAdmin && selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      className="text-xs"
                    >
                      Batalkan Booking
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && selectedBooking.status === 'approved' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStartTrip(selectedBooking.id)}
                      className="font-bold text-xs gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Mulai Perjalanan
                    </Button>
                  )}

                  {isAdmin && selectedBooking.status === 'in_use' && (
                    <Button
                      variant="blue"
                      size="sm"
                      onClick={() => {
                        setEndOdo(selectedBooking.start_odometer || selectedBooking.vehicle?.current_odometer || 0);
                        setIsCompleteOpen(true);
                      }}
                      className="font-bold text-xs gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Selesaikan Perjalanan
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                    Tutup
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Selesaikan Perjalanan */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penyelesaian Perjalanan</DialogTitle>
            <DialogDescription>
              Masukkan angka odometer akhir pada speedometer kendaraan saat kembali ke pool.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteTrip} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Odometer Akhir (KM) *</label>
              <Input
                type="number"
                required
                min={selectedBooking?.start_odometer || 0}
                value={endOdo}
                onChange={(e) => setEndOdo(e.target.value)}
                className="h-10 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Odometer awal: {selectedBooking?.start_odometer || 0} KM
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCompleteOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="blue" size="sm" className="font-bold text-xs">
                Simpan & Selesaikan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
