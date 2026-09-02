import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Truck,
  Fuel,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { BookingStatusBadge } from '@/components/common/StatusBadge';

export const Reports = () => {
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ total_bookings: 0, total_fuel_liters: 0, total_fuel_cost: 0 });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [regionId, setRegionId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [ownershipType, setOwnershipType] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/bookings', {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          status: status || undefined,
          region_id: regionId || undefined,
          vehicle_type: vehicleType || undefined,
          ownership_type: ownershipType || undefined,
        },
      });

      if (res.data.success) {
        setBookings(res.data.data.bookings || []);
        setSummary(res.data.data.summary || { total_bookings: 0, total_fuel_liters: 0, total_fuel_cost: 0 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await api.get('/regions');
      if (res.data.success) {
        setRegions(res.data.data.regions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchRegions();
  }, [status, regionId, vehicleType, ownershipType]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('');
    setRegionId('');
    setVehicleType('');
    setOwnershipType('');
  };

  const handleExportExcelBackend = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        status: status,
        region_id: regionId,
        vehicle_type: vehicleType,
        ownership_type: ownershipType,
      }).toString();

      const response = await api.get(`/reports/export/excel?${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Pemesanan_Kendaraan_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File Excel berhasil diunduh!');
    } catch (err) {
      console.error('Backend Excel download fallback to client sheet:', err);
      handleExportExcelClient();
    } finally {
      setDownloading(false);
    }
  };

  const handleExportExcelClient = () => {
    const data = bookings.map((b, idx) => {
      const l1 = b.approvals?.find((a) => a.approval_level === 1);
      const l2 = b.approvals?.find((a) => a.approval_level === 2);
      const liters = b.fuel_logs?.reduce((acc, f) => acc + parseFloat(f.liters || 0), 0) || 0;
      const cost = b.fuel_logs?.reduce((acc, f) => acc + parseFloat(f.total_cost || 0), 0) || 0;

      return {
        No: idx + 1,
        'Kode Booking': b.booking_code,
        'Tanggal Mulai': new Date(b.start_date).toLocaleString('id-ID'),
        'Tanggal Selesai': new Date(b.end_date).toLocaleString('id-ID'),
        'Nama Pemohon': b.requester_name,
        Departemen: b.requester_department,
        'Lokasi Asal': b.origin_region?.name,
        'Lokasi Tujuan': b.destination_region?.name,
        Kendaraan: b.vehicle?.name,
        'No. Plat': b.vehicle?.license_plate,
        'Tipe Armada': b.vehicle?.type === 'passenger' ? 'Angkutan Orang' : 'Angkutan Barang',
        Kepemilikan: b.vehicle?.ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa',
        'Nama Supir': b.driver?.name,
        'Status Booking': b.status,
        'Penyetujui L1': l1?.approver?.name || '-',
        'Status L1': l1?.status || '-',
        'Catatan L1': l1?.notes || '-',
        'Penyetujui L2': l2?.approver?.name || '-',
        'Status L2': l2?.status || '-',
        'Catatan L2': l2?.notes || '-',
        'Total BBM (Liter)': liters,
        'Total Biaya BBM (Rp)': cost,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pemesanan');
    XLSX.writeFile(workbook, `Laporan_Pemesanan_Kendaraan_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('File Excel berhasil diekspor.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Laporan Periodik & Ekspor Data Excel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filter riwayat pemakaian kendaraan tambang dan ekspor langsung ke Microsoft Excel (.xlsx).
          </p>
        </div>

        <Button
          onClick={handleExportExcelBackend}
          disabled={downloading}
          variant="emerald"
          size="sm"
          className="font-bold text-xs gap-1.5 shadow-sm"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Menyiapkan File...' : 'Export ke Excel (.xlsx)'}
        </Button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Pemesanan Terfilter
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary.total_bookings} <span className="text-xs font-normal text-muted-foreground">trip</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Konsumsi BBM
            </CardTitle>
            <Fuel className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Number(summary.total_fuel_liters).toLocaleString('id-ID', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-muted-foreground">Liter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Biaya BBM
            </CardTitle>
            <Truck className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              Rp {Number(summary.total_fuel_cost).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Parameters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Parameter Filter Laporan
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-7 text-[11px] text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Filter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-muted-foreground text-[11px]">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground text-[11px]">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground text-[11px]">Wilayah / Tambang</label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Semua Lokasi</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground text-[11px]">Status Booking</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Semua Status</option>
                <option value="pending_level_1">Menunggu L1</option>
                <option value="pending_level_2">Menunggu L2</option>
                <option value="approved">Disetujui</option>
                <option value="in_use">Sedang Berjalan</option>
                <option value="completed">Selesai</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground text-[11px]">Tipe Kendaraan</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Semua Tipe</option>
                <option value="passenger">Angkutan Orang</option>
                <option value="cargo">Angkutan Barang</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchReports} size="sm" className="w-full h-8 font-semibold text-xs">
                Terapkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Pratinjau Data Laporan ({bookings.length} baris)
            </CardTitle>
            <CardDescription className="text-xs">Data siap diekspor ke format Excel</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Rute</TableHead>
                <TableHead>Armada</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approver L1</TableHead>
                <TableHead>Approver L2</TableHead>
                <TableHead className="text-right">BBM</TableHead>
                <TableHead className="text-right">Biaya BBM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground text-xs">
                    Memuat data laporan...
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada data yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b, idx) => {
                  const l1 = b.approvals?.find((a) => a.approval_level === 1);
                  const l2 = b.approvals?.find((a) => a.approval_level === 2);
                  const liters = b.fuel_logs?.reduce((acc, f) => acc + parseFloat(f.liters || 0), 0) || 0;
                  const cost = b.fuel_logs?.reduce((acc, f) => acc + parseFloat(f.total_cost || 0), 0) || 0;

                  return (
                    <TableRow key={b.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-bold text-amber-500 text-xs">{b.booking_code}</TableCell>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-foreground">{b.requester_name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.requester_department}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="text-foreground">{b.origin_region?.name}</p>
                        <p className="text-[10px] text-amber-500">&rarr; {b.destination_region?.name}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium text-foreground">{b.vehicle?.name}</p>
                        <p className="text-[10px] text-muted-foreground">Driver: {b.driver?.name}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="text-foreground">{b.vehicle?.type === 'passenger' ? 'Orang' : 'Barang'}</p>
                        <p className={`text-[10px] ${b.vehicle?.ownership_type === 'owned' ? 'text-emerald-500' : 'text-cyan-500'}`}>
                          {b.vehicle?.ownership_type === 'owned' ? 'Milik' : 'Sewa'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium text-foreground">{l1?.approver?.name || '-'}</p>
                        <span className="text-[10px] text-emerald-500 font-semibold uppercase">{l1?.status}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium text-foreground">{l2?.approver?.name || '-'}</p>
                        <span className="text-[10px] text-emerald-500 font-semibold uppercase">{l2?.status}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-500 font-semibold text-xs">
                        {liters > 0 ? `${Number(liters).toFixed(2)} L` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-foreground text-xs">
                        {cost > 0 ? `Rp ${Number(cost).toLocaleString('id-ID')}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
