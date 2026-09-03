# Documentation Log

Log kronologis append-only perubahan dokumentasi wiki di `docs/`.

## [2026-09-03] ingest | Inisialisasi Perencanaan & Arsitektur Sistem Tambang Nikel

- **Dokumen Dibuat:**
  - `plans/aplikasi-pemesanan-monitoring-kendaraan.md`: Rencana komprehensif implementasi sistem pemesanan kendaraan (Laravel 13.x REST API + React.js SPA).
  - `docs/arsitektur-aplikasi.md`: Arsitektur teknis decoupled SPA, RBAC 2 role, dan workflow multi-level approval 2 level.
  - `docs/README.md`: Pembaruan indeks wiki topik dokumentasi.
- **Tujuan / Konteks:** Menyusun dokumen arsitektur dan spesifikasi kebutuhan untuk sistem pemesanan dan monitoring kendaraan operasional tambang nikel (1 Kantor Pusat, 1 Cabang, 6 Tambang) sesuai ketentuan di `AGENTS.md`.

## [2026-09-03] update | Breakdown Langkah Implementasi Laravel 13.x & React SPA

- **Dokumen Diperbarui:** `plans/aplikasi-pemesanan-monitoring-kendaraan.md`.
- **Perubahan:** Menambahkan rincian breakdown 5 tahap implementasi: Scaffolding, Database/Migrations/Seeders, Backend REST API & Approval Engine, Frontend React UI/UX, dan Verifikasi/README.

## [2026-09-03] update | Pembuatan 5 Rencana Kerja Mandiri di folder plans/

- **Dokumen Dibuat & Diperbarui:**
  - `plans/01-setup-lingkungan-dan-scaffolding.md`: Rencana Setup Lingkungan, Containerization & Scaffolding.
  - `plans/02-database-migrations-dan-seeders.md`: Rencana Pemodelan Database, 10 Migrasi Tabel & Seeders.
  - `plans/03-backend-api-dan-approval-engine.md`: Rencana Backend API Laravel 13.x & Approval Engine.
  - `plans/04-frontend-react-spa-ui-ux.md`: Rencana Frontend React.js SPA & Visual Charts.
  - `plans/05-testing-dokumentasi-dan-verifikasi.md`: Rencana Testing E2E & Dokumentasi README.md.
  - `plans/aplikasi-pemesanan-monitoring-kendaraan.md`: Diperbarui sebagai Master Plan Index yang menghubungkan kelima rencana.

## [2026-09-03] ingest | Sinkronisasi Dokumentasi Teknologi via Context7 MCP

- **Teknologi yang Disinkronkan:**
  - **Laravel 13.x:** Struktur routing modern `bootstrap/app.php`, middleware alias & grouping, API routes, Eloquent relationships & foreign key constraints.
  - **React.js & React Router (v6/v7):** Declarative routing (`<BrowserRouter>`, `<Routes>`, `<Route>`, `<Outlet>`), Context API auth guards, and SPA lifecycle.
  - **Chart.js:** Registration modules (`CategoryScale`, `LinearScale`, `BarElement`, `LineElement`, `ArcElement`, `PointElement`), dataset styling, and responsive layout configuration.
- **Tujuan:** Memastikan implementasi kode menggunakan standar dan API terbaru sesuai dokumentasi resmi framework/library.

## [2026-09-03] update | Selesai Eksekusi Plan 01 (Setup & Scaffolding)

- **Komponen Selesai:**
  - Inisialisasi Backend **Laravel 13.x REST API** (Sanctum, CORS, PhpSpreadsheet).
  - Inisialisasi Frontend **React.js SPA** (Vite, React 19, Tailwind CSS v4, Lucide Icons, Chart.js, Axios, React Router).
  - Konfigurasi Containerization **Docker Compose** (PHP 8.2-FPM Alpine dengan pdo_mysql & gd, MySQL 8.0, Nginx).

## [2026-09-03] update | Selesai Eksekusi Plan 02 (Database Migrations & Seeders)

- **Komponen Selesai:**
  - Migrasi 10 tabel database: `regions`, `rental_companies`, `vehicles`, `drivers`, `users`, `bookings`, `booking_approvals`, `fuel_logs`, `service_logs`, `activity_logs`.
  - 10 Eloquent Models dengan relasi dan type-casting lengkap.
  - DatabaseSeeder yang memuat 1 Kantor Pusat, 1 Kantor Cabang, 6 Tambang Nikel, 16 Kendaraan (Milik & Sewa, Orang & Barang), 8 Supir, Akun Admin & Approver Level 1 & 2, Sample Pemesanan berbagai status, Log BBM, dan Servis.

## [2026-09-03] update | Selesai Eksekusi Plan 03 (Backend REST API & Multi-Level Approval Engine)

- **Komponen Selesai:**
  - `ActivityLogger` Service untuk audit trail otomatis seluruh proses transaksi.
  - `AuthController`: login, profil `me`, logout, dan `demoUsers` untuk quick role switcher.
  - `BookingController`: CRUD pemesanan, ketersediaan armada/driver, start trip & complete trip (dengan pencatatan odometer).
  - `ApprovalController`: Alur sekuensial Level 1 (Atasan) $\rightarrow$ Level 2 (Kepala Pool/GM) dengan status tracking, catatan, dan audit log.
  - `VehicleController` & `DriverController`: Manajemen armada dan master supir operasional.
  - `FuelLogController` & `ServiceLogController`: Pencatatan konsumsi bahan bakar dan jadwal/riwayat servis.
  - `DashboardController`: Agregasi metrik KPI, grafik pemakaian kendaraan, rasio armada, dan tren konsumsi BBM bulanan.
  - `ReportController`: Filter dinamis laporan periodik dan generator spreadsheet Excel (.xlsx) dengan formula rekapitulasi.
  - `ActivityLogController`: Audit trail viewer dengan payload data.
  - 41 REST API routes terdaftar dan terverifikasi di Laravel 13.x.

## [2026-09-03] update | Selesai Eksekusi Plan 04 (Frontend React.js SPA & UI/UX)

- **Komponen Selesai:**
  - `AuthContext` & `ToastContext` untuk manajemen sesi autentikasi dan notifikasi global.
  - `AppLayout`, `Sidebar` dinamis per role, dan `Navbar` dengan Quick Demo Account Switcher.
  - Halaman `Login`: Antarmuka modern dengan tombol 1-klik login akun demo (Admin, Approver 1, Approver 2).
  - Halaman `Dashboard`: 4 KPI Cards, 3 Grafik Interaktif Chart.js (Frekuensi Pemakaian Kendaraan, Komposisi Armada, Tren BBM), dan ringkasan pesanan & servis terdekat.
  - Halaman `Bookings`: Form pemesanan modal, dropdown armada/driver/approver L1 & L2, modal timeline persetujuan, start trip, dan complete trip (input odometer akhir).
  - Halaman `Approvals`: Portal khusus persetujuan berjenjang dengan modal Setujui / Tolak dan catatan alasan.
  - Halaman `Vehicles`, `Drivers`, `FuelLogs`, `ServiceLogs`: Manajemen inventaris armada, supir, log BBM, dan jadwal servis.
  - Halaman `Reports`: Filter tanggal/region/status dan tombol **Export ke Excel (.xlsx)**.
  - Halaman `ActivityLogs`: Audit trail viewer dengan modal detail JSON payload.

## [2026-09-03] update | Selesai Eksekusi Plan 05 (Testing E2E, Dokumentasi README.md & Verifikasi)

- **Komponen Selesai:**
  - Script pengujian otomatis `backend/tests/e2e_verification.php` mengeksekusi seluruh 6 skenario bisnis (User & Role check, 8 Regions, Armada Milik/Sewa, Alur Sequential Approval Level 1 -> Level 2 -> Start Trip -> Complete Trip, Log BBM & Servis, dan Activity Log) dengan status **100% Passed**.
  - Pembuatan file dokumentasi komprehensif **`README.md`** di root repository yang memuat:
    - Spesifikasi versi teknologi (Laravel 13.x, PHP 8.2+, React 19, MySQL 8.0, Tailwind CSS v4, Chart.js).
    - Tabel kredensial default untuk seluruh role (Admin, Approver Level 1, Approver Level 2).
    - Panduan menjalankan sistem (Docker Compose 1-command & Standalone).
    - Rincian alur kerja persetujuan berjenjang, grafik analitik dashboard, export Excel, dan audit trail.
  - Script helper `start.sh` dan production build frontend React di `frontend/dist/`.

## [2026-09-03] update | Integrasi shadcn/ui & Push ke Cloud Repository GitHub

- **Komponen Selesai:**
  - Pemasangan library komponen UI **shadcn/ui** (`Button`, `Card`, `Badge`, `Dialog`, `Input`, `Textarea`, `Table`, `cn` utility) berbasis Radix UI dan Tailwind CSS.
  - Kompilasi build frontend terverifikasi sukses (`vite build` selesai tanpa error).
  - Inisialisasi Git tracking (memastikan `docs/`, `plans/`, `archive/`, `archived/`, dan `AGENTS.md` tetap diabaikan di `.gitignore`).
  - Remote cloud repository ditambahkan: `git@github.com:ArziTech/sekawan-media-test.git`.
  - Berhasil melakukan `git commit` dan `git push -u origin main` ke branch `main`.

## [2026-09-03] lint | Audit & Pemutakhiran Menyeluruh Wiki Dokumentasi docs/

- **Hasil Audit & Pembaruan:**
  - Pembuatan dokumen topik mandiri baru: `docs/alur-persetujuan-berjenjang.md`, `docs/skema-basis-data.md`, dan `docs/panduan-penggunaan.md`.
  - Semua dokumen topik memiliki header timestamp standar (`Dibuat`/`Diperbarui`/`Status`).
  - Semua dokumen topik memiliki bagian `Terkait:` yang menautkan silang ke dokumen wiki lain dan file kode relevan.
  - Indeks `docs/README.md` diperbarui memuat seluruh 4 halaman wiki topik aktif.
  - Tidak ada halaman yatim (*orphan page*) atau link rusak. Seluruh klaim teknis selaras dengan kode implementasi Laravel 13.x REST API dan React 19 SPA.

## [2026-09-03] update | Perbaikan Kompatibilitas Versi PHP Container Docker (PHP 8.4-FPM Alpine)

- **Masalah:** Laravel 13.x membutuhkan runtime PHP versi $\ge$ 8.4.1. Image dasar sebelumnya `php:8.2-fpm-alpine` menyebabkan kegagalan platform check Composer saat `artisan migrate:fresh`.
- **Solusi:**
  - Memperbarui `docker/php/Dockerfile` menggunakan image `php:8.4-fpm-alpine`.
  - Menambahkan environment `DB_CONNECTION: mysql` pada `docker-compose.yml`.
  - Melakukan rebuild container dan verifikasi migrasi database serta seeder (`docker compose exec app php artisan migrate:fresh --seed` selesai dengan status sukses).
  - Push pembaruan ke cloud repository GitHub.

## [2026-09-03] update | Redesign UI Frontend dengan Preset Shadcn/ui b5fybI, dashboard-01 & login-04

- **Pembaruan & Perubahan Desain:**
  - Menginisialisasi ulang sistem komponen **shadcn/ui** dengan preset resmi `b5fybI` dan template Vite.
  - Memasang dan mengintegrasikan blok arsitektur:
    - `login-04`: Halaman login enterprise dengan panel informasi operasional tambang (tanpa tombol OAuth pihak ketiga).
    - `dashboard-01`: Layout sidebar navigasi cerdas (`SidebarProvider`, `AppSidebar`, `SidebarTrigger`, `SiteHeader`, `Breadcrumb`, `NavMain`, `NavUser`).
  - Menghapus fitur dropdown switcher akun demo pada navbar sesuai arahan (sesi otentikasi login murni).
  - Menerapkan prinsip desain `frontend-design` (menghindari *AI slop*, tipografi Inter Variable yang tajam, palet warna industri tambang dengan aksen amber/safety gold dan cobalt, struktur data tabular berkepadatan tinggi).
  - Memutakhirkan seluruh halaman (`Dashboard`, `Bookings`, `Approvals`, `Vehicles`, `Drivers`, `FuelLogs`, `ServiceLogs`, `Reports`, `ActivityLogs`) menggunakan komponen murni shadcn (`Card`, `Table`, `Dialog`, `Badge`, `Button`, `Input`, `Textarea`, `Tabs`, `Separator`).
  - Verifikasi build frontend berhasil (`vite build` sukses tanpa error) dan perubahan telah di-push ke cloud repository GitHub.

## [2026-09-03] update | Mengubah Layout Konten Aplikasi Menjadi Full-Width

- Menghapus pembatas `max-w-7xl` dan `mx-auto` pada kontainer `<main>` di `frontend/src/components/layout/AppLayout.jsx`.
- Konten dashboard, tabel pemesanan, armada, dan laporan kini mengisi seluruh lebar layar secara proporsional (*fluid full width layout*).
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] update | Menambahkan Tombol Logout Eksplisit & Indikator User pada Header

- Menambahkan tombol aksi **"Keluar"** (`LogOut`) yang jelas di pojok kanan atas `frontend/src/components/site-header.jsx`.
- Menampilkan pill ringkasan identitas pengguna aktif (nama & peran/jabatan) di sebelah tombol logout.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Perbaikan Warna Solid Tombol Setujui & Penyesuaian Jarak (Padding) Garis Pemisah

- Menambahkan varian warna solid `emerald` (`bg-emerald-600 text-white hover:bg-emerald-500`) dan `destructive` solid pada `frontend/src/components/ui/button.jsx` agar tombol **Setujui (Approve)** dan **Tolak (Reject)** memiliki latar belakang solid berbobot jelas (tidak transparan).
- Memperbaiki padding pada footer kartu persetujuan (`pt-3` menggantikan `pt-0`) pada `frontend/src/pages/Approvals.jsx`, `Vehicles.jsx`, dan `Drivers.jsx` sehingga terdapat jarak *space* yang proporsional dan elegan antara tombol dan garis pemisah `border-t`.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] update | Menempatkan Tombol Logout Langsung di Footer Sidebar

- Memindahkan tombol aksi **Logout / Keluar** ke bagian footer sidebar tepat di samping kartu nama pengguna ([`frontend/src/components/nav-user.jsx`](frontend/src/components/nav-user.jsx)).
- Membersihkan header atas ([`frontend/src/components/site-header.jsx`](frontend/src/components/site-header.jsx)) agar tetap minimalis dan fokus pada breadcrumbs navigasi & info wilayah.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Perbaikan Centering Icon dan Margin Kanan pada Mode Collapsed Sidebar

- Menyesuaikan lebar sidebar mode ikon (`SIDEBAR_WIDTH_ICON` menjadi `3.5rem` / 56px) pada `frontend/src/components/ui/sidebar.jsx` agar memberikan jarak (*gutter/padding*) yang proporsional di kedua sisi (kiri & kanan).
- Memperbaiki penataan logo tambang, item menu navigasi ([`frontend/src/components/nav-main.jsx`](frontend/src/components/nav-main.jsx)), dan avatar profil pengguna ([`frontend/src/components/nav-user.jsx`](frontend/src/components/nav-user.jsx)) dengan class `mx-auto` / `justify-center` sehingga seluruh ikon terpusat rapi dan tidak lagi menabrak garis tepi kanan saat sidebar ditutup/di-minimize.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Perbaikan Perataan Horizontal Ikon pada Tombol Header Dashboard

- Menghapus pembungkus ganda `<Button asChild>` yang menyebabkan tag `<a>` di dalam `<button>` terpecah baris secara vertikal pada tombol **"Keluar Pemesanan"** di [`frontend/src/pages/Dashboard.jsx`](frontend/src/pages/Dashboard.jsx).
- Menerapkan helper `buttonVariants` langsung pada komponen `<Link>` dengan flexbox `inline-flex items-center gap-1.5`, sehingga ikon kalender dan teks tersusun presisi dalam satu baris horizontal seimbang.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Perbaikan Logika Popup Profil & Tombol Logout pada Footer Sidebar

- Mengubah seluruh baris kartu pengguna di footer sidebar ([`frontend/src/components/nav-user.jsx`](frontend/src/components/nav-user.jsx)) menjadi pemicu tunggal (`DropdownMenuTrigger`) dengan ikon indikator `ChevronsUpDown`.
- Menghapus tombol ikon logout terpisah di sebelah kanan nama agar tidak berdesakan dan mencegah terjadinya reload/refresh halaman yang tidak diinginkan.
- Ketika kartu nama pengguna diklik, aplikasi akan memunculkan menu popup elegan (*dropdown popover*) berisi ringkasan avatar, nama, email, jabatan pengguna, serta tombol aksi **"Keluar (Log Out)"**.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] feat | Implementasi Fitur Dark Mode (Tema Gelap / Terang / Sistem OS)

- Membuat context `ThemeProvider` dan hook `useTheme` ([`frontend/src/components/theme-provider.jsx`](frontend/src/components/theme-provider.jsx)) dengan persistensi `localStorage` (`nickel-fleet-theme`).
- Membuat komponen tombol pengalih tema `ModeToggle` ([`frontend/src/components/mode-toggle.jsx`](frontend/src/components/mode-toggle.jsx)) dengan transisi ikon Sun/Moon yang halus dan opsi **Terang (Light)**, **Gelap (Dark)**, serta **Sistem OS**.
- Memasang tombol `ModeToggle` pada navbar header aplikasi ([`frontend/src/components/site-header.jsx`](frontend/src/components/site-header.jsx)) dan pojok atas halaman login ([`frontend/src/pages/Login.jsx`](frontend/src/pages/Login.jsx)).
- Mengintegrasikan variabel palet warna `.dark` dan `:root` pada Tailwind CSS v4 / shadcn preset `b5fybI`.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Perbaikan Bug Refresh Halaman & Rekonstruksi Popover NavUser

- Merekonstruksi baris profil pengguna pada sidebar footer ([`frontend/src/components/nav-user.jsx`](frontend/src/components/nav-user.jsx)) menggunakan mekanisme popover dengan state React eksplisit (`useState`, `useRef`, click-outside handler, dan tombol `type="button"`).
- Menghilangkan bug refresh halaman saat kartu nama pengguna diklik dengan menambahkan pencegahan propagasi event (`e.preventDefault()`, `e.stopPropagation()`).
- Menu popover kini muncul secara responsif tepat di atas kartu pengguna (atau di samping saat sidebar collapsed) memuat detail akun dan tombol **"Keluar (Log Out)"**.
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Menghilangkan Outline Garis Hitam Tebal pada Diagram Donut Armada

- Menghapus konfigurasi `borderColor: '#18181b'` dan `borderWidth: 2` pada grafik donat *Komposisi Armada Tambang* di [`frontend/src/pages/Dashboard.jsx`](frontend/src/pages/Dashboard.jsx).
- Menyesuaikan proporsi ketebalan donat (`cutout: '65%'`) dan indikator legenda (*circular pointStyle*) agar tampak bersih, elegan, dan harmonis baik pada mode Terang (Light) maupun Gelap (Dark).
- Kompilasi build berhasil dan pembaruan telah di-push ke branch `main`.

## [2026-09-03] dev | Konfigurasi Local Development (Docker Backend + Bun Vite Frontend)

- Backend (PHP 8.4-FPM `sekawan_app`, MySQL 8.0 `sekawan_db`, Nginx `sekawan_web`) berjalan di dalam Docker pada port `8080` (API proxy `/api`).
- Frontend development server dijalankan menggunakan `bun run dev` pada port `http://localhost:5173`.
- Konfigurasi proxy Vite di [`frontend/vite.config.js`](frontend/vite.config.js) dikonfigurasi untuk meneruskan seluruh *request* `/api` langsung ke Docker backend di `http://127.0.0.1:8080`.

## [2026-09-03] feat | Pembuatan Landing Page Presentasi Hasil & Login Demo Credentials Enhancement

- **Landing Page Publik (`/`)**:
  - Membuat halaman landing page komprehensif di [`frontend/src/pages/LandingPage.jsx`](frontend/src/pages/LandingPage.jsx) yang dapat diakses oleh publik tanpa harus login.
  - Memuat **Hero Section** (tautan GitHub, Buka Dashboard, live telemetry preview), **Requirements Compliance Matrix** (matriks kepatuhan soal A s/d G & instruksi tambahan a s/d d), **Interactive Activity Diagram** (stepper alur 5 tahap persetujuan berjenjang & transisi status), **Physical Data Model (PDM)** (skema 10 tabel basis data relasional MySQL beserta tipe data dan foreign key), **Tech Stack Matrix** (Laravel 13.x, PHP 8.2+, MySQL 8, React 19 SPA, Tailwind CSS v4, Chart.js, Docker), serta **Kredit Pengembang (Gunawan)** dan logo resmi **PT Sekawan Media Informatika** ([`sekawan-media-logo.png`](sekawan-media-logo.png)).
- **Login Page Demo Credentials Enhancement (`/login`)**:
  - Memperbarui [`frontend/src/components/login-form.jsx`](frontend/src/components/login-form.jsx) dengan tombol info `!` interaktif yang memunculkan popover daftar akun pengujian (Admin Pool, Approver Level 1, Approver Level 2, Approver Site).
  - Menyediakan fitur *One-Click Auto-Fill* dan disclaimer resmi demo pengujian teknis rekrutmen.
  - Menyesuaikan redirect pada [`frontend/src/pages/Login.jsx`](frontend/src/pages/Login.jsx) agar mengarahkan ke `/dashboard` saat pengguna telah terotentikasi.
- **Restrukturisasi Routing Frontend**:
  - Memperbarui [`frontend/src/App.jsx`](frontend/src/App.jsx) untuk mendaftarkan `/` sebagai `LandingPage` publik dan `/dashboard` sebagai halaman `Dashboard` terproteksi.
  - Memperbarui navigasi di [`frontend/src/components/app-sidebar.jsx`](frontend/src/components/app-sidebar.jsx) dan [`frontend/src/components/site-header.jsx`](frontend/src/components/site-header.jsx).
- **Dokumentasi & Wiki**:
  - Membuat dokumen [`docs/landing-page-dan-presentasi.md`](docs/landing-page-dan-presentasi.md) dan memperbarui indeks [`docs/README.md`](docs/README.md).


## [2026-09-03] refactor | Audit Standarisasi Seluruh Tombol Menggunakan Komponen Shadcn Button

- Melakukan audit komprehensif pada seluruh file komponen dan halaman aplikasi (`frontend/src`).
- Mengganti seluruh tag `<button>` mentah yang tersisa menjadi komponen resmi shadcn `<Button>` dari `@/components/ui/button` (dan helper `buttonVariants` untuk tautan/elemen kustom).
- Menambahkan varian ukuran mikro `"icon-xs": "size-6 p-0"` pada [`frontend/src/components/ui/button.jsx`](frontend/src/components/ui/button.jsx) untuk mendukung tombol *close* notifikasi dan modal.
- File yang distandarisasi meliputi: [`login-form.jsx`](frontend/src/components/login-form.jsx), [`nav-user.jsx`](frontend/src/components/nav-user.jsx), [`ToastContext.jsx`](frontend/src/context/ToastContext.jsx), [`mode-toggle.jsx`](frontend/src/components/mode-toggle.jsx), dan [`LandingPage.jsx`](frontend/src/pages/LandingPage.jsx).
- Kompilasi build frontend sukses dan perubahan telah di-push ke branch `main`.

## [2026-09-03] feat | Implementasi Dashboard Monitoring Kantor Cabang & Wilayah Tambang

- Menambahkan endpoint backend `GET /api/dashboard/regions` (ringkasan komparatif 8 wilayah) dan `GET /api/dashboard/regions/{id}` (analisis mendalam per wilayah) pada [`backend/app/Http/Controllers/Api/DashboardController.php`](backend/app/Http/Controllers/Api/DashboardController.php) dan [`backend/routes/api.php`](backend/routes/api.php).
- Membuat halaman visual baru [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx) dengan dua mode interaksi:
  1. **Mode Ringkasan (Overview):** Komparasi ke-8 wilayah (armada pool, supir, ritase, dan biaya BBM) dengan grafik batang perbandingan.
  2. **Mode Detail (Drill-Down):** Analisis spesifik kantor cabang/tambang dengan kartu KPI, grafik donat komposisi armada, bar chart koridor rute destinasi, dan 4 tab data detail (Armada, Supir, Perjalanan, BBM & Servis).
- Mendaftarkan rute `/branch-dashboard` di [`frontend/src/App.jsx`](frontend/src/App.jsx), menambahkan navigasi **"Dashboard Cabang"** pada [`frontend/src/components/app-sidebar.jsx`](frontend/src/components/app-sidebar.jsx), serta judul breadcrumb pada [`frontend/src/components/site-header.jsx`](frontend/src/components/site-header.jsx).
- Membuat dokumentasi lengkap [`docs/dashboard-kantor-cabang.md`](docs/dashboard-kantor-cabang.md) dan memperbarui indeks [`docs/README.md`](docs/README.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] refactor | Penyederhanaan Dashboard Cabang (Menghilangkan Mode Komparasi)

- Menghapus mode perbandingan global (*Overview Comparison mode*) pada [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx).
- Antarmuka kini difokuskan langsung pada pemilihan dan analisis mendalam kantor cabang (misal: *Kantor Cabang Kendari*) atau site tambang tertentu melalui bar pemilihan wilayah cepat.
- Memperbarui dokumentasi di [`docs/dashboard-kantor-cabang.md`](docs/dashboard-kantor-cabang.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] refactor | Pembersihan Selector Wilayah pada Dashboard Cabang

- Menghapus filter bar pemilih wilayah individual pada [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx) sehingga antarmuka berfokus sepenuhnya pada visualisasi terpadu 8 wilayah operasional.
- Menyajikan langsung 8 kartu ringkasan status pool, grafik komparasi armada & ritase, grafik distribusi beban BBM bulanan, dan tabel rekapitulasi data seluruh wilayah tanpa distraksi tombol switcher.
- Memperbarui dokumentasi di [`docs/dashboard-kantor-cabang.md`](docs/dashboard-kantor-cabang.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] refactor | Pemisahan Tata Letak Section Kantor Pusat, Cabang, dan Site Tambang

- Mengelompokkan tampilan kartu wilayah pada [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx) ke dalam 3 section mandiri dengan visual header dan aksen warna tematik:
  1. **Section Kantor Pusat (Head Office):** 1 kantor di Jakarta Selatan dengan aksen amber/gold.
  2. **Section Kantor Cabang (Branch Office):** 1 kantor di Kendari dengan aksen biru.
  3. **Section Wilayah Site Tambang Nikel:** 6 site ekstraksi aktif dengan aksen emerald.
- Memperbarui dokumentasi di [`docs/dashboard-kantor-cabang.md`](docs/dashboard-kantor-cabang.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Penegasan Otorisasi Persetujuan (Admin Hanya Dapat Membatalkan Pemesanan)

- Mengunci endpoint backend [`backend/app/Http/Controllers/Api/ApprovalController.php`](backend/app/Http/Controllers/Api/ApprovalController.php) sehingga pengguna dengan peran `admin` ditolak dengan `403 Forbidden` jika mencoba mengeksekusi aksi persetujuan atau penolakan.
- Memperbarui antarmuka [`frontend/src/pages/Approvals.jsx`](frontend/src/pages/Approvals.jsx):
  - Saat login sebagai **Admin**, tombol *Setujui (Approve)* dan *Tolak (Reject)* dihilangkan dan digantikan dengan informasi nama approver yang ditugaskan serta tombol **"Batalkan Pemesanan"** (dengan modal konfirmasi).
  - Tombol *Setujui (Approve)* dan *Tolak (Reject)* hanya aktif bagi akun **Approver Level 1** (`approver1@tambang.com`) atau **Approver Level 2** (`approver2@tambang.com`) sesuai tahapan persetujuan.
- Memperbarui dokumentasi di [`docs/alur-persetujuan-berjenjang.md`](docs/alur-persetujuan-berjenjang.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Perbaikan Pembatasan Hak Akses Berbasis Peran (RBAC) Approver vs Admin

- **Frontend (`frontend/src/App.jsx`)**:
  - Menambahkan parameter `adminOnly` pada komponen `ProtectedRoute` yang memeriksa status `isAdmin` dari `AuthContext`.
  - Mengunci seluruh rute khusus admin (`/vehicles`, `/drivers`, `/fuel-logs`, `/service-logs`, `/activity-logs`) sehingga jika akun non-admin (Approver) mencoba mengakses via URL langsung, akan otomatis dialihkan (*redirect*) ke `/dashboard`.
- **Frontend Dashboard (`frontend/src/pages/Dashboard.jsx`)**:
  - Mengondisikan link *"Lihat Semua"* pada kartu *Jadwal Servis Terdekat* (`/service-logs`) agar hanya tampil untuk pengguna dengan peran Admin.
- **Backend Middleware & Routing (`backend/bootstrap/app.php` & `backend/routes/api.php`)**:
  - Mendaftarkan middleware alias `'admin' => \App\Http\Middleware\EnsureAdmin::class` dan `'approver' => \App\Http\Middleware\EnsureApprover::class` pada `bootstrap/app.php`.
  - Melindungi rute-rute khusus admin (`/vehicles`, `/drivers`, `/fuel-logs`, `/service-logs`, `/activity-logs`, dan aksi mutasi booking) dengan middleware `admin` (`403 Forbidden` jika diakses oleh akun approver).
- **Pengujian & Verifikasi**:
  - Menambahkan uji verifikasi RBAC 7 langkah pada [`backend/tests/e2e_verification.php`](backend/tests/e2e_verification.php) dengan hasil semua pengujian lulus 100%.
  - Kompilasi build frontend sukses tanpa galat.
- **Dokumentasi Terkait**:
  - Membuat rencana perbaikan [`plans/perbaikan-hak-akses-role-approver.md`](plans/perbaikan-hak-akses-role-approver.md).
  - Memperbarui matriks otorisasi RBAC pada [`docs/arsitektur-aplikasi.md`](docs/arsitektur-aplikasi.md) dan indeks [`docs/README.md`](docs/README.md).


## [2026-09-03] feat | Implementasi Halaman CRUD Manajemen Pengguna & Otorisasi

- Membuat controller backend [`backend/app/Http/Controllers/Api/UserController.php`](backend/app/Http/Controllers/Api/UserController.php) untuk melayani operasi CRUD pengguna lengkap (`index`, `store`, `show`, `update`, `destroy`) dengan proteksi penghapusan akun sendiri/transaksi aktif serta pencatatan audit log otomatis.
- Mendaftarkan rute API `apiResource('/users', UserController::class)` di [`backend/routes/api.php`](backend/routes/api.php) di bawah middleware `admin`.
- Membuat halaman antarmuka baru [`frontend/src/pages/UsersManagement.jsx`](frontend/src/pages/UsersManagement.jsx) dengan fitur pencarian real-time, filter peran/wilayah, modal form pendaftaran/pembaruan user, dan modal konfirmasi hapus.
- Mendaftarkan rute `/users` di [`frontend/src/App.jsx`](frontend/src/App.jsx), menambahkan menu navigasi **"Manajemen User"** di [`frontend/src/components/app-sidebar.jsx`](frontend/src/components/app-sidebar.jsx), serta judul breadcrumb di [`frontend/src/components/site-header.jsx`](frontend/src/components/site-header.jsx).
- Membuat dokumentasi lengkap [`docs/manajemen-user.md`](docs/manajemen-user.md) dan memperbarui indeks [`docs/README.md`](docs/README.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Pembatasan Data Pemesanan Berdasarkan Wilayah Cabang untuk Akun Approver

- Memperbarui query pada [`backend/app/Http/Controllers/Api/BookingController.php`](backend/app/Http/Controllers/Api/BookingController.php) (`index` dan `show`) serta [`backend/app/Http/Controllers/Api/ReportController.php`](backend/app/Http/Controllers/Api/ReportController.php):
  - Pengguna dengan peran selain admin (`role === 'approver'`) secara otomatis hanya melihat data transaksi pemesanan yang berkaitan langsung dengan wilayah cabang penugasannya (`region_id` asal atau `destination_region_id` tujuan sesuai `user.region_id`).
  - Menolak akses detail pemesanan di luar wilayah cabang tugas approver dengan `403 Forbidden`.
- Memperbarui antarmuka [`frontend/src/pages/Bookings.jsx`](frontend/src/pages/Bookings.jsx) untuk menampilkan badge wilayah penugasan approver pada header halaman.
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] fix | Kejelasan Label dan Periode Waktu Biaya BBM pada Dashboard Cabang

- Memperbarui kartu wilayah dan grafik pada [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx):
  - Mengubah tampilan angka Rupiah yang ambigu menjadi kotak metrik berlabel jelas: `Biaya BBM (September 2026): Rp X.XXX.XXX` disertai ikon BBM `Fuel`.
  - Menampilkan periode waktu dinamis bulan berjalan (`currentMonthLabel`) baik pada kartu wilayah, grafik batang distribusi pengeluaran, maupun header tabel rekapitulasi 8 wilayah.
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] feat | Implementasi Halaman Detail Monitoring Kantor Cabang & Site Tambang

- Membuat halaman baru [`frontend/src/pages/BranchDetail.jsx`](frontend/src/pages/BranchDetail.jsx) yang menampilkan:
  - Header dengan tombol kembali, nama wilayah, badge kategori, kode & alamat, serta dropdown *Quick Region Switcher*.
  - 4 Kartu KPI Summary: Kesiapan Armada Pool, Personil Supir, Arus Perjalanan Aktif (Outgoing & Incoming), dan Beban Biaya BBM Bulan Berjalan.
  - 4 Tab Analitik Mendalam (*Fleet & Drivers*, *Active & Recent Trips*, *Fuel & Maintenance Logs*, dan *Top Destinations Analytics* dengan grafik batang Chart.js).
- Menambahkan tombol navigasi **"Lihat Detail Wilayah →"** pada setiap kartu wilayah dan tabel rekapitulasi di [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx).
- Mendaftarkan rute `/branch-dashboard/:id` di [`frontend/src/App.jsx`](frontend/src/App.jsx) dan menambahkan pencocokan judul breadcrumb di [`frontend/src/components/site-header.jsx`](frontend/src/components/site-header.jsx).
- Membuat dokumen rencana [`plans/halaman-detail-kantor-cabang.md`](plans/halaman-detail-kantor-cabang.md) serta memperbarui [`docs/dashboard-kantor-cabang.md`](docs/dashboard-kantor-cabang.md) dan [`docs/README.md`](docs/README.md).
- Kompilasi build frontend sukses dan seluruh pembaruan telah di-push ke branch `main`.

## [2026-09-03] feat | Refactoring Seluruh Form UI (shadcn/ui + React Hook Form + Zod) & Server State (TanStack Query v5)

- Menginstal dan mengintegrasikan `@tanstack/react-query`, `react-hook-form`, dan `@hookform/resolvers`.
- Membangun komponen UI standar [`frontend/src/components/ui/form.jsx`](frontend/src/components/ui/form.jsx) (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `useFormField`) dan memperbarui [`frontend/src/components/ui/select.jsx`](frontend/src/components/ui/select.jsx) berbasis Radix UI.
- Mengonfigurasi `QueryClientProvider` global pada [`frontend/src/App.jsx`](frontend/src/App.jsx).
- Me-refactor seluruh modul dan formulir aplikasi dengan `useQuery`, `useMutation`, `useForm`, dan skema validasi Zod:
  - **Login:** [`frontend/src/components/login-form.jsx`](frontend/src/components/login-form.jsx) (validasi format email & min. 6 karakter password).
  - **Pemesanan Kendaraan:** [`frontend/src/pages/Bookings.jsx`](frontend/src/pages/Bookings.jsx) (validasi pemohon, asal/tujuan, armada, supir, tanggal, keperluan, approver L1 & L2, dan odometer akhir trip).
  - **Master Kendaraan:** [`frontend/src/pages/Vehicles.jsx`](frontend/src/pages/Vehicles.jsx) (validasi nomor plat, tipe, kepemilikan, vendor sewa, status).
  - **Master Supir:** [`frontend/src/pages/Drivers.jsx`](frontend/src/pages/Drivers.jsx) (validasi nama, nomor SIM, format telepon seluler, wilayah).
  - **Log Konsumsi BBM:** [`frontend/src/pages/FuelLogs.jsx`](frontend/src/pages/FuelLogs.jsx) (validasi volume liter, harga per liter, total biaya, odometer).
  - **Jadwal & Riwayat Servis:** [`frontend/src/pages/ServiceLogs.jsx`](frontend/src/pages/ServiceLogs.jsx) (validasi jenis servis, estimasi biaya, bengkel, odometer).
  - **Manajemen User:** [`frontend/src/pages/UsersManagement.jsx`](frontend/src/pages/UsersManagement.jsx) (validasi user baru/edit, role, tier approver, jabatan, wilayah).
  - **Portal Persetujuan:** [`frontend/src/pages/Approvals.jsx`](frontend/src/pages/Approvals.jsx) (validasi alasan penolakan dan pembatalan pemesanan).
  - **Laporan & Ekspor:** [`frontend/src/pages/Reports.jsx`](frontend/src/pages/Reports.jsx) (parameter filter via TanStack Query dan dropdown shadcn Select).
  - **Dashboard Monitoring:** [`frontend/src/pages/Dashboard.jsx`](frontend/src/pages/Dashboard.jsx), [`frontend/src/pages/BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx), [`frontend/src/pages/BranchDetail.jsx`](frontend/src/pages/BranchDetail.jsx) (migrasi data fetching ke TanStack Query dan penggantian native select ke shadcn Select).
- Seluruh pengujian build production Vite lulus tanpa error dan perubahan telah di-push ke branch `main`.

## [2026-09-03] feat | Integrasi Features Section dengan Hover Effects pada Landing Page

- Menginstal `@tabler/icons-react` untuk iconography dinamis.
- Membuat komponen [`frontend/src/components/ui/feature-section-with-hover-effects.jsx`](frontend/src/components/ui/feature-section-with-hover-effects.jsx) dengan grid 8 kartu fitur, efek hover interaktif (*gradient backdrop*, *indicator bar*, *border highlights*, dan transisi warna aksen amber/slate).
- Menyesuaikan 8 fitur agar selaras dengan tema sistem armada tambang nikel:
  1. **Pemesanan Multi-Wilayah** (8 wilayah operasional: 1 HQ Jakarta, 1 Cabang Kendari, 6 Blok Tambang)
  2. **Persetujuan Berjenjang 2 Level** (Supervisor L1 $\rightarrow$ Kepala Pool/GM L2)
  3. **Visualisasi Grafik Real-Time** (Chart.js analitik frekuensi, komposisi, dan BBM)
  4. **Laporan & Ekspor Excel (.xlsx)** (PhpSpreadsheet berstempel tanggal)
  5. **100% Audit Trail & Log Aktivitas** (ActivityLogger snapshot JSON & IP)
  6. **Monitoring Konsumsi BBM** (Liter, rasio KM/L, biaya, odometer)
  7. **Jadwal Servis & Perawatan** (Perawatan armada berkala & bengkel)
  8. **Otorisasi Ketat & Sanctum Guard** (Role-based access control Admin vs Approver)
- Memasang section `#features` pada [`frontend/src/pages/LandingPage.jsx`](frontend/src/pages/LandingPage.jsx) dan menambahkan tautan menu **"Fitur Unggulan"** di navbar.
- Memperbarui dokumentasi di [`docs/landing-page-dan-presentasi.md`](docs/landing-page-dan-presentasi.md).
- Kompilasi build frontend sukses tanpa galat.

## [2026-09-03] fix | Perbaikan Format, Tata Letak, dan Styling Ekspor Microsoft Excel (.xlsx)

- **Masalah:** Ekspor Excel pada backend mengalami *Fatal Error* karena pemanggilan metode usang `setCellValueByColumnAndRow()` pada `PhpSpreadsheet` versi terbaru, menyebabkan sistem *fallback* ke generator frontend SheetJS yang menghasilkan lembar kerja mentah, teks terpotong, tanpa styling, dan tanpa identitas laporan.
- **Perubahan Backend (`ReportController.php` via PhpSpreadsheet):**
  - Mengganti sintaks cell coordinate dengan notasi modern yang didukung penuh.
  - Menambahkan *Title Banner* resmi berlatar Slate-800 (`#1E293B`) dengan font putih tebal 13pt (`A1:V1`).
  - Menambahkan *Metadata Banner* (`A2:V2`) dengan informasi rentang periode filter, stempel waktu cetak (*timestamp*), dan jumlah transaksi.
  - Menata *Table Header* berlatar Deep Navy (`#1E3A8A`) dengan teks putih tebal, perataan tengah, dan mengaktifkan fitur *AutoFilter* Excel (`A4:V4`).
  - Mengaktifkan *Freeze Panes* pada baris 5 (`A5`) agar header tabel tetap melayang saat digulir (*scroll*).
  - Menerapkan *Zebra Striping* (baris genap `#F8FAFC`, ganjil `#FFFFFF`) dan garis batas tabel (*thin borders* `#CBD5E1`).
  - Merapikan perataan sel (*alignment*) sesuai tipe data (tengah untuk kode/tanggal/status, kiri untuk nama/departemen/catatan, kanan untuk angka).
  - Memformat angka numerik BBM (`#,##0.00`) dan nominal Rupiah (`#,##0`).
  - Menerjemahkan seluruh kode status mentah (*enum*) ke dalam label deskriptif bahasa Indonesia.
  - Menambahkan baris ringkasan `TOTAL KESELURUHAN` di akhir tabel dengan formula dinamis Excel `=SUM(...)` dan garis ganda bawah (*double bottom border*).
  - Mengatur lebar kolom optimal (6–28 karakter) dengan *safety padding* sehingga tidak ada teks terpotong (*no clipped text*).
- **Perubahan Frontend (`Reports.jsx` via SheetJS Fallback):**
  - Memperbarui `handleExportExcel` untuk memicu unduhan file biner backend secara andal.
  - Memperbaiki konfigurasi *fallback* client dengan lebar kolom `ws['!cols']` dan pemformatan teks terstruktur.
- **Pengujian & Verifikasi:**
  - Membuat automated feature test `ReportExportTest.php` (2 test, 7 assertion, 100% pass).
  - Verifikasi struktur spreadsheet via CLI PhpSpreadsheet reader (Sheet Title, Dimensions, Borders, FreezePane A5, Formula SUM).
  - Verifikasi build produksi Vite (`npm run build` sukses).



## [2026-09-03] refactor | Standarisasi dan Pembersihan Tombol UI ke Default Component Props

- Menghapus seluruh override manual styling warna background (`bg-amber-500`, `text-slate-950`, `hover:bg-amber-400`, dll.) pada elemen `<Button>` dan `buttonVariants()` di seluruh modul frontend.
- Mengembalikan konsistensi penuh pada varian dan ukuran bawaan komponen shadcn/ui [`frontend/src/components/ui/button.jsx`](frontend/src/components/ui/button.jsx) (`variant="default"`, `variant="destructive"`, `variant="destructiveOutline"`, `variant="emerald"`, `variant="blue"`, `size="sm"`, `size="xs"`).
- File yang dibersihkan: [`Drivers.jsx`](frontend/src/pages/Drivers.jsx), [`Vehicles.jsx`](frontend/src/pages/Vehicles.jsx), [`UsersManagement.jsx`](frontend/src/pages/UsersManagement.jsx), [`FuelLogs.jsx`](frontend/src/pages/FuelLogs.jsx), [`ServiceLogs.jsx`](frontend/src/pages/ServiceLogs.jsx), [`Bookings.jsx`](frontend/src/pages/Bookings.jsx), [`Approvals.jsx`](frontend/src/pages/Approvals.jsx), [`Reports.jsx`](frontend/src/pages/Reports.jsx), [`Dashboard.jsx`](frontend/src/pages/Dashboard.jsx), [`BranchDashboard.jsx`](frontend/src/pages/BranchDashboard.jsx).
