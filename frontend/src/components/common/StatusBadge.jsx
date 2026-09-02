import React from 'react';
import { Badge } from "@/components/ui/badge";

export const BookingStatusBadge = ({ status }) => {
  switch (status) {
    case 'pending_level_1':
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-semibold text-[11px]">
          Menunggu Level 1
        </Badge>
      );
    case 'pending_level_2':
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-semibold text-[11px]">
          Menunggu Level 2
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 font-semibold text-[11px]">
          Disetujui
        </Badge>
      );
    case 'in_use':
      return (
        <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 font-semibold text-[11px] animate-pulse">
          Sedang Berjalan
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground bg-muted font-semibold text-[11px]">
          Selesai
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="font-semibold text-[11px]">
          Ditolak
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="border-border text-muted-foreground font-semibold text-[11px]">
          Dibatalkan
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px] font-semibold">
          {status}
        </Badge>
      );
  }
};

export const VehicleStatusBadge = ({ status }) => {
  switch (status) {
    case 'available':
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 font-semibold text-[11px]">
          Tersedia
        </Badge>
      );
    case 'in_use':
      return (
        <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 font-semibold text-[11px]">
          Digunakan
        </Badge>
      );
    case 'in_service':
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-semibold text-[11px]">
          Dalam Servis
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const DriverStatusBadge = ({ status }) => {
  switch (status) {
    case 'available':
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 font-semibold text-[11px]">
          Siap Bertugas
        </Badge>
      );
    case 'on_duty':
      return (
        <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 font-semibold text-[11px]">
          Sedang Bertugas
        </Badge>
      );
    case 'off':
      return (
        <Badge variant="outline" className="border-border text-muted-foreground font-semibold text-[11px]">
          Libur / Off
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
