import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { BookingStatusBadge } from '@/components/common/StatusBadge';
import { cn } from "@/lib/utils";
import {
  Radio,
  Truck,
  UserCheck,
  Users,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Play,
  CheckCircle,
  Fuel,
  Search,
  RefreshCw,
  Eye,
  ArrowRight,
  Navigation,
  Layers,
  AlertCircle,
  Building2,
  Receipt,
  Sparkles,
} from "lucide-react";

// Skema Zod untuk Selesaikan Perjalanan dengan Opsi Pengisian BBM
const completeTripSchema = z.object({
  end_odometer: z.coerce
    .number({ invalid_type_error: "Odometer akhir wajib berupa angka" })
    .min(0, "Odometer tidak boleh negatif"),
  has_fuel_refill: z.boolean().default(false),
  liters: z.coerce.number().optional(),
  cost_per_liter: z.coerce.number().optional(),
  fuel_type: z.string().optional(),
  gas_station_receipt: z.string().optional(),
  fuel_notes: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.has_fuel_refill) {
    if (!val.liters || Number(val.liters) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Volume liter pengisian BBM wajib diisi dan lebih dari 0",
        path: ["liters"],
      });
    }
    if (!val.cost_per_liter || Number(val.cost_per_liter) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Harga per liter wajib diisi dan lebih dari 0",
        path: ["cost_per_liter"],
      });
    }
  }
});

export function Duties() {
  const toast = useToast();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('active');

  // Modal State
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // TanStack Query: Fetch Master Regions (for filter)
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data?.data?.regions || [];
    },
  });

  // TanStack Query: Fetch Active Duties & Stats
  const { data: dutyData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['active-duties', search, originFilter, destinationFilter],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (originFilter !== 'all') params.origin_region_id = originFilter;
      if (destinationFilter !== 'all') params.destination_region_id = destinationFilter;

      const res = await api.get('/duties', { params });
      return res.data?.data || null;
    },
  });

  const stats = dutyData?.stats || {
    active_duties: 0,
    scheduled: 0,
    standby_drivers: 0,
    on_duty_drivers: 0,
    active_vehicles: 0,
  };

  const activeDuties = dutyData?.active_duties || [];
  const scheduledDuties = dutyData?.scheduled_duties || [];
  const standbyDrivers = dutyData?.standby_drivers || [];
  const completedToday = dutyData?.completed_today || [];

  // Form Setup: Selesaikan Perjalanan + Opsi BBM
  const form = useForm({
    resolver: zodResolver(completeTripSchema),
    defaultValues: {
      end_odometer: 0,
      has_fuel_refill: false,
      liters: '',
      cost_per_liter: 16500,
      fuel_type: 'Solar Dexlite',
      gas_station_receipt: '',
      fuel_notes: '',
    },
  });

  const watchHasFuel = form.watch('has_fuel_refill');
  const watchLiters = Number(form.watch('liters') || 0);
  const watchCostPerLiter = Number(form.watch('cost_per_liter') || 0);
  const calculatedFuelCost = watchLiters * watchCostPerLiter;

  // Mutation: Start Trip (Mulai Perjalanan)
  const startTripMutation = useMutation({
    mutationFn: async (bookingId) => {
      const res = await api.post(`/bookings/${bookingId}/start-trip`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Perjalanan dimulai. Driver & armada berstatus Dalam Perjalanan.");
      queryClient.invalidateQueries({ queryKey: ['active-duties'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal memulai perjalanan.");
    },
  });

  // Mutation: Complete Trip (Selesaikan Perjalanan & Driver/Armada Otomatis Tersedia)
  const completeTripMutation = useMutation({
    mutationFn: async ({ bookingId, payload }) => {
      const res = await api.post(`/bookings/${bookingId}/complete-trip`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Perjalanan selesai. Driver dan armada otomatis kembali Tersedia di Pool.");
      setIsCompleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['active-duties'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal menyelesaikan perjalanan.");
    },
  });

  const handleOpenComplete = (booking) => {
    setSelectedBooking(booking);
    const startOdo = booking.start_odometer || booking.vehicle?.current_odometer || 0;
    form.reset({
      end_odometer: startOdo,
      has_fuel_refill: false,
      liters: '',
      cost_per_liter: 16500,
      fuel_type: booking.vehicle?.fuel_type || 'Solar Dexlite',
      gas_station_receipt: '',
      fuel_notes: '',
    });
    setIsCompleteOpen(true);
  };

  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const onSubmitComplete = (values) => {
    if (!selectedBooking) return;
    if (values.end_odometer < (selectedBooking.start_odometer || 0)) {
      form.setError('end_odometer', {
        type: 'manual',
        message: `Odometer akhir (${values.end_odometer}) tidak boleh lebih kecil dari odometer awal (${selectedBooking.start_odometer || 0})`,
      });
      return;
    }

    completeTripMutation.mutate({
      bookingId: selectedBooking.id,
      payload: values,
    });
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatWhatsAppUrl = (phone, driverName, bookingCode) => {
    if (!phone) return '#';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const message = encodeURIComponent(
      `Halo ${driverName}, koordinasi operasional tugas armada dinas kode [${bookingCode}] dari Nickel Fleet Coordinator.`
    );
    return `https://wa.me/${clean}?text=${message}`;
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ─── Header & Segarkan ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Monitoring Personil Bertugas & Operasi Armada
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pelacakan langsung supir aktif di lapangan, pergerakan armada tambang antar-site, kesiapan supir standby, serta integrasi pencatatan BBM saat trip selesai.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", (isRefetching || isLoading) && "animate-spin")} />
            <span>Segarkan Data</span>
          </Button>
        </div>
      </div>

      {/* ─── 4 KPI Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Personil On Duty */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Personil Sedang Bertugas</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
              <Radio className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{stats.active_duties}</div>
            <p className="text-[11px] text-emerald-500 font-medium mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{stats.on_duty_drivers} supir aktif di perjalanan</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Armada Beroperasi */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Armada di Lapangan</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{stats.active_vehicles}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Unit kendaraan operasional bergerak</p>
          </CardContent>
        </Card>

        {/* KPI 3: Supir Standby */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Supir Standby di Pool</span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{stats.standby_drivers}</div>
            <p className="text-[11px] text-cyan-400 font-medium mt-0.5">Siap menerima penugasan baru</p>
          </CardContent>
        </Card>

        {/* KPI 4: Penugasan Terjadwal */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Penugasan Terjadwal</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{stats.scheduled}</div>
            <p className="text-[11px] text-amber-500 font-medium mt-0.5">Disetujui & siap diberangkatkan</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filter & Search Bar with shadcn Select ─────────────────────── */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari supir, pemohon, nomor SIM, plat kendaraan, atau divisi..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Filter Pool Asal */}
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                <SelectValue placeholder="Semua Pool Asal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pool Asal</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name} ({r.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Site Tujuan */}
            <Select value={destinationFilter} onValueChange={setDestinationFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                <SelectValue placeholder="Semua Site Tujuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Site Tujuan</SelectItem>
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

      {/* ─── Multi-Tab Layout ───────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/80">
          <TabsTrigger value="active" className="text-xs gap-1.5 font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sedang Bertugas</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {activeDuties.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="scheduled" className="text-xs gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Terjadwal (Siap Jalan)</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {scheduledDuties.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="standby" className="text-xs gap-1.5 font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supir Standby di Pool</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {standbyDrivers.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="completed" className="text-xs gap-1.5 font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Selesai Hari Ini</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {completedToday.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SEDANG BERTUGAS (LIVE ACTIVE DUTIES) ─────────────────── */}
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <Card className="border-border/80 p-12 text-center text-muted-foreground text-xs">
              <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
              <p>Memuat personil dan armada yang sedang bertugas...</p>
            </Card>
          ) : activeDuties.length === 0 ? (
            <Card className="border-border/80 p-12 text-center text-muted-foreground text-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Tidak Ada Penugasan Aktif Saat Ini</h4>
              <p className="max-w-md mx-auto">
                Seluruh supir dan armada operasional saat ini berada di pool standby atau belum ada perjalanan dinas yang sedang berlangsung.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeDuties.map((duty) => {
                const driver = duty.driver;
                const vehicle = duty.vehicle;
                return (
                  <Card key={duty.id} className="border-border/80 shadow-xs hover:border-emerald-500/40 transition-colors">
                    <CardHeader className="p-4 pb-3 border-b border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {duty.booking_code}
                          </span>
                          <Badge className="bg-emerald-600 text-white font-bold text-[10px] gap-1">
                            <Radio className="w-2.5 h-2.5 animate-pulse" />
                            Dalam Perjalanan
                          </Badge>
                        </div>

                        <span className="text-[11px] font-mono text-muted-foreground">
                          Odo Awal: <strong className="text-foreground">{duty.start_odometer || vehicle?.current_odometer || 0} km</strong>
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3.5">
                      {/* Driver & Requester Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/60">
                        {/* Driver Info & Quick Contact */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                            Personil Supir
                          </span>
                          {driver ? (
                            <div>
                              <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                {driver.name}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">{driver.license_number}</div>

                              {/* WhatsApp & Phone Quick Action Buttons */}
                              {driver.phone && (
                                <div className="flex items-center gap-2 mt-2">
                                  <a
                                    href={formatWhatsAppUrl(driver.phone, driver.name, duty.booking_code)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/25 text-[10px] font-bold transition-colors"
                                    title="Hubungi Supir via WhatsApp"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>WA Driver</span>
                                  </a>
                                  <a
                                    href={`tel:${driver.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-[10px] font-semibold transition-colors"
                                    title="Panggil Telepon"
                                  >
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <span>{driver.phone}</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-muted-foreground">Tanpa Supir (Lepas Kunci)</div>
                          )}
                        </div>

                        {/* Requester Info */}
                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-3 border-border/60 pt-2 sm:pt-0">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                            Pemohon Tugas Dinas
                          </span>
                          <div className="font-bold text-foreground text-xs">{duty.requester_name}</div>
                          <div className="text-[10px] text-muted-foreground">{duty.requester_department || duty.department}</div>
                        </div>
                      </div>

                      {/* Vehicle & Route Row */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{vehicle?.name}</span>
                            <span className="font-mono text-muted-foreground text-[11px]">({vehicle?.license_plate})</span>
                          </div>

                          <Badge variant="outline" className="text-[10px]">
                            {vehicle?.ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa (Rental)'}
                          </Badge>
                        </div>

                        {/* Route Pin Box */}
                        <div className="p-2.5 bg-muted/20 rounded-lg border border-border/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-medium text-foreground">{duty.origin_region?.name}</span>
                            <span className="text-muted-foreground font-bold">&rarr;</span>
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="font-medium text-foreground">{duty.destination_region?.name}</span>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(duty.start_date).toLocaleDateString('id-ID')} s/d {new Date(duty.end_date).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        {duty.purpose && (
                          <p className="text-[11px] text-muted-foreground italic line-clamp-1 px-1">
                            "{duty.purpose}"
                          </p>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenDetail(duty)}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail Rute & Otorisasi</span>
                        </Button>

                        {isAdmin && (
                          <Button
                            type="button"
                            variant="emerald"
                            size="xs"
                            onClick={() => handleOpenComplete(duty)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selesaikan Trip & Catat BBM</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: TERJADWAL SIAP BERANGKAT ────────────────────────────── */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                    <TableHead className="py-3 px-4">No. Booking</TableHead>
                    <TableHead className="py-3 px-4">Supir & Kontak</TableHead>
                    <TableHead className="py-3 px-4">Pemohon & Divisi</TableHead>
                    <TableHead className="py-3 px-4">Armada Siap</TableHead>
                    <TableHead className="py-3 px-4">Rute (Asal &rarr; Tujuan)</TableHead>
                    <TableHead className="py-3 px-4">Jadwal Pakai</TableHead>
                    <TableHead className="py-3 px-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                        <p>Memuat daftar penugasan terjadwal...</p>
                      </TableCell>
                    </TableRow>
                  ) : scheduledDuties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        Tidak ada penugasan terjadwal yang menunggu keberangkatan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scheduledDuties.map((duty) => (
                      <TableRow key={duty.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-4 text-xs font-mono font-bold text-amber-500">
                          {duty.booking_code}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-foreground">{duty.driver?.name || 'Lepas Kunci'}</div>
                          {duty.driver?.phone && (
                            <a
                              href={formatWhatsAppUrl(duty.driver.phone, duty.driver.name, duty.booking_code)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              {duty.driver.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-foreground">{duty.requester_name}</div>
                          <div className="text-[10px] text-muted-foreground">{duty.requester_department || duty.department}</div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-foreground">{duty.vehicle?.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{duty.vehicle?.license_plate}</div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{duty.origin_region?.name}</span>
                            <span className="text-muted-foreground">&rarr;</span>
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{duty.destination_region?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs font-mono">
                          <div className="text-foreground">{new Date(duty.start_date).toLocaleDateString('id-ID')}</div>
                          <div className="text-[10px] text-muted-foreground">s/d {new Date(duty.end_date).toLocaleDateString('id-ID')}</div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-xs"
                              onClick={() => handleOpenDetail(duty)}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {isAdmin && (
                              <Button
                                type="button"
                                variant="blue"
                                size="xs"
                                onClick={() => startTripMutation.mutate(duty.id)}
                                disabled={startTripMutation.isPending}
                              >
                                <Play className="w-3 h-3" />
                                <span>Mulai Perjalanan</span>
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
        </TabsContent>

        {/* ─── TAB 3: SUPIR STANDBY DI POOL ───────────────────────────────── */}
        <TabsContent value="standby" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                <p>Memuat data supir standby...</p>
              </div>
            ) : standbyDrivers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                Tidak ada personil supir yang sedang standby di pool saat ini.
              </div>
            ) : (
              standbyDrivers.map((d) => (
                <Card key={d.id} className="border-border/80 shadow-xs hover:border-cyan-500/40 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                        {d.name.substring(0, 2).toUpperCase()}
                      </div>
                      <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px]">
                        Standby di Pool
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-xs">{d.name}</h4>
                      <p className="text-[10px] font-mono text-muted-foreground">{d.license_number}</p>
                    </div>

                    <div className="p-2 bg-muted/30 rounded-lg text-xs flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium text-foreground">{d.region?.name || 'Pool Pusat'}</span>
                    </div>

                    {d.phone && (
                      <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                        <a
                          href={`https://wa.me/${d.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/25 text-[11px] font-bold transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${d.phone}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                          title="Telepon"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 4: SELESAI HARI INI ────────────────────────────────────── */}
        <TabsContent value="completed" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                    <TableHead className="py-3 px-4">No. Booking</TableHead>
                    <TableHead className="py-3 px-4">Supir & Pemohon</TableHead>
                    <TableHead className="py-3 px-4">Armada Kendaraan</TableHead>
                    <TableHead className="py-3 px-4">Rute Selesai</TableHead>
                    <TableHead className="py-3 px-4">Odometer (Awal &rarr; Akhir)</TableHead>
                    <TableHead className="py-3 px-4">Pencatatan BBM</TableHead>
                    <TableHead className="py-3 px-4 text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                        <p>Memuat rekap penugasan selesai hari ini...</p>
                      </TableCell>
                    </TableRow>
                  ) : completedToday.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        Belum ada penugasan yang diselesaikan pada hari ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedToday.map((duty) => {
                      const fuelRecorded = duty.fuel_logs && duty.fuel_logs.length > 0 ? duty.fuel_logs[0] : null;
                      const distance = (duty.end_odometer || 0) - (duty.start_odometer || 0);

                      return (
                        <TableRow key={duty.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3.5 px-4 text-xs font-mono font-bold text-muted-foreground">
                            {duty.booking_code}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-bold text-foreground">{duty.driver?.name || 'Lepas Kunci'}</div>
                            <div className="text-[10px] text-muted-foreground">{duty.requester_name} ({duty.requester_department || duty.department})</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-bold text-foreground">{duty.vehicle?.name}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{duty.vehicle?.license_plate}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-medium text-foreground flex items-center gap-1">
                              <span>{duty.origin_region?.name}</span>
                              <span className="text-muted-foreground">&rarr;</span>
                              <span>{duty.destination_region?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs font-mono">
                            <div>{duty.start_odometer || 0} km &rarr; <strong className="text-foreground">{duty.end_odometer || 0} km</strong></div>
                            {distance > 0 && (
                              <div className="text-[10px] text-emerald-400 font-bold">+{distance} km perjalanan</div>
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            {fuelRecorded ? (
                              <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-0.5">
                                <div className="font-bold text-emerald-400 flex items-center gap-1">
                                  <Fuel className="w-3 h-3" />
                                  <span>{fuelRecorded.liters} L ({formatRupiah(fuelRecorded.total_cost)})</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">{fuelRecorded.fuel_type}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-xs"
                              onClick={() => handleOpenDetail(duty)}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
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
        </TabsContent>
      </Tabs>

      {/* ─── MODAL DIALOG: SELESAIKAN TRIP + OPSI PENGISIAN BBM ──────────── */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
              Selesaikan Penugasan & Perjalanan Armada
            </DialogTitle>
            <DialogDescription>
              Catat odometer kedatangan armada untuk pemesanan <strong>{selectedBooking?.booking_code}</strong>. Status supir dan kendaraan akan otomatis kembali Tersedia.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitComplete)} className="space-y-4 text-xs">
              {/* Info Perjalanan Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border/70">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Armada & Driver:</span>
                  <span className="font-bold text-foreground">
                    {selectedBooking?.vehicle?.name} ({selectedBooking?.vehicle?.license_plate})
                  </span>
                  <p className="text-muted-foreground text-[10px] mt-0.5">
                    Supir: {selectedBooking?.driver?.name || 'Lepas Kunci'}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-muted-foreground block text-[11px]">Odometer Awal:</span>
                  <span className="font-mono text-base font-bold text-foreground">
                    {selectedBooking?.start_odometer || selectedBooking?.vehicle?.current_odometer || 0} km
                  </span>
                </div>
              </div>

              {/* Field Odometer Akhir */}
              <FormField
                control={form.control}
                name="end_odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-foreground">
                      Odometer Akhir Kedatangan di Pool (KM) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={selectedBooking?.start_odometer || 0}
                        placeholder="Contoh: 15450"
                        className="h-9 text-xs font-mono font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox / Toggle Pengisian BBM */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={watchHasFuel}
                    onChange={(e) => form.setValue('has_fuel_refill', e.target.checked)}
                    className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                    <Fuel className="w-4 h-4 text-amber-500" />
                    <span>Catat Pengisian BBM Selama Perjalanan Ini (Otomatis Masuk Log BBM)</span>
                  </div>
                </label>

                {/* Sub-form Pengisian BBM */}
                {watchHasFuel && (
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="liters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume Pengisian (Liter) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0" placeholder="Contoh: 45.5" className="h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cost_per_liter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Harga per Liter (Rp) *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="16500" className="h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Live Calculation Preview */}
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                      <span className="text-muted-foreground font-medium text-xs">Estimasi Total Biaya BBM:</span>
                      <span className="text-base font-bold text-emerald-500 font-mono">
                        {formatRupiah(calculatedFuelCost)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fuel_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jenis Bahan Bakar</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="Contoh: Solar Dexlite" className="h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gas_station_receipt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nomor Struk / Nota SPBU</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="Contoh: SPBU-KDR-8899" className="h-9 text-xs font-mono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fuel_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catatan Pengisian BBM (Opsional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Keterangan SPBU pengisian..." rows={2} className="text-xs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

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
                  {completeTripMutation.isPending ? 'Menyimpan...' : 'Selesaikan & Perbarui Status'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL DIALOG: DETAIL PENUGASAN ─────────────────────────────── */}
      {selectedBooking && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="font-mono text-amber-500 font-bold">{selectedBooking.booking_code}</span>
                <BookingStatusBadge status={selectedBooking.status} />
              </DialogTitle>
              <DialogDescription>
                Rincian informasi permohonan armada, supir, rute dinas, dan otorisasi bertingkat.
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
}
