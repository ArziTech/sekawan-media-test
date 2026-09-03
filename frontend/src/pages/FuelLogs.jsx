import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Fuel, Plus, Search, Calendar, DollarSign, Gauge, RefreshCw, CheckCircle2, Truck } from 'lucide-react';
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

const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Armada kendaraan wajib dipilih.'),
  log_date: z.string().min(1, 'Tanggal pengisian wajib diisi.'),
  liters: z.coerce.number().positive('Volume liter harus lebih dari 0.'),
  cost_per_liter: z.coerce.number().positive('Harga per liter harus lebih dari 0.'),
  odometer_reading: z.coerce.number().min(0, 'Odometer tidak boleh negatif.'),
  fuel_type: z.string().min(1, 'Jenis BBM wajib diisi.'),
  receipt_no: z.string().optional(),
  notes: z.string().optional(),
});

export const FuelLogs = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query: Master Vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data?.data || [];
    },
  });

  // TanStack Query: Fuel Logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['fuel-logs', { search }],
    queryFn: async () => {
      const res = await api.get('/fuel-logs');
      const allLogs = res.data?.data?.data || [];
      if (!search.trim()) return allLogs;
      const s = search.toLowerCase();
      return allLogs.filter(
        (l) =>
          l.vehicle?.name?.toLowerCase().includes(s) ||
          l.vehicle?.license_plate?.toLowerCase().includes(s) ||
          l.receipt_no?.toLowerCase().includes(s) ||
          l.station_name?.toLowerCase().includes(s)
      );
    },
  });

  // React Hook Form
  const form = useForm({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicle_id: '',
      log_date: new Date().toISOString().split('T')[0],
      liters: '',
      cost_per_liter: 16500,
      odometer_reading: '',
      fuel_type: 'Solar Dexlite',
      receipt_no: '',
      notes: '',
    },
  });

  const selectedVehicleId = form.watch('vehicle_id');
  const watchedLiters = form.watch('liters') || 0;
  const watchedCostPerLiter = form.watch('cost_per_liter') || 0;
  const calculatedTotal = Number(watchedLiters) * Number(watchedCostPerLiter);

  // TanStack Mutation
  const createMutation = useMutation({
    mutationFn: async (values) => {
      const totalCost = Number(values.liters) * Number(values.cost_per_liter);
      const payload = {
        vehicle_id: parseInt(values.vehicle_id),
        log_date: values.log_date,
        liters: Number(values.liters),
        cost_per_liter: Number(values.cost_per_liter),
        total_cost: totalCost,
        odometer_reading: Number(values.odometer_reading),
        fuel_type: values.fuel_type,
        receipt_no: values.receipt_no || null,
        notes: values.notes || null,
      };
      return api.post('/fuel-logs', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Data pengisian BBM berhasil dicatat.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['regions-overview'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengisian BBM.');
    },
  });

  const handleOpenAdd = () => {
    form.reset({
      vehicle_id: vehicles[0] ? String(vehicles[0].id) : '',
      log_date: new Date().toISOString().split('T')[0],
      liters: '',
      cost_per_liter: 16500,
      odometer_reading: vehicles[0] ? vehicles[0].current_odometer : 0,
      fuel_type: 'Solar Dexlite',
      receipt_no: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values) => {
    createMutation.mutate(values);
  };

  const totalLiters = logs.reduce((acc, curr) => acc + Number(curr.liters || 0), 0);
  const totalCost = logs.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Fuel className="w-6 h-6 text-emerald-500" />
            Monitoring Konsumsi BBM
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pencatatan volume dan biaya bahan bakar armada operasional tambang & kantor cabang.
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
              <span>Catat Pengisian BBM</span>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Total Transaksi Pengisian</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">{logs.length} <span className="text-xs text-muted-foreground font-normal">Transaksi</span></div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Total Volume BBM</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              {totalLiters.toLocaleString('id-ID')} <span className="text-xs text-muted-foreground font-normal">Liter</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Total Beban Biaya BBM</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-500">
              Rp {totalCost.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari armada, plat nomor, nomor nota SPBU..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fuel Logs Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">Tanggal & Nota</TableHead>
                <TableHead className="py-3 px-4">Armada Kendaraan</TableHead>
                <TableHead className="py-3 px-4">Jenis BBM</TableHead>
                <TableHead className="py-3 px-4">Volume (L)</TableHead>
                <TableHead className="py-3 px-4">Harga / Liter</TableHead>
                <TableHead className="py-3 px-4">Total Biaya</TableHead>
                <TableHead className="py-3 px-4 text-right">Odometer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat riwayat pengisian BBM...</p>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Belum ada data pengisian BBM yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(log.log_date).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {log.receipt_no ? `Nota: ${log.receipt_no}` : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-foreground">{log.vehicle?.name}</div>
                      <div className="text-[11px] text-amber-500 font-mono font-semibold">{log.vehicle?.license_plate}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {log.fuel_type || 'Solar Dexlite'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-bold text-foreground">
                      {Number(log.liters).toLocaleString('id-ID')} L
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                      Rp {Number(log.cost_per_liter || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-bold text-emerald-500">
                      Rp {Number(log.total_cost || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right text-xs font-mono text-foreground">
                      {log.odometer_at_fueling || log.odometer_reading
                        ? `${Number(log.odometer_at_fueling || log.odometer_reading).toLocaleString('id-ID')} km`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form Tambah Log BBM (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-emerald-500" />
              Catat Konsumsi Bahan Bakar (BBM)
            </DialogTitle>
            <DialogDescription>
              Masukkan rincian pengisian bahan bakar armada tambang.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
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
                          if (v) {
                            form.setValue('odometer_reading', v.current_odometer);
                            if (v.fuel_type) form.setValue('fuel_type', v.fuel_type);
                          }
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
                  name="log_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Pengisian *</FormLabel>
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
                  name="liters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume Pengisian (Liter) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0" placeholder="Contoh: 50" className="h-9 text-xs" {...field} />
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

              {/* Total Calculation Preview */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                <span className="text-muted-foreground font-medium text-xs">Estimasi Total Biaya:</span>
                <span className="text-lg font-bold text-emerald-500 font-mono">
                  Rp {calculatedTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="odometer_reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odometer Saat Isi (KM) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" className="h-9 text-xs" {...field} />
                      </FormControl>
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
                        <Input type="text" placeholder="Contoh: Solar Dexlite" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gas_station_receipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Nota / Struk SPBU</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Contoh: SPBU-KDR-8899 (opsional)" className="h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Tambahan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Keterangan pengisian..." rows={2} className="text-xs" {...field} />
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
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi BBM'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
