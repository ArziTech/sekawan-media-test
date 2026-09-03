import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Wrench,
  Fuel,
  MapPin,
  Building2,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Calendar,
  User,
  History,
  Clock,
  CheckCircle,
  XCircle,
  Gauge,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
import { VehicleStatusBadge, BookingStatusBadge } from '@/components/common/StatusBadge';
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

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailVehicleId, setDetailVehicleId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('trips');

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

  // TanStack Query: Vehicle 360° Detail
  const { data: detailVehicle, isLoading: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['vehicle-detail', detailVehicleId],
    queryFn: async () => {
      if (!detailVehicleId) return null;
      const res = await api.get(`/vehicles/${detailVehicleId}`);
      return res.data?.data || null;
    },
    enabled: !!detailVehicleId,
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
      if (detailVehicleId) queryClient.invalidateQueries({ queryKey: ['vehicle-detail', detailVehicleId] });
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

  const handleOpenDetail = (v) => {
    setDetailVehicleId(v.id);
    setActiveDetailTab('trips');
    setIsDetailOpen(true);
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
            Manajemen armada operasional milik perusahaan dan unit sewaan, pemantauan riwayat BBM, servis berkala, dan penugasan dinas.
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
              onClick={handleOpenAdd}
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kendaraan</span>
            </Button>
          )}
        </div>
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
                <TableHead className="py-3 px-4 text-right">Aksi & Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat inventaris armada...</p>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data kendaraan yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(v)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-bold text-foreground text-xs group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                          <span>{v.name}</span>
                          <Eye className="w-3 h-3 text-muted-foreground group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="font-mono text-[11px] text-amber-500 font-bold">{v.license_plate}</div>
                      </button>
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
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenDetail(v)}
                          className="h-7 text-xs font-semibold gap-1 text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                          title="Lihat Detail 360° Armada"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Detail</span>
                        </Button>

                        {isAdmin && (
                          <>
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
                          </>
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

      {/* ─── MODAL DIALOG: VEHICLE 360° DETAIL & LIFECYCLE TRACKING ───────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <span>{detailVehicle?.name || 'Profil & Riwayat Armada'}</span>
                  {detailVehicle?.license_plate && (
                    <span className="font-mono text-xs text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                      {detailVehicle.license_plate}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Pelacakan riwayat penggunaan dinas, konsumsi BBM, alur lifecycle servis, dan statistik operasional.
                </DialogDescription>
              </div>

              {detailVehicle && (
                <div className="flex items-center gap-2">
                  <VehicleStatusBadge status={detailVehicle.status} />
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {detailVehicle.ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa (Rental)'}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          {loadingDetail || !detailVehicle ? (
            <div className="py-16 text-center text-muted-foreground text-xs">
              <div className="inline-block w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
              <p>Mengambil data rekam jejak armada...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 4 KPI Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-border/70 shadow-2xs bg-muted/30">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-amber-500" /> Odometer
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold font-mono text-foreground">
                      {Number(detailVehicle.current_odometer || 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-muted-foreground">km</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-2xs bg-muted/30">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-400" /> Total Dinas
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-foreground">
                      {detailVehicle.stats?.total_trips || 0} <span className="text-xs font-normal text-muted-foreground">Kali</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-2xs bg-muted/30">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-emerald-400" /> Konsumsi BBM
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-foreground">
                      {Number(detailVehicle.stats?.total_fuel_liters || 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-muted-foreground">L</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-2xs bg-muted/30">
                  <CardHeader className="p-3 pb-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Biaya Servis
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      Rp {Number(detailVehicle.stats?.total_service_cost || 0).toLocaleString('id-ID')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="space-y-3">
                <TabsList className="bg-muted/50 p-1 border border-border/60 rounded-xl grid grid-cols-4 w-full h-9">
                  <TabsTrigger value="trips" className="text-xs gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Dinas ({detailVehicle.bookings?.length || 0})</span>
                  </TabsTrigger>
                  <TabsTrigger value="fuel" className="text-xs gap-1.5">
                    <Fuel className="w-3.5 h-3.5" />
                    <span>BBM ({detailVehicle.fuel_logs?.length || detailVehicle.fuelLogs?.length || 0})</span>
                  </TabsTrigger>
                  <TabsTrigger value="service" className="text-xs gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Servis ({detailVehicle.service_logs?.length || detailVehicle.serviceLogs?.length || 0})</span>
                  </TabsTrigger>
                  <TabsTrigger value="specs" className="text-xs gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Spesifikasi</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: RIWAYAT PENGGUNAAN & DINAS */}
                <TabsContent value="trips" className="space-y-3">
                  <Card className="border-border/70">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 text-[11px] uppercase font-bold">
                            <TableHead className="py-2.5 px-3">No. Booking</TableHead>
                            <TableHead className="py-2.5 px-3">Pemohon & Divisi</TableHead>
                            <TableHead className="py-2.5 px-3">Supir</TableHead>
                            <TableHead className="py-2.5 px-3">Rute Perjalanan</TableHead>
                            <TableHead className="py-2.5 px-3">Jadwal</TableHead>
                            <TableHead className="py-2.5 px-3 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/60 text-xs">
                          {(!detailVehicle.bookings || detailVehicle.bookings.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                                Belum ada riwayat penugasan dinas untuk armada ini.
                              </TableCell>
                            </TableRow>
                          ) : (
                            detailVehicle.bookings.map((b) => (
                              <TableRow key={b.id} className="hover:bg-muted/30">
                                <TableCell className="py-2.5 px-3 font-mono font-bold text-amber-500">
                                  {b.booking_code}
                                </TableCell>
                                <TableCell className="py-2.5 px-3">
                                  <div className="font-semibold text-foreground">{b.requester_name}</div>
                                  <div className="text-[10px] text-muted-foreground">{b.requester_department || b.department}</div>
                                </TableCell>
                                <TableCell className="py-2.5 px-3">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="w-3 h-3 text-cyan-400" />
                                    <span>{b.driver ? b.driver.name : 'Lepas Kunci'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 px-3">
                                  <div className="flex items-center gap-1 font-medium text-foreground">
                                    <MapPin className="w-3 h-3 text-emerald-400" />
                                    <span>{b.origin_region?.name}</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    <MapPin className="w-3 h-3 text-rose-400" />
                                    <span>{b.destination_region?.name}</span>
                                  </div>
                                  {b.purpose && (
                                    <div className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                                      "{b.purpose}"
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                  {new Date(b.start_date).toLocaleDateString('id-ID')} s/d {new Date(b.end_date).toLocaleDateString('id-ID')}
                                </TableCell>
                                <TableCell className="py-2.5 px-3 text-right">
                                  <BookingStatusBadge status={b.status} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 2: TRACK PENGISIAN BBM */}
                <TabsContent value="fuel" className="space-y-3">
                  <Card className="border-border/70">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 text-[11px] uppercase font-bold">
                            <TableHead className="py-2.5 px-3">Tanggal</TableHead>
                            <TableHead className="py-2.5 px-3">Jenis BBM</TableHead>
                            <TableHead className="py-2.5 px-3">Volume (Liter)</TableHead>
                            <TableHead className="py-2.5 px-3">Harga / Liter</TableHead>
                            <TableHead className="py-2.5 px-3">Total Biaya (Rp)</TableHead>
                            <TableHead className="py-2.5 px-3">Odometer</TableHead>
                            <TableHead className="py-2.5 px-3">Petugas / Supir</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/60 text-xs">
                          {((detailVehicle.fuel_logs || detailVehicle.fuelLogs || []).length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                Belum ada catatan pengisian BBM untuk armada ini.
                              </TableCell>
                            </TableRow>
                          ) : (
                            (detailVehicle.fuel_logs || detailVehicle.fuelLogs || []).map((f) => (
                              <TableRow key={f.id} className="hover:bg-muted/30">
                                <TableCell className="py-2.5 px-3 font-medium">
                                  {new Date(f.fuel_date).toLocaleDateString('id-ID')}
                                </TableCell>
                                <TableCell className="py-2.5 px-3">
                                  <Badge variant="outline" className="text-[10px]">
                                    {f.fuel_type || detailVehicle.fuel_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5 px-3 font-bold text-foreground">
                                  {Number(f.liters).toLocaleString('id-ID')} L
                                </TableCell>
                                <TableCell className="py-2.5 px-3 font-mono text-muted-foreground">
                                  Rp {Number(f.cost_per_liter || 0).toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="py-2.5 px-3 font-bold text-amber-500 font-mono">
                                  Rp {Number(f.cost).toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="py-2.5 px-3 font-mono text-muted-foreground">
                                  {f.odometer_at_fill ? `${Number(f.odometer_at_fill).toLocaleString('id-ID')} km` : '-'}
                                </TableCell>
                                <TableCell className="py-2.5 px-3 text-muted-foreground">
                                  {f.driver?.name || f.created_by?.name || '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 3: TRACK RIWAYAT & LIFECYCLE SERVIS */}
                <TabsContent value="service" className="space-y-3">
                  {((detailVehicle.service_logs || detailVehicle.serviceLogs || []).length === 0) ? (
                    <Card className="border-border/70 p-8 text-center text-muted-foreground text-xs">
                      <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="font-semibold text-foreground">Belum Ada Riwayat Servis</p>
                      <p className="text-[11px] mt-0.5">Semua riwayat pemeliharaan dan perbaikan akan terlacak otomatis di sini.</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {(detailVehicle.service_logs || detailVehicle.serviceLogs || []).map((s) => {
                        const statusColor =
                          s.status === 'completed' ? 'emerald' :
                          s.status === 'in_progress' ? 'blue' :
                          s.status === 'cancelled' ? 'rose' : 'amber';

                        return (
                          <Card key={s.id} className="border-border/70 p-4 space-y-3 bg-muted/20">
                            {/* Header Servis */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-xs">{s.workshop_name}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {s.service_type === 'routine' ? 'Servis Rutin' : s.service_type === 'repair' ? 'Perbaikan' : s.service_type === 'overhaul' ? 'Overhaul' : 'Inspeksi'}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-foreground">
                                  Rp {Number(s.cost || 0).toLocaleString('id-ID')}
                                </span>
                                {s.status === 'completed' && (
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Selesai
                                  </Badge>
                                )}
                                {s.status === 'in_progress' && (
                                  <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">
                                    <Wrench className="w-3 h-3 mr-1" /> Dikerjakan
                                  </Badge>
                                )}
                                {s.status === 'scheduled' && (
                                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                                    <Clock className="w-3 h-3 mr-1" /> Terjadwal
                                  </Badge>
                                )}
                                {s.status === 'cancelled' && (
                                  <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">
                                    <XCircle className="w-3 h-3 mr-1" /> Dibatalkan
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Status Transition Timestamps Timeline */}
                            <div className="p-3 bg-muted/50 rounded-xl border border-border/70 space-y-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Timeline Rekam Jejak Perubahan Status Servis:
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                {/* Step 1: Terjadwal */}
                                <div className="p-2 rounded-lg bg-background/80 border border-border/60">
                                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>1. Terjadwal</span>
                                  </div>
                                  <p className="font-mono text-[10px] text-foreground mt-1">
                                    {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString('id-ID') : new Date(s.service_date).toLocaleDateString('id-ID')}
                                  </p>
                                </div>

                                {/* Step 2: Masuk Bengkel */}
                                <div className={cn(
                                  "p-2 rounded-lg border",
                                  s.in_progress_at ? "bg-background/80 border-border/60" : "bg-muted/20 border-dashed border-border/40 text-muted-foreground"
                                )}>
                                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>2. Masuk Bengkel</span>
                                  </div>
                                  <p className="font-mono text-[10px] text-foreground mt-1">
                                    {s.in_progress_at ? new Date(s.in_progress_at).toLocaleString('id-ID') : (s.status === 'completed' ? 'Tercatat Selesai' : 'Menunggu antrean')}
                                  </p>
                                </div>

                                {/* Step 3: Selesai / Dibatalkan */}
                                {s.status === 'cancelled' ? (
                                  <div className="p-2 rounded-lg bg-background/80 border border-rose-500/30">
                                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>3. Dibatalkan</span>
                                    </div>
                                    <p className="font-mono text-[10px] text-rose-400 mt-1">
                                      {s.cancelled_at ? new Date(s.cancelled_at).toLocaleString('id-ID') : 'Dibatalkan'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className={cn(
                                    "p-2 rounded-lg border",
                                    s.completed_at ? "bg-background/80 border-border/60" : "bg-muted/20 border-dashed border-border/40 text-muted-foreground"
                                  )}>
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>3. Selesai Pengerjaan</span>
                                    </div>
                                    <p className="font-mono text-[10px] text-foreground mt-1">
                                      {s.completed_at ? new Date(s.completed_at).toLocaleString('id-ID') : 'Dalam pengerjaan'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Rincian Teknis & Catatan Mekanik */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span>Odometer Saat Servis: </span>
                                <strong className="font-mono text-foreground">{Number(s.odometer_at_service || 0).toLocaleString('id-ID')} km</strong>
                              </div>
                              {s.next_service_date && (
                                <div>
                                  <span>Target Servis Berikutnya: </span>
                                  <strong className="font-mono text-foreground">{new Date(s.next_service_date).toLocaleDateString('id-ID')}</strong>
                                  {s.next_service_odometer && ` (${Number(s.next_service_odometer).toLocaleString('id-ID')} km)`}
                                </div>
                              )}
                            </div>

                            {s.notes && (
                              <p className="text-[11px] text-foreground bg-muted/40 p-2 rounded border border-border/50 italic">
                                "{s.notes}"
                              </p>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: SPESIFIKASI & RIWAYAT PERAWATAN */}
                <TabsContent value="specs" className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-border/70 p-4 space-y-3">
                      <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-500" /> Informasi Teknis Armada
                      </h4>
                      <div className="space-y-2 text-xs divide-y divide-border/60">
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Nama Model:</span>
                          <strong className="text-foreground">{detailVehicle.name}</strong>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Plat Nomor:</span>
                          <span className="font-mono font-bold text-amber-500">{detailVehicle.license_plate}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Klasifikasi Tipe:</span>
                          <span className="text-foreground">{detailVehicle.type === 'passenger' ? 'Angkutan Penumpang' : 'Angkutan Barang (Heavy Dump / Cargo)'}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Jenis BBM:</span>
                          <span className="text-emerald-400 font-semibold">{detailVehicle.fuel_type}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Odometer Terkini:</span>
                          <span className="font-mono text-foreground font-bold">{Number(detailVehicle.current_odometer || 0).toLocaleString('id-ID')} km</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="border-border/70 p-4 space-y-3">
                      <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400" /> Kepemilikan & Wilayah Operasi
                      </h4>
                      <div className="space-y-2 text-xs divide-y divide-border/60">
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Status Kepemilikan:</span>
                          <span className="font-bold text-foreground uppercase">{detailVehicle.ownership_type === 'owned' ? 'Milik Sendiri (Asset PT)' : 'Sewa / Sewa-Guna'}</span>
                        </div>
                        {detailVehicle.rental_company && (
                          <div className="flex justify-between pt-1.5">
                            <span className="text-muted-foreground">Perusahaan Rental:</span>
                            <strong className="text-foreground">{detailVehicle.rental_company.name}</strong>
                          </div>
                        )}
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Home Pool / Wilayah:</span>
                          <span className="text-foreground font-semibold">{detailVehicle.region?.name} ({detailVehicle.region?.code})</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Servis Terakhir:</span>
                          <span className="font-mono text-foreground">
                            {detailVehicle.last_service_date ? new Date(detailVehicle.last_service_date).toLocaleDateString('id-ID') : 'Belum pernah'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-muted-foreground">Target Servis Berikutnya:</span>
                          <span className="font-mono text-amber-500 font-bold">
                            {detailVehicle.next_service_date ? new Date(detailVehicle.next_service_date).toLocaleDateString('id-ID') : '-'}
                            {detailVehicle.next_service_odometer ? ` (${Number(detailVehicle.next_service_odometer).toLocaleString('id-ID')} km)` : ''}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Form Tambah/Edit Kendaraan (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              {editingVehicle ? 'Edit Data Kendaraan' : 'Daftarkan Kendaraan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? 'Perbarui spesifikasi, pool wilayah, atau status armada.'
                : 'Tambahkan unit armada baru ke inventaris pool operasional tambang.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Model Kendaraan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Toyota Hilux Double Cabin 4x4" className="h-9 text-xs" {...field} />
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
                      <FormLabel>Nomor Polisi (Plat) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: DT 8001 AB" className="h-9 text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klasifikasi Tipe *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="passenger">Orang (Angkutan Penumpang)</SelectItem>
                          <SelectItem value="cargo">Barang (Logistik & Alat Tambang)</SelectItem>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Jenis BBM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Solar Dexlite">Solar Dexlite</SelectItem>
                          <SelectItem value="Pertamina Dex">Pertamina Dex</SelectItem>
                          <SelectItem value="Biosolar Industri">Biosolar Industri (B35)</SelectItem>
                          <SelectItem value="Pertamax">Pertamax</SelectItem>
                          <SelectItem value="Pertalite">Pertalite</SelectItem>
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
                  name="ownership_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Kepemilikan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Kepemilikan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owned">Milik Sendiri (Aset Internal)</SelectItem>
                          <SelectItem value="rented">Sewa (Perusahaan Rental)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedOwnership === 'rented' ? (
                  <FormField
                    control={form.control}
                    name="rental_company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perusahaan Penyedia Rental *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pilih Rental" />
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
                ) : (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Armada *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="available">Tersedia (Ready)</SelectItem>
                            <SelectItem value="in_use">Digunakan (Bertugas)</SelectItem>
                            <SelectItem value="in_service">Dalam Servis (Bengkel)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  name="current_odometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odometer Awal / Saat Ini (KM)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
                      </FormControl>
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
                  {saveMutation.isPending ? 'Menyimpan...' : editingVehicle ? 'Simpan Perubahan' : 'Daftarkan Kendaraan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Konfirmasi Hapus Kendaraan */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              Hapus Kendaraan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data kendaraan <strong>{deletingVehicle?.name}</strong> ({deletingVehicle?.license_plate})?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Data pemesanan, riwayat BBM, dan log servis yang terkait dengan unit ini akan terpengaruh.
          </p>

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
              className="gap-1.5 font-bold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
