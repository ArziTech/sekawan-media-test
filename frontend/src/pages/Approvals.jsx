import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export const Approvals = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Action Dialog State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      if (res.data.success) {
        setPendingList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar tugas persetujuan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/history');
      if (res.data.success) {
        setHistoryList(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat riwayat persetujuan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPending();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  const handleOpenActionModal = (booking, type) => {
    setSelectedBooking(booking);
    setActionType(type);
    setNotes(type === 'approve' ? 'Disetujui untuk kegiatan operasional lapangan.' : '');
    setIsActionModalOpen(true);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (actionType === 'reject' && !notes.trim()) {
      toast.error('Wajib mengisi catatan alasan penolakan.');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(`/approvals/${selectedBooking.id}/action`, {
        action: actionType,
        notes: notes.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsActionModalOpen(false);
        fetchPending();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses persetujuan.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            Portal Persetujuan Berjenjang
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Otorisasi berjenjang Level 1 (Supervisor) & Level 2 (Kepala Pool / GM).
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="pending" className="text-xs font-semibold gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Menunggu Tindakan ({pendingList.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-semibold gap-1.5">
              <History className="w-3.5 h-3.5" />
              Riwayat Keputusan
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'pending' ? (
        <div>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
              <p className="text-xs">Memuat daftar tugas persetujuan...</p>
            </div>
          ) : pendingList.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-foreground">Semua Persetujuan Selesai</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Tidak ada pemesanan kendaraan yang sedang menunggu persetujuan Anda saat ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingList.map((b) => {
                const l1 = b.approvals?.find((a) => a.approval_level === 1);
                const currentLevel = b.status === 'pending_level_1' ? 1 : 2;

                return (
                  <Card key={b.id} className="flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/10 text-amber-500 border-b border-l border-amber-500/20 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                      Tahap Persetujuan Level {currentLevel}
                    </div>

                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {b.booking_code}
                        </span>
                        <BookingStatusBadge status={b.status} />
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-foreground text-sm">{b.requester_name}</p>
                          <p className="text-[11px] text-muted-foreground">{b.requester_department}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5">
                          <div className="flex items-center gap-2 text-foreground">
                            <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-semibold">{b.vehicle?.name}</span>
                            <span className="text-muted-foreground">({b.vehicle?.license_plate})</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span>Supir: {b.driver?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{b.origin_region?.name} &rarr; <strong className="text-foreground">{b.destination_region?.name}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>
                              {new Date(b.start_date).toLocaleDateString('id-ID')} s/d {new Date(b.end_date).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Keperluan:
                          </span>
                          <p className="text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60 italic">
                            "{b.purpose}"
                          </p>
                        </div>

                        {currentLevel === 2 && l1 && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                            <p className="font-bold text-emerald-500">
                              Catatan Level 1 ({l1.approver?.name}):
                            </p>
                            <p className="text-foreground mt-0.5">"{l1.notes || 'Disetujui'}"</p>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <div className="p-4 pt-0 flex items-center gap-2 border-t border-border/60 mt-2">
                      <Button
                        onClick={() => handleOpenActionModal(b, 'approve')}
                        variant="emerald"
                        size="sm"
                        className="flex-1 font-bold text-xs gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Setujui (Approve)
                      </Button>
                      <Button
                        onClick={() => handleOpenActionModal(b, 'reject')}
                        variant="destructive"
                        size="sm"
                        className="flex-1 font-bold text-xs gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak (Reject)
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* History Tab */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Booking</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead>Keputusan</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Waktu Diproses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                      Memuat riwayat...
                    </TableCell>
                  </TableRow>
                ) : historyList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                      Belum ada riwayat persetujuan.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-bold text-amber-500 text-xs">
                        {item.booking?.booking_code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-xs">
                        Level {item.approval_level}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-foreground">{item.booking?.requester_name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.booking?.requester_department}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="text-foreground">{item.booking?.vehicle?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.booking?.vehicle?.license_plate}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'approved' ? 'emerald' : 'destructive'}
                          className="uppercase font-bold text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        "{item.notes || '-'}"
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs text-muted-foreground">
                        {item.action_date ? new Date(item.action_date).toLocaleString('id-ID') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Proses Persetujuan */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Konfirmasi Persetujuan Pemesanan' : 'Konfirmasi Penolakan Pemesanan'}
            </DialogTitle>
            <DialogDescription>
              Pemesanan: {selectedBooking?.booking_code} &middot; {selectedBooking?.requester_name} ({selectedBooking?.vehicle?.name})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAction} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Catatan / Alasan {actionType === 'reject' ? '(Wajib Diisi)*' : '(Opsional)'}
              </label>
              <Textarea
                required={actionType === 'reject'}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Tuliskan catatan persetujuan jika ada...'
                    : 'Jelaskan alasan mengapa pemesanan ditolak...'
                }
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsActionModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={processing}
                variant={actionType === 'approve' ? 'emerald' : 'destructive'}
                size="sm"
                className="font-bold text-xs"
              >
                {processing
                  ? 'Memproses...'
                  : actionType === 'approve'
                  ? 'Konfirmasi Setujui'
                  : 'Konfirmasi Tolak'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
