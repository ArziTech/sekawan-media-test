import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Truck,
  Fuel,
  TrendingUp,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { BookingStatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';

export const Reports = () => {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [regionId, setRegionId] = useState('all');
  const [vehicleType, setVehicleType] = useState('all');
  const [ownershipType, setOwnershipType] = useState('all');

  // TanStack Query: Master Regions
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await api.get('/regions');
      return res.data?.data?.regions || [];
    },
  });

  // TanStack Query: Reports Data
  const { data: reportData = { bookings: [], summary: { total_bookings: 0, total_fuel_liters: 0, total_fuel_cost: 0 } }, isLoading, refetch } = useQuery({
    queryKey: ['reports-bookings', { startDate, endDate, status, regionId, vehicleType, ownershipType }],
    queryFn: async () => {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (status !== 'all') params.status = status;
      if (regionId !== 'all') params.region_id = regionId;
      if (vehicleType !== 'all') params.vehicle_type = vehicleType;
      if (ownershipType !== 'all') params.ownership_type = ownershipType;

      const res = await api.get('/reports/bookings', { params });
      return {
        bookings: res.data?.data?.data || [],
        summary: res.data?.data?.summary || { total_bookings: 0, total_fuel_liters: 0, total_fuel_cost: 0 },
      };
    },
  });

  const bookings = reportData.bookings;
  const summary = reportData.summary;

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('all');
    setRegionId('all');
    setVehicleType('all');
    setOwnershipType('all');
  };

  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      const excelData = bookings.map((b, index) => ({
        'No.': index + 1,
        'Kode Pemesanan': b.booking_code,
        'Nama Pemohon': b.requester_name,
        'Divisi': b.department,
        'Kendaraan': b.vehicle?.name || '-',
        'Plat Nomor': b.vehicle?.license_plate || '-',
        'Tipe Kendaraan': b.vehicle?.type === 'passenger' ? 'Penumpang' : 'Barang',
        'Kepemilikan': b.vehicle?.ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa',
        'Supir': b.driver?.name || 'Tanpa Supir',
        'Wilayah Asal': b.origin_region?.name || '-',
        'Wilayah Tujuan': b.destination_region?.name || '-',
        'Tanggal Mulai': b.start_date,
        'Tanggal Selesai': b.end_date,
        'Status': b.status,
        'Odometer Awal': b.start_odometer || 0,
        'Odometer Akhir': b.end_odometer || 0,
        'Keperluan': b.purpose,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pemesanan');

      const fileName = `Laporan_Pemesanan_Tambang_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Laporan berhasil diexport ke format Excel!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengekspor laporan ke Excel.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            Laporan & Ekspor Data Excel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rekapitulasi periodik pemesanan armada, utilitas supir, serta ekspor format Microsoft Excel (.xlsx).
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

          <Button
            onClick={handleExportExcel}
            disabled={downloading || bookings.length === 0}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-9 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Mengekspor...' : 'Ekspor ke Excel (.xlsx)'}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Total Data Pemesanan</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              {summary.total_bookings} <span className="text-xs text-muted-foreground font-normal">Transaksi</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Konsumsi BBM Sesuai Periode</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              {Number(summary.total_fuel_liters || 0).toLocaleString('id-ID')} <span className="text-xs text-muted-foreground font-normal">Liter</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Beban Biaya BBM</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-500">
              Rp {Number(summary.total_fuel_cost || 0).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar (shadcn Select & Input) */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Parameter Filter Laporan
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleResetFilters}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 h-7 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Tanggal Mulai */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Tanggal Sampai */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Status Pemesanan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Status Booking</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending_approval_1">Menunggu L1</SelectItem>
                  <SelectItem value="pending_approval_2">Menunggu L2</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="in_progress">Dalam Perjalanan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wilayah */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Wilayah Pool</label>
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger className="h-8 text-xs">
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

            {/* Tipe Kendaraan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Tipe Armada</label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="passenger">Penumpang</SelectItem>
                  <SelectItem value="cargo">Angkutan Barang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kepemilikan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Kepemilikan</label>
              <Select value={ownershipType} onValueChange={setOwnershipType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kepemilikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kepemilikan</SelectItem>
                  <SelectItem value="owned">Milik Sendiri</SelectItem>
                  <SelectItem value="rented">Sewa (Rental)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                <TableHead className="py-3 px-4">No. Booking</TableHead>
                <TableHead className="py-3 px-4">Pemohon & Divisi</TableHead>
                <TableHead className="py-3 px-4">Armada & Supir</TableHead>
                <TableHead className="py-3 px-4">Rute Perjalanan</TableHead>
                <TableHead className="py-3 px-4">Jadwal Pakai</TableHead>
                <TableHead className="py-3 px-4">Odometer</TableHead>
                <TableHead className="py-3 px-4 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                    <p>Memuat rekapitulasi data laporan...</p>
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada catatan pemesanan pada parameter filter ini.
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
                      <div className="text-[10px] text-muted-foreground">{b.department}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-foreground">{b.vehicle?.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{b.vehicle?.license_plate}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{b.driver?.name || 'Tanpa Supir'}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground">
                        {b.origin_region?.name} &rarr; {b.destination_region?.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                      {new Date(b.start_date).toLocaleDateString('id-ID')} s/d {new Date(b.end_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono">
                      {b.start_odometer || b.end_odometer ? (
                        <span>
                          {b.start_odometer || 0} &rarr; {b.end_odometer || '-'} km
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <BookingStatusBadge status={b.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
