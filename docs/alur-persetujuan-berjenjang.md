> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Alur Persetujuan Berjenjang (Multi-Level Approval Workflow)

**Terkait:**
- [docs/README.md](./README.md)
- [docs/log.md](./log.md)
- [docs/arsitektur-aplikasi.md](./arsitektur-aplikasi.md)
- [docs/skema-basis-data.md](./skema-basis-data.md)
- [backend/app/Http/Controllers/Api/ApprovalController.php](../backend/app/Http/Controllers/Api/ApprovalController.php)
- [backend/app/Models/Booking.php](../backend/app/Models/Booking.php)
- [backend/app/Models/BookingApproval.php](../backend/app/Models/BookingApproval.php)

Dokumen ini menjelaskan alur bisnis, mekanisme *state machine*, dan aturan validasi untuk persetujuan pemesanan kendaraan operasional tambang nikel yang berjalan secara sekuensial minimal 2 level.

---

## 1. Definisi Pihak Penyetujui (Approver) & Batasan Peran Admin

Sistem membedakan pihak penyetujui menjadi 2 tingkatan otoritas dan menetapkan batasan wewenang yang tegas:

| Tingkat / Peran | Peran / Jabatan | Tugas & Batasan Otoritas |
| :--- | :--- | :--- |
| **Level 1** | **Supervisor Operasional / Atasan Pemohon** | Memvalidasi urgensi operasional dan relevansi keperluan pemesanan dengan jadwal kerja lapangan (Dapat **Setujui / Tolak**). |
| **Level 2** | **Kepala Pool / GM Operasional Tambang** | Memberikan otorisasi final atas ketersediaan armada, kepatuhan keselamatan tambang, dan anggaran operasional (Dapat **Setujui / Tolak**). |
| **Admin** | **Admin Pool Kendaraan** | Mengelola master armada/supir, input pemesanan, memulai/menyelesaikan perjalanan, dan **Membatalkan (Cancel) Pemesanan**. Admin **TIDAK** dapat menyetujui atau menolak persetujuan atas nama pihak approver. |

---

## 2. Diagram Alur State Machine

```
   [ Admin Buat Pemesanan ]
              │
              ▼
   ┌──────────────────────┐
   │   pending_level_1    │ <─── Menunggu Persetujuan Level 1 (Supervisor)
   └──────────┬───────────┘
              │
      ┌───────┴───────┐
      │               │
  [ Approve ]     [ Reject ]
      │               │
      ▼               ▼
┌──────────────┐ ┌──────────┐
│pending_level_2│ │ rejected │ ──► (Alasan penolakan dicatat, proses selesai)
└──────┬───────┘ └──────────┘
       │
   ┌───┴───┐
   │       │
[Approve] [Reject]
   │       │
   ▼       ▼
┌──────────┐ ┌──────────┐
│ approved │ │ rejected │
└────┬─────┘ └──────────┘
     │
     ▼ (Admin Klik "Mulai Perjalanan")
┌──────────┐
│  in_use  │ ──► (Armada: in_use, Driver: on_duty)
└────┬─────┘
     │
     ▼ (Admin Klik "Selesaikan Perjalanan" + Input Odometer Akhir)
┌──────────┐
│completed │ ──► (Armada: available, Driver: available)
└──────────┘
```

---

## 3. Aturan Validasi Sekuensial

1. **Inisialisasi Otomatis:** Saat Admin membuat pemesanan, sistem secara otomatis membuat 2 baris data di tabel `booking_approvals` (Approval Level 1 dan Approval Level 2) dengan status awal `pending`.
2. **Sekuensial Ketat:**
   - Approver Level 2 **tidak dapat** melakukan tindakan persetujuan sebelum Approver Level 1 memberikan status `approved`.
   - Jika Level 1 melakukan `reject`, status pemesanan langsung berubah menjadi `rejected` dan proses persetujuan dihentikan.
3. **Pencatatan Catatan & Audit Trail:**
   - Pada setiap persetujuan atau penolakan, catatan (*notes*) disimpan bersama cap waktu (*action_date*) dan identitas user penyetujui.
   - Peristiwa dicatat secara otomatis pada tabel `activity_logs`.
