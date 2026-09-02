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
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookingStatusBadge } from '../components/common/StatusBadge';

export const Reports = () => {
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ total_bookings: 0, total_fuel_liters: 0, total_fuel_cost: 0 });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filter states
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            Laporan Periodik Pemesanan & Monitoring Kendaraan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter multi-dimensi riwayat pemakaian kendaraan tambang dan ekspor langsung ke format Microsoft Excel (.xlsx).
          </p>
        </div>

        <button
          onClick={handleExportExcelBackend}
          disabled={downloading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Menyiapkan File Excel...' : 'Export ke Excel (.xlsx)'}
        </button>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pemesanan Terfilter</p>
            <p className="text-2xl font-black text-white mt-0.5">{summary.total_bookings} trip</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Konsumsi Bahan Bakar</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {Number(summary.total_fuel_liters).toLocaleString('id-ID', { minimumFractionDigits: 2 })} L
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Biaya Operasional BBM</p>
            <p className="text-xl font-black text-white mt-0.5">
              Rp {Number(summary.total_fuel_cost).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            Parameter Filter Laporan:
          </span>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Wilayah / Tambang</label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">Semua Lokasi</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Status Booking</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
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

          <div>
            <label className="block text-slate-400 mb-1">Tipe Kendaraan</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="passenger">Angkutan Orang</option>
              <option value="cargo">Angkutan Barang</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Pratinjau Data Laporan ({bookings.length} baris data)
          </h3>
          <span className="text-[11px] text-slate-400">Siap diekspor ke Microsoft Excel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Kode Booking</th>
                <th className="py-3 px-3">Pemohon</th>
                <th className="py-3 px-3">Asal &rarr; Tujuan</th>
                <th className="py-3 px-3">Armada & Supir</th>
                <th className="py-3 px-3">Tipe / Kepemilikan</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Approver L1</th>
                <th className="py-3 px-3">Approver L2</th>
                <th className="py-3 px-3 text-right">BBM (Liter)</th>
                <th className="py-3 px-3 text-right">Biaya BBM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500">
                    Memuat pratinjau...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500">
                    Tidak ada data yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                bookings.map((b, idx) => {
                  const l1 = b.approvals?.find((a) => a.approval_level === 1);
                  const l2 = b.approvals?.find((a) => a.approval_level === 2);
                  const liters = b.fuel_logs?.reduce((acc, f) => acc + parseFloat(f.liters || 0), 0) || 0;
                  const cost = b.fuel_logs?.reduce((acc, f) => acc + parseFloat(f.total_cost || 0), 0) || 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{b.booking_code}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-white">{b.requester_name}</p>
                        <p className="text-[10px] text-slate-400">{b.requester_department}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-white">{b.origin_region?.name}</p>
                        <p className="text-[10px] text-amber-400">&rarr; {b.destination_region?.name}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white">{b.vehicle?.name}</p>
                        <p className="text-[10px] text-slate-400">Driver: {b.driver?.name}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-white">
                          {b.vehicle?.type === 'passenger' ? 'Orang' : 'Barang'}
                        </p>
                        <p className={`text-[10px] ${b.vehicle?.ownership_type === 'owned' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                          {b.vehicle?.ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa'}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-white font-medium">{l1?.approver?.name || '-'}</p>
                        <span className="text-[10px] text-emerald-400 uppercase font-semibold">{l1?.status}</span>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-white font-medium">{l2?.approver?.name || '-'}</p>
                        <span className="text-[10px] text-emerald-400 uppercase font-semibold">{l2?.status}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                        {liters > 0 ? `${Number(liters).toFixed(2)} L` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-white font-bold">
                        {cost > 0 ? `Rp ${Number(cost).toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
