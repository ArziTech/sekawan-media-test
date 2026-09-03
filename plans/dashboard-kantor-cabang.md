# Plan: Dashboard Monitoring Kantor Cabang & Wilayah Tambang

## 1. Ringkasan & Tujuan
Fitur ini bertujuan untuk menyediakan panel monitoring dan analitik khusus per **Kantor Cabang (Kendari)**, **Kantor Pusat (Jakarta)**, serta **6 Wilayah Tambang Nikel** (Pomalaa, Morowali, Konawe, Kolaka, Halmahera, Sorowako). Dashboard ini memungkinkan Admin dan Manajemen melihat alokasi armada, kesiapan supir, arus perjalanan antar-wilayah, dan beban konsumsi BBM per cabang/site secara terisolasi maupun komparatif.

---

## 2. Kebutuhan Fungsional & Spesifikasi Fitur

### A. Seleksi Wilayah (*Regional Selector & Quick Cards*)
- **Mode Komparasi (Semua Wilayah):** Menampilkan perbandingan ringkas seluruh 8 wilayah operasional.
- **Mode Fokus / Drill-down:** Memilih satu wilayah spesifik (misal: *Kantor Cabang Kendari*) untuk melihat data mendalam:
  - Total unit kendaraan pool cabang (Tersedia, Sedang Digunakan, Dalam Servis)
  - Status supir terdaftar (Siap Tugas, Sedang Bertugas, Off)
  - Arus perjalanan dinas aktif:
    - *Keberangkatan (Outgoing Trips):* Perjalanan yang berawal dari cabang ini ke tambang lain.
    - *Kedatangan (Incoming Trips):* Perjalanan dari cabang/tambang lain yang menuju cabang ini.
  - Konsumsi BBM dan beban biaya bahan bakar bulan berjalan di cabang tersebut.

### B. Visualisasi Data & Grafik Interaktif
1. **Perbandingan Frekuensi Pemesanan per Wilayah:** Bar chart komparasi aktivitas logistik antar kantor cabang & site tambang.
2. **Distribusi Beban Biaya BBM per Cabang:** Bar/Doughnut chart perbandingan pengeluaran bahan bakar per lokasi operasional.
3. **Komposisi Armada per Cabang:** Tipe kendaraan (Angkutan Orang vs Barang) dan status kepemilikan (Milik vs Sewa) di cabang terkait.
4. **Matriks Arus Rute (Top Corridors):** Rute perjalanan dinas terpadat yang terhubung dengan cabang terkait.

### C. Tabel Realtime Status Armada & Perjalanan Terkini di Cabang
1. **Daftar Armada di Pool Cabang:** Nama unit, plat nomor, tipe, kepemilikan, odometer, status, dan estimasi servis.
2. **Perjalanan Aktif & Riwayat Terkini:** Transaksi pemesanan aktif yang melibatkan cabang terpilih sebagai lokasi asal maupun tujuan.

---

## 3. Desain Arsitektur & Teknis

### Backend (Laravel 11)
1. **Endpoint API Baru:**
   - `GET /api/dashboard/regions`: Mengembalikan ringkasan statistik komparatif ke-8 wilayah kantor & tambang.
   - `GET /api/dashboard/regions/{id}`: Mengembalikan data analitik lengkap untuk satu wilayah kantor/tambang tertentu (KPI, armada, supir, trip masuk/keluar, BBM, jadwal servis).
2. **Controller Logic:**
   - Ditambahkan pada `App\Http\Controllers\Api\DashboardController.php`:
     - `regionalOverview(Request $request)`
     - `regionalDetail(Request $request, $id)`

### Frontend (React + Vite + Tailwind CSS v4 + shadcn/ui)
1. **Halaman Baru:** `frontend/src/pages/BranchDashboard.jsx`
   - Header dengan Selector Wilayah interaktif (Dropdown & Badges wilayah).
   - KPI Cards (Kesiapan armada, supir, trip aktif, BBM bulanan).
   - Grid Grafik Chart.js (Komparasi aktivitas, pengeluaran BBM, status armada).
   - Tabel Status Armada Pool Cabang & Logistik Terkini.
2. **Routing & Navigasi:**
   - Ditambahkan rute `/branch-dashboard` pada `frontend/src/App.jsx`.
   - Ditambahkan menu navigasi **"Dashboard Cabang"** pada `frontend/src/components/app-sidebar.jsx`.
   - Judul & Breadcrumb otomatis pada `frontend/src/components/site-header.jsx`.
3. **Komponen UI:** Menggunakan komponen murni shadcn/ui (`Card`, `Badge`, `Button`, `Table`, `Select`, `Tabs`, `Separator`) yang mendukung Dark & Light Mode.

---

## 4. Rencana Tahapan Eksekusi (Step-by-Step)

```
1. [Backend API] Tambahkan endpoint GET /api/dashboard/regions & /api/dashboard/regions/{id} pada DashboardController → verify: curl test JSON output
2. [Routing Backend] Daftarkan route baru di backend/routes/api.php → verify: php artisan route:list
3. [Frontend Page] Buat komponen frontend/src/pages/BranchDashboard.jsx dengan shadcn Card, Table, Select, Chart.js → verify: bun run build
4. [Navigasi] Daftarkan route /branch-dashboard di App.jsx dan menu sidebar di app-sidebar.jsx serta site-header.jsx → verify: UI rendering & navigation
5. [Dokumentasi Wiki] Buat dokumen docs/dashboard-kantor-cabang.md, update docs/README.md & docs/log.md → verify: compliance AGENTS.md
6. [Git Commit & Push] Commit seluruh kode dan push ke origin main → verify: git status clean & push success
```

---

## 5. Kriteria Keberhasilan (Success Criteria)
- [ ] Pengguna dapat memilih kantor cabang/wilayah tambang untuk melihat metrik spesifik wilayah tersebut.
- [ ] Data armada, supir, arus perjalanan (masuk & keluar), dan konsumsi BBM terfilter secara akurat berdasarkan `region_id`.
- [ ] Tampilan responsif, bersih (bebas AI-slop), mendukung Dark/Light mode, dan memiliki kepadatan data yang optimal.
- [ ] Build frontend sukses tanpa error (`bun run build` / `vite build`).
