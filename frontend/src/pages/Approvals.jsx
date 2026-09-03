import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Ban,
  AlertTriangle,
  RefreshCw,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { cn } from '@/lib/utils';

const actionFormSchema = z.object({
  notes: z.string().optional(),
});

const cancelFormSchema = z.object({
  reason: z.string().min(5, 'Alasan pembatalan minimal 5 karakter.'),
});

export const Approvals = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('pending');

  // Dialog States
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState('approve');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelingBooking, setCancelingBooking] = useState(null);

  // TanStack Query: Fetch Pending Approvals
  const { data: pendingList = [], isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: async () => {
      const res = await api.get('/approvals/pending');
      return res.data?.data || [];
    },
  });

  // TanStack Query: Fetch Approval History
  const { data: historyList = [], isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['approvals-history'],
    queryFn: async () => {
      const res = await api.get('/approvals/history');
      return res.data?.data?.data || [];
    },
  });

  // React Hook Form for Action (Approve / Reject)
  const actionForm = useForm({
    resolver: zodResolver(actionFormSchema),
    defaultValues: { notes: '' },
  });

  // React Hook Form for Cancel
  const cancelForm = useForm({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: { reason: '' },
  });

  // TanStack Mutation: Approve / Reject Action
  const actionMutation = useMutation({
    mutationFn: async ({ bookingId, action, notes }) => {
      return api.post(`/approvals/${bookingId}/action`, {
        action,
        notes: notes || undefined,
      });
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Keputusan persetujuan berhasil dicatat.');
      setIsActionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-history'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal memproses persetujuan.');
    },
  });

  // TanStack Mutation: Cancel Booking
  const cancelMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      return api.post(`/bookings/${bookingId}/cancel`, {
        reason,
      });
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Pemesanan berhasil dibatalkan.');
      setIsCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-history'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pemesanan.');
    },
  });

  const handleOpenAction = (booking, type) => {
    setSelectedBooking(booking);
    setActionType(type);
    actionForm.reset({ notes: '' });
    setIsActionModalOpen(true);
  };

  const handleOpenCancel = (booking) => {
    setCancelingBooking(booking);
    cancelForm.reset({ reason: '' });
    setIsCancelModalOpen(true);
  };

  const onSubmitAction = (values) => {
    if (actionType === 'reject' && (!values.notes || values.notes.trim().length < 5)) {
      actionForm.setError('notes', { message: 'Alasan penolakan wajib diisi (minimal 5 karakter).' });
      return;
    }
    actionMutation.mutate({
      bookingId: selectedBooking.id,
      action: actionType,
      notes: values.notes?.trim(),
    });
  };

  const onSubmitCancel = (values) => {
    cancelMutation.mutate({
      bookingId: cancelingBooking.id,
      reason: values.reason.trim(),
    });
  };

  const renderApprovalTimeline = (approvals = []) => {
    const tier1 = approvals.find((a) => a.tier_level === 1);
    const tier2 = approvals.find((a) => a.tier_level === 2);

    const getRoleTitle = (tier) => {
      return tier === 1
        ? 'Penyetujui Level 1 (Supervisor Operasional)'
        : 'Penyetujui Level 2 (Kepala Pool / GM)';
    };

    return (
      <div className="flex items-center gap-2 text-xs">
        {/* Tier 1 */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-muted/40">
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-[11px]">{getRoleTitle(1)}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {tier1?.status === 'approved' && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Disetujui
                </span>
              )}
              {tier1?.status === 'rejected' && (
                <span className="text-[10px] text-rose-400 flex items-center gap-0.5 font-bold">
                  <XCircle className="w-3 h-3" /> Ditolak
                </span>
              )}
              {tier1?.status === 'pending' && (
                <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-semibold">
                  <Clock className="w-3 h-3" /> Menunggu
                </span>
              )}
              {!tier1 && <span className="text-[10px] text-muted-foreground">-</span>}
            </div>
          </div>
        </div>

        <span className="text-muted-foreground font-bold">&rarr;</span>

        {/* Tier 2 */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-muted/40">
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-[11px]">{getRoleTitle(2)}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {tier2?.status === 'approved' && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Disetujui
                </span>
              )}
              {tier2?.status === 'rejected' && (
                <span className="text-[10px] text-rose-400 flex items-center gap-0.5 font-bold">
                  <XCircle className="w-3 h-3" /> Ditolak
                </span>
              )}
              {tier2?.status === 'pending' && (
                <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-semibold">
                  <Clock className="w-3 h-3" /> Menunggu
                </span>
              )}
              {!tier2 && <span className="text-[10px] text-muted-foreground">-</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isLoading = activeTab === 'pending' ? loadingPending : loadingHistory;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Portal Persetujuan Berjenjang (Approvals)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Otorisasi sekuensial dua tingkat: Tingkat 1 (Supervisor Operasional) &rarr; Tingkat 2 (Kepala Pool & GM).
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => (activeTab === 'pending' ? refetchPending() : refetchHistory())}
          disabled={isLoading}
          className="text-xs gap-1.5 h-9"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span>Segarkan</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border/60 rounded-xl">
          <TabsTrigger value="pending" className="gap-2 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Keputusan</span>
            <Badge className="ml-1 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0.2">
              {pendingList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs">
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Persetujuan</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Approvals */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                    <TableHead className="py-3 px-4">No. Booking & Pemohon</TableHead>
                    <TableHead className="py-3 px-4">Kendaraan & Supir</TableHead>
                    <TableHead className="py-3 px-4">Rute Perjalanan</TableHead>
                    <TableHead className="py-3 px-4">Jadwal Pakai</TableHead>
                    <TableHead className="py-3 px-4">Alur Tingkat</TableHead>
                    <TableHead className="py-3 px-4 text-right">Aksi Otorisasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {loadingPending ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                        <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                        <p>Memeriksa antrean persetujuan...</p>
                      </TableCell>
                    </TableRow>
                  ) : pendingList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                        <p className="font-semibold text-foreground">Tidak Ada Antrean Persetujuan</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">Semua permohonan kendaraan telah diproses atau sudah selesai diotorisasi.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingList.map((item) => {
                      const b = item.booking || item;
                      return (
                        <TableRow key={item.id || b.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-mono font-bold text-amber-500">{b.booking_code}</div>
                            <div className="font-bold text-foreground mt-0.5">{b.requester_name}</div>
                            <div className="text-[10px] text-muted-foreground">{b.department}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-bold text-foreground flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                              {b.vehicle?.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">{b.vehicle?.license_plate}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              {b.driver ? b.driver.name : 'Tanpa Supir'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              {b.origin_region?.name} &rarr; <MapPin className="w-3 h-3 text-rose-400" /> {b.destination_region?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{b.purpose}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs font-mono">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {new Date(b.start_date).toLocaleDateString('id-ID')} - {new Date(b.end_date).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4">
                            {renderApprovalTimeline(b.approvals)}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-right">
                            {isAdmin ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCancel(b)}
                                className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500 font-bold text-xs gap-1.5 h-8"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Batalkan</span>
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="destructiveOutline"
                                  size="sm"
                                  onClick={() => handleOpenAction(b, 'reject')}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="emerald"
                                  size="sm"
                                  onClick={() => handleOpenAction(b, 'approve')}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </Button>
                              </div>
                            )}
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

        {/* Tab 2: Approval History */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                    <TableHead className="py-3 px-4">No. Booking</TableHead>
                    <TableHead className="py-3 px-4">Pemohon & Divisi</TableHead>
                    <TableHead className="py-3 px-4">Armada & Supir</TableHead>
                    <TableHead className="py-3 px-4">Status Pemesanan</TableHead>
                    <TableHead className="py-3 px-4">Alur Persetujuan</TableHead>
                    <TableHead className="py-3 px-4">Catatan Otorisasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                        <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                        <p>Memuat riwayat persetujuan...</p>
                      </TableCell>
                    </TableRow>
                  ) : historyList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                        Belum ada riwayat persetujuan yang tercatat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyList.map((item) => {
                      const b = item.booking || item;
                      return (
                        <TableRow key={item.id || b.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3.5 px-4 text-xs font-mono font-bold text-amber-500">
                            {b.booking_code}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-bold text-foreground">{b.requester_name}</div>
                            <div className="text-[10px] text-muted-foreground">{b.department}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-semibold text-foreground">{b.vehicle?.name}</div>
                            <div className="text-[10px] text-muted-foreground">{b.driver?.name || 'Tanpa Supir'}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4">
                            <BookingStatusBadge status={b.status} />
                          </TableCell>
                          <TableCell className="py-3.5 px-4">
                            {renderApprovalTimeline(b.approvals)}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                            {b.approvals?.map((a) => a.notes).filter(Boolean).join(' | ') || '-'}
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

      {/* Modal Dialog: Konfirmasi Persetujuan / Penolakan (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Konfirmasi Persetujuan Permohonan
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500" />
                  Konfirmasi Penolakan Permohonan
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Anda akan menyetujui alokasi armada untuk permohonan ${selectedBooking?.booking_code}.`
                : `Berikan alasan penolakan untuk permohonan ${selectedBooking?.booking_code}.`}
            </DialogDescription>
          </DialogHeader>

          <Form {...actionForm}>
            <form onSubmit={actionForm.handleSubmit(onSubmitAction)} className="space-y-4 text-xs">
              <FormField
                control={actionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {actionType === 'reject' ? 'Alasan Penolakan *' : 'Catatan Otorisasi (Opsional)'}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          actionType === 'reject'
                            ? 'Jelaskan alasan penolakan permohonan ini...'
                            : 'Catatan tambahan terkait persetujuan operasional...'
                        }
                        rows={3}
                        className="text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsActionModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant={actionType === 'approve' ? 'emerald' : 'destructive'}
                  size="sm"
                  disabled={actionMutation.isPending}
                >
                  {actionMutation.isPending
                    ? 'Memproses...'
                    : actionType === 'approve'
                    ? 'Ya, Setujui Permohonan'
                    : 'Tolak Permohonan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Pembatalan Pemesanan oleh Admin (React Hook Form + Zod + shadcn Form) */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              Batalkan Pemesanan Kendaraan
            </DialogTitle>
            <DialogDescription>
              Pembatalan oleh administrator untuk permohonan <strong>{cancelingBooking?.booking_code}</strong> ({cancelingBooking?.requester_name}).
            </DialogDescription>
          </DialogHeader>

          <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(onSubmitCancel)} className="space-y-4 text-xs">
              <FormField
                control={cancelForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Pembatalan *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan justifikasi administratif pembatalan permohonan..."
                        rows={3}
                        className="text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
                  Tutup
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={cancelMutation.isPending}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {cancelMutation.isPending ? 'Membatalkan...' : 'Ya, Batalkan Pemesanan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
