import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Eye, Terminal } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const ActivityLogs = () => {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  // Modal Detail Payload
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs', {
        params: {
          search: search || undefined,
          module: moduleFilter || undefined,
        },
      });

      if (res.data.success) {
        setLogs(res.data.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Log Aktivitas Aplikasi (Audit Trail)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rekam jejak audit keamanan dan transparansi setiap aksi pengguna pada sistem armada.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              placeholder="Cari aksi log, nama user, alamat IP..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Semua Modul</option>
            <option value="bookings">Pemesanan (Bookings)</option>
            <option value="approvals">Persetujuan (Approvals)</option>
            <option value="vehicles">Armada Kendaraan</option>
            <option value="drivers">Driver</option>
            <option value="fuel">Konsumsi BBM</option>
            <option value="service">Servis Perawatan</option>
            <option value="auth">Autentikasi (Auth)</option>
          </select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu (Timestamp)</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead>Aksi & Deskripsi</TableHead>
                <TableHead>Alamat IP</TableHead>
                <TableHead className="text-right">Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    Memuat audit trail...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    Belum ada data log aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-foreground">{log.user?.name || 'Sistem'}</p>
                      <p className="text-[10px] text-muted-foreground">{log.user?.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-mono text-amber-500 font-semibold block text-[11px]">{log.action}</span>
                      <p className="text-muted-foreground mt-0.5">{log.description}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.payload ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(log)}
                          className="h-7 text-xs font-semibold text-amber-500 hover:text-amber-400 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          JSON
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Detail JSON Payload */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Audit Log #{selectedLog?.id}</DialogTitle>
            <DialogDescription>
              {selectedLog?.action} &middot; {selectedLog?.created_at && new Date(selectedLog.created_at).toLocaleString('id-ID')}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <p className="text-muted-foreground">
                  User: <strong className="text-foreground">{selectedLog.user?.name || 'Sistem'}</strong> ({selectedLog.user?.email})
                </p>
                <p className="text-muted-foreground">
                  Deskripsi: <span className="text-foreground">{selectedLog.description}</span>
                </p>
                <p className="text-muted-foreground font-mono">
                  IP: {selectedLog.ip_address} &middot; Agent: {selectedLog.user_agent?.substring(0, 50)}...
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-500" />
                  Payload JSON:
                </label>
                <pre className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono text-[11px] overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
