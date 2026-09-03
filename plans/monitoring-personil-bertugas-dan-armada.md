# Plan: Halaman Monitoring Personil Bertugas, Operasional Armada & Integrasi BBM Otomatis

## 1. Latar Belakang & Kebutuhan Fitur
Koordinator pool dan manajemen membutuhkan **halaman terpusat untuk memantau siapa saja yang sedang bertugas di lapangan (*live active duty assignments*)**, kendaraan apa yang dikemudikan, rute perjalanan tambang yang sedang ditempuh, serta ketersediaan personil supir standby.

Selain sebagai media monitoring, halaman ini berfungsi sebagai **pusat kontrol status operasional (*Operational State Control*)**:
- Memulai perjalanan (*Start Trip*) &rarr; Driver menjadi `on_duty`, Armada menjadi `in_use`.
- Menyelesaikan perjalanan (*Complete Trip*) &rarr; **Driver dan Armada otomatis kembali berstatus `available` (Tersedia)** dan odometer kendaraan diperbarui.
- **Integrasi Pengisian BBM Opsional (*Integrated Fuel Log on Trip Completion*):** Saat menyelesaikan perjalanan, petugas dapat mencatat pengisian bahan bakar yang dilakukan selama bertugas, yang otomatis tersimpan ke modul log BBM (`/fuel-logs`) dan analitik konsumsi BBM perusahaan.

---

## 2. Ruang Lingkup Fitur Baru

### A. Metrik & KPI Operasional Lapangan (Summary Cards)
1. **Personil Sedang Bertugas (*On-Duty Drivers*):** Jumlah supir yang sedang aktif dalam perjalanan dinas.
2. **Armada Beroperasi (*Vehicles in Operation*):** Jumlah unit kendaraan tambang yang sedang di luar pool.
3. **Supir Standby Siap Tugas (*Standby Personnel*):** Jumlah supir yang berada di pool dan siap menerima penugasan baru (*status: available*).
4. **Penugasan Terjadwal (*Scheduled / Ready Trips*):** Pemesanan yang telah disetujui penuh (*approved*) dan siap diberangkatkan.

### B. Tampilan Tab Navigasi Multi-Dimensi
1. **Tab 1: Sedang Bertugas di Lapangan (*Active Live Duties*):**
   - Profil supir (nama, nomor SIM BII Umum, nomor kontak telepon/WhatsApp).
   - Pemohon tugas dinas & departemen/divisi kerja.
   - Spesifikasi unit kendaraan (nama model, plat nomor, tipe penumpang/barang, status kepemilikan).
   - Rute operasional (Pool Keberangkatan &rarr; Lokasi Site Tujuan).
   - Waktu mulai tugas, estimasi tanggal kembali, serta durasi berjalan.
   - Odometer awal saat kendaraan keluar dari pool.
   - **Aksi Cepat:**
     - Hubungi WhatsApp Supir (`https://wa.me/...`) & Telepon (`tel:...`).
     - Lihat Rincian Tugas.
     - **Tombol "Selesaikan Perjalanan (Complete Trip)"** &rarr; Membuka Modal Selesai + Opsi BBM.
2. **Tab 2: Terjadwal Siap Berangkat (*Scheduled Assignments*):**
   - Menampilkan penugasan yang sudah disetujui penuh (Level 1 & Level 2).
   - **Tombol "Mulai Perjalanan (Start Trip)"** &rarr; Memperbarui status booking menjadi `in_progress`, driver menjadi `on_duty`, kendaraan menjadi `in_use`.
3. **Tab 3: Ketersediaan Supir Standby (*Standby Drivers Pool*):**
   - Daftar personil supir siap tugas per wilayah penempatan pool (Kantor Pusat, Kendari, Pomalaa, Morowali, Konawe, Kolaka, Halmahera, Sorowako).
   - Status kesiapan dan kendaraan yang tersedia di pool yang sama.
4. **Tab 4: Riwayat Selesai Hari Ini (*Completed Today*):**
   - Rekap penugasan yang telah kembali ke pool hari ini lengkap dengan odometer akhir, jarak tempuh (KM), dan info konsumsi BBM yang tercatat.

### C. Modal "Selesaikan Perjalanan" dengan Integrasi BBM Opsional
- **Input Utama:**
  - Odometer Awal (read-only info) & Odometer Akhir Kedatangan (KM) * (validasi $\ge$ odometer awal).
- **Checkbox / Toggle Opsional:**
  - `[ ] Catat Pengisian BBM Selama Perjalanan Ini`
- **Field BBM Tambahan (Aktif jika dicentang):**
  - Volume Pengisian (Liter) * (mis. 45.5 L)
  - Harga per Liter (Rp) * (mis. Rp 16.500)
  - Kalkulasi Real-time: Estimasi Total Biaya BBM (mis. Rp 750.750)
  - Jenis Bahan Bakar (prefill otomatis dari jenis BBM kendaraan)
  - Nomor Struk / Nota SPBU (opsional)
  - Catatan Pengisian BBM (opsional)
- **Eksekusi Backend:**
  - Mengubah status booking ke `completed`.
  - Mengubah status driver ke `available`.
  - Mengubah status vehicle ke `available` dan update `current_odometer`.
  - Membuat record baru pada tabel `fuel_logs` terhubung ke `booking_id` dan `vehicle_id`.
  - Mencatat Activity Log terintegrasi.

---

## 3. Rencana Arsitektur & Implementasi Teknis

### 1. Backend (Laravel 13.x REST API)
- **Enhance Controller:** `backend/app/Http/Controllers/Api/BookingController.php`
  - Perbarui method `completeTrip` untuk memvalidasi dan menyimpan data BBM opsional ke tabel `fuel_logs` dalam 1 database transaction atomik.
- **Controller Baru:** `backend/app/Http/Controllers/Api/DutyController.php`
  - Method `index(Request $request)`:
    - Mengambil penugasan aktif (`in_progress`, `approved`), supir standby per wilayah, dan tugas selesai hari ini beserta statistik KPI dalam 1 request cepat.
- **Rute API:**
  - `GET /api/duties` terdaftar pada `backend/routes/api.php` di dalam middleware `auth:sanctum`.

### 2. Frontend (React + TanStack Query + shadcn/ui + Zod)
- **Halaman Baru:** `frontend/src/pages/Duties.jsx`
  - Skema Zod `completeTripWithFuelSchema` untuk validasi odometer akhir dan conditional validation untuk field BBM.
  - Menggunakan TanStack Query `useQuery(['active-duties', filters])`.
  - Menggunakan `useMutation` untuk *Start Trip* dan *Complete Trip* dengan cache invalidation otomatis ke `['active-duties']`, `['bookings']`, `['fuel-logs']`, `['drivers']`, `['vehicles']`, dan `['dashboard-stats']`.
  - Komponen shadcn/ui: `Card`, `Badge`, `Button`, `Table`, `Tabs`, `Dialog`, `Select`, `Input`, `Checkbox`, `Form`.
- **Integrasi Navigasi & Sidebar:**
  - Tambahkan menu "Personil Bertugas" pada `frontend/src/components/app-sidebar.jsx` dengan icon `Radio` dan badge dinamis jumlah tugas aktif.
  - Daftarkan rute `/duties` pada `frontend/src/App.jsx`.
  - Daftarkan judul breadcrumb pada `frontend/src/components/site-header.jsx`.

### 3. Dokumentasi & Wiki
- Buat dokumen wiki `docs/monitoring-personil-bertugas.md`.
- Catat log perubahan pada `docs/log.md` dan update `docs/README.md`.

---

## 4. Rencana Langkah Eksekusi

```
1. Update BookingController completeTrip untuk mendukung input BBM opsional → verify: unit/endpoint test
2. Buat Backend Controller DutyController & daftarkan rute GET /api/duties → verify: curl API test
3. Buat Halaman Frontend Duties.jsx dengan Tabs, KPI Cards, Modal Selesai + BBM → verify: vite build
4. Daftarkan Navigasi Sidebar, Rute App.jsx, dan Breadcrumb Header → verify: navigasi berfungsi
5. Uji Alur Penugasan & Integrasi Pengisian BBM Otomatis → verify: data muncul di /duties dan /fuel-logs
6. Buat Dokumentasi Wiki docs/monitoring-personil-bertugas.md & docs/log.md → verify: cross-reference lengkap
7. Git Commit & Push ke branch main
```
