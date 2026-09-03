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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
    queryKey: ['approvals-pending', user?.id],
    queryFn: async () => {
      const res = await api.get('/approvals/pending');
      return res.data?.data || [];
    },
  });

  // TanStack Query: Fetch Approval History
  const { data: historyList = [], isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['approvals-history', user?.id],
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
    const tier1 = approvals?.find((a) => a.approval_level === 1 || a.tier_level === 1);
    const tier2 = approvals?.find((a) => a.approval_level === 2 || a.tier_level === 2);

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

        {/* Tab 1: Pending Approvals (Card Grid Layout) */}
        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <Card className="border-border/80 p-12 text-center text-muted-foreground text-xs">
              <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
              <p>Memeriksa antrean persetujuan...</p>
            </Card>
          ) : pendingList.length === 0 ? (
            <Card className="border-border/80 text-center py-12">
              <CardContent className="space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-1" />
                <h3 className="text-sm font-bold text-foreground">Semua Persetujuan Selesai</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Tidak ada pemesanan kendaraan yang sedang menunggu tindakan persetujuan saat ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingList.map((item) => {
                const b = item.booking || item;
                const l1 = b.approvals?.find((a) => a.tier_level === 1);
                const l2 = b.approvals?.find((a) => a.tier_level === 2);
                const currentLevel = b.status === 'pending_level_1' ? 1 : 2;

                return (
                  <Card key={item.id || b.id} className="border-border/80 shadow-xs flex flex-col justify-between overflow-hidden hover:border-amber-500/40 transition-colors">
                    <CardHeader className="p-4 pb-3 border-b border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {b.booking_code}
                          </span>
                          <BookingStatusBadge status={b.status} />
                        </div>

                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                          Persetujuan Level {currentLevel}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3.5">
                      {/* Pemohon & Divisi */}
                      <div>
                        <p className="font-bold text-foreground text-sm">{b.requester_name}</p>
                        <p className="text-xs text-muted-foreground">{b.requester_department || b.department}</p>
                      </div>

                      {/* Detail Armada, Supir, Rute & Jadwal */}
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{b.vehicle?.name}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">({b.vehicle?.license_plate})</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Supir: <strong className="text-foreground">{b.driver ? b.driver.name : 'Tanpa Supir (Lepas Kunci)'}</strong></span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{b.origin_region?.name}</span>
                          <span className="text-muted-foreground font-bold">&rarr;</span>
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <strong className="text-foreground">{b.destination_region?.name}</strong>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-mono text-[11px]">
                            {new Date(b.start_date).toLocaleDateString('id-ID')} s/d {new Date(b.end_date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Keperluan Dinas */}
                      {b.purpose && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Keperluan Dinas:
                          </span>
                          <p className="text-xs text-foreground bg-muted/20 p-2.5 rounded-lg border border-border/60 italic">
                            "{b.purpose}"
                          </p>
                        </div>
                      )}

                      {/* Catatan Level 1 (jika sedang di Level 2) */}
                      {currentLevel === 2 && l1 && l1.notes && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                          <p className="font-bold text-emerald-500">
                            Catatan Penyetujui Level 1 (Supervisor):
                          </p>
                          <p className="text-foreground mt-0.5 font-italic">"{l1.notes}"</p>
                        </div>
                      )}

                      {/* Status Otorisasi Berjenjang */}
                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          Alur Persetujuan Bertingkat:
                        </span>
                        {renderApprovalTimeline(b.approvals)}
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-3 border-t border-border/80 bg-muted/10">
                      {isAdmin ? (
                        /* Admin View: Info status persetujuan + Tombol Batalkan */
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              Menunggu otorisasi: <strong className="text-foreground">{currentLevel === 1 ? 'Penyetujui Level 1 (Supervisor)' : 'Penyetujui Level 2 (Kepala Pool / GM)'}</strong>
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="destructiveOutline"
                            size="sm"
                            onClick={() => handleOpenCancel(b)}
                            className="w-full sm:w-auto font-bold text-xs gap-1.5 h-8"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Batalkan</span>
                          </Button>
                        </div>
                      ) : (
                        /* Approver View: Tombol Tolak & Setujui */
                        <div className="flex items-center justify-end gap-2 w-full">
                          <Button
                            type="button"
                            variant="destructiveOutline"
                            size="sm"
                            onClick={() => handleOpenAction(b, 'reject')}
                            className="flex-1 font-bold text-xs gap-1.5 h-8.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </Button>
                          <Button
                            type="button"
                            variant="emerald"
                            size="sm"
                            onClick={() => handleOpenAction(b, 'approve')}
                            className="flex-1 font-bold text-xs gap-1.5 h-8.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui Permohonan</span>
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Approval History */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase font-bold tracking-wider">
                    <TableHead className="py-3 px-4">No. Booking</TableHead>
                    <TableHead className="py-3 px-4">Waktu Otorisasi</TableHead>
                    <TableHead className="py-3 px-4">Pemohon & Divisi</TableHead>
                    <TableHead className="py-3 px-4">Armada & Supir</TableHead>
                    <TableHead className="py-3 px-4">Keputusan Otorisasi</TableHead>
                    <TableHead className="py-3 px-4">Catatan Anda</TableHead>
                    <TableHead className="py-3 px-4">Status Pemesanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        <div className="inline-block w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                        <p>Memuat riwayat persetujuan...</p>
                      </TableCell>
                    </TableRow>
                  ) : historyList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        Belum ada riwayat persetujuan yang Anda proses.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyList.map((item) => {
                      const b = item.booking || item;
                      const isApproved = item.status === 'approved';
                      const isRejected = item.status === 'rejected';

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-mono font-bold text-amber-500">{b.booking_code}</div>
                            {item.approval_level && (
                              <div className="text-[10px] text-muted-foreground font-medium">Level {item.approval_level}</div>
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                            {item.action_date ? new Date(item.action_date).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }) : '-'}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-bold text-foreground">{b.requester_name}</div>
                            <div className="text-[10px] text-muted-foreground">{b.requester_department || b.department}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs">
                            <div className="font-semibold text-foreground">{b.vehicle?.name}</div>
                            <div className="text-[10px] text-muted-foreground">{b.driver?.name || 'Tanpa Supir'}</div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4">
                            {isApproved && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Disetujui (L{item.approval_level || 1})
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-bold gap-1">
                                <XCircle className="w-3 h-3" /> Ditolak (L{item.approval_level || 1})
                              </Badge>
                            )}
                            {!isApproved && !isRejected && (
                              <Badge variant="outline" className="text-[10px]">
                                {item.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate italic">
                            "{item.notes || '-'}"
                          </TableCell>
                          <TableCell className="py-3.5 px-4">
                            <BookingStatusBadge status={b.status} />
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
