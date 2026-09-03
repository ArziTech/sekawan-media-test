# Plan: Halaman Detail Monitoring Kantor Cabang & Site Tambang

## 1. Ringkasan & Tujuan
Menyediakan halaman visualisasi detail (*Drill-Down / Regional Detail Page*) untuk masing-masing dari 8 wilayah operasional (1 Kantor Pusat Jakarta, 1 Kantor Cabang Kendari, dan 6 Wilayah Site Tambang Nikel). Halaman ini memberikan visibilitas komprehensif terhadap inventaris armada lokal, personil supir, arus perjalanan aktif (keluar/masuk), konsumsi BBM bulanan, riwayat servis, serta rute destinasi logistik utama.

---

## 2. Kebutuhan Fungsional & Spesifikasi Teknis

### A. Backend (REST API Endpoint)
- **Endpoint:** `GET /api/dashboard/regions/{id}` pada `App\Http\Controllers\Api\DashboardController@regionalDetail`
- **Data Payload:**
  - `region`: Informasi master wilayah (nama, kode, tipe, alamat).
  - `stats`: Agregasi armada (total, available, in_use, in_service, passenger, cargo, owned, rented), supir (total, available, on_duty), trip aktif (outgoing & incoming), dan beban BBM bulan berjalan (liter & total biaya Rupiah).
  - `vehicles`: Daftar unit armada yang ditempatkan di pool wilayah ini.
  - `drivers`: Daftar supir lokal dan status ketersediaannya.
  - `active_outgoing`: Pemesanan/perjalanan aktif yang berangkat dari wilayah ini.
  - `active_incoming`: Perjalanan aktif yang sedang menuju ke wilayah ini.
  - `recent_completed`: 10 riwayat perjalanan selesai terbaru.
  - `fuel_logs`: 10 log pengisian bahan bakar terbaru armada wilayah ini.
  - `service_logs`: 10 riwayat dan jadwal perawatan armada wilayah ini.
  - `top_destinations`: Peringkat rute destinasi paling sering dikunjungi dari wilayah ini.
- **Otorisasi:** Akun Admin dapat melihat detail seluruh wilayah; Akun Approver difokuskan pada wilayah cabang tugasnya.

### B. Frontend (React + Vite + shadcn/ui)
- **Komponen Halaman Baru:** `frontend/src/pages/BranchDetail.jsx`
- **Struktur Tampilan:**
  1. **Header & Quick Switcher:**
     - Tombol kembali `<- Kembali ke Overview Cabang`.
     - Nama Wilayah, Badge Kategori (*Kantor Pusat / Kantor Cabang / Site Tambang*), Kode Wilayah, dan Alamat Lengkap.
     - Dropdown Switcher Cepat untuk berpindah antar wilayah (khusus Admin).
  2. **Row KPI Summary (4 Kartu Utama):**
     - **Kartu 1:** Kesiapan Armada Pool (Unit Siap / Total, Unit Berjalan, Unit Servis).
     - **Kartu 2:** Kesiapan Personil Supir (Siap / Total, Sedang Bertugas).
     - **Kartu 3:** Arus Logistik Aktif (Trip Keluar Outgoing & Trip Masuk Incoming).
     - **Kartu 4:** Beban Biaya BBM Bulan Ini (`formatRupiah`, Total Liter, Periode Dinamis).
  3. **Tabbed Content Sections (`Tabs`):**
     - **Tab `fleet-drivers` (Armada & Supir):** Tabel detail unit kendaraan lokal (tipe, plat, odometer, status) dan tabel personil supir.
     - **Tab `active-trips` (Arus Perjalanan):** Daftar trip keluar aktif, trip masuk aktif, dan 10 riwayat trip selesai.
     - **Tab `fuel-maintenance` (BBM & Servis):** Tabel 10 pengisian BBM terakhir dan log pemeliharaan/servis berkala.
     - **Tab `destinations` (Analitik Rute):** Visual bar chart & tabel frekuensi destinasi utama dari wilayah ini.
- **Integrasi Entry Point:**
  - Pada `BranchDashboard.jsx`: Setiap kartu wilayah dan baris tabel memiliki tombol **"Lihat Detail Wilayah &rarr;"** yang mengarah ke `/branch-dashboard/:id`.
  - Daftarkan route `/branch-dashboard/:id` di `frontend/src/App.jsx`.
  - Breadcrumb title mapping di `frontend/src/components/site-header.jsx`.

---

## 3. Tahapan Eksekusi (Step-by-Step)
```
1. [Backend Verification] Verifikasi & optimasi endpoint GET /api/dashboard/regions/{id} → verify: curl endpoint with sample region ID
2. [Frontend Detail Page] Buat frontend/src/pages/BranchDetail.jsx dengan komponen shadcn & Chart.js → verify: bun run build
3. [Integrasi & Navigasi] Tambahkan link navigasi di BranchDashboard.jsx, daftarkan route /branch-dashboard/:id di App.jsx dan site-header.jsx → verify: navigasi antar halaman berfungsi lancar
4. [Dokumentasi Wiki] Perbarui docs/dashboard-kantor-cabang.md, docs/README.md, dan docs/log.md → verify: compliance AGENTS.md
5. [Git Commit & Push] Commit seluruh kode dan push ke origin main → verify: git status clean & push success
```
