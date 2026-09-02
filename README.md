# Nickel Fleet Monitoring & Booking System
### Aplikasi Pemesanan dan Monitoring Armada Kendaraan Operasional Tambang Nikel

Aplikasi web modern untuk pemesanan, pemantauan konsumsi bahan bakar (BBM), jadwal servis, dan pelacakan riwayat pemakaian kendaraan operasional pada perusahaan tambang nikel terdistribusi (1 Kantor Pusat, 1 Kantor Cabang, dan 6 Blok Tambang Nikel).

---

## 1. Spesifikasi Teknologi & Versi Sistem

| Komponen | Teknologi | Versi |
| :--- | :--- | :--- |
| **Backend Framework** | **Laravel** | **v13.x (v13.30.1)** |
| **Backend Language** | **PHP** | **v8.2+ / v8.3** |
| **Frontend Framework** | **React.js (SPA)** | **v19.x / v18.x (Vite v8.x)** |
| **Styling & Icons** | **Tailwind CSS & Lucide Icons** | **v4.x & v1.x** |
| **Data Visualization** | **Chart.js & React-Chartjs-2** | **v4.x & v5.x** |
| **Database** | **MySQL** | **v8.0** *(Support MariaDB & SQLite)* |
| **Excel Generator** | **PhpSpreadsheet & SheetJS** | **v5.9 / v0.18** |
| **Containerization** | **Docker & Docker Compose** | **Docker Compose v5.x** |

---

## 2. Daftar Akun Pengguna & Kredensial Login (Default)

Semua akun telah dibuat otomatis melalui database seeder dengan kata sandi yang seragam:

| Peran (Role) | Nama Pengguna | Alamat Email | Kata Sandi (Password) | Hak Akses & Tugas |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | **Admin Pool Kendaraan** | `admin@tambang.com` | `password123` | Input pemesanan kendaraan, penugasan driver, pemilihan approver L1 & L2, manajemen armada, driver, input BBM, jadwal servis, analitik, export laporan Excel, dan audit log. |
| **Approver (Level 1)** | **Bambang Sutrisno, S.T.** *(Supervisor Operasional)* | `approver1@tambang.com` | `password123` | Melakukan review dan persetujuan/penolakan pemesanan tahap pertama (Level 1) disertai catatan. |
| **Approver (Level 2)** | **Ir. Hartono Gunawan, M.M.** *(Kepala Pool & GM Tambang)* | `approver2@tambang.com` | `password123` | Melakukan otorisasi persetujuan final tahap kedua (Level 2) setelah Level 1 disetujui. |
| **Approver (Level 1 Site)** | **Rahmat Hidayat, M.T.** *(Site Manager Pomalaa)* | `approver1.site@tambang.com` | `password123` | Penyetujui Level 1 untuk wilayah operasional Tambang A (Pomalaa). |

> **Fitur Quick Switcher:** Pada antarmuka aplikasi, tersedia fitur **"1-Klik Ganti Akun Demo"** di pojok kanan atas Navbar untuk mempermudah pengujian multi-role tanpa perlu logout-login manual.

---

## 3. Cakupan Wilayah & Karakteristik Armada Tambang

### Struktur Wilayah Operasional (8 Lokasi):
1. **1 Kantor Pusat:** Jakarta (`HQ-JKT`)
2. **1 Kantor Cabang:** Kendari (`BC-KDR`)
3. **6 Blok Tambang Nikel (Mine Sites):**
   - **Tambang A (Pomalaa)** - Kolaka, Sultra
   - **Tambang B (Morowali)** - Kawasan Industri IMIP, Sulteng
   - **Tambang C (Konawe)** - Kawasan Industri Morosi, Sultra
   - **Tambang D (Kolaka)** - Blok Kolaka Utara, Sultra
   - **Tambang E (Halmahera)** - Teluk Weda, Malut
   - **Tambang F (Sorowako)** - Blok Matano, Sulsel

### Klasifikasi Armada Kendaraan (16 Unit Data Awal):
- **Berdasarkan Jenis Angkutan:**
  - **Angkutan Orang:** SUV 4x4 (Fortuner, Pajero Sport, Prado), Double Cabin 4x4 (Hilux, Triton, D-Max, Ranger), Minibus (HiAce Premio).
  - **Angkutan Barang:** Dump Truck Tambang 6x4 (Fuso Fighter, Hino 500, Scania P360, Axor, Quester) & Heavy Cargo Flatbed (Isuzu Giga).
- **Berdasarkan Status Kepemilikan:**
  - **Milik Perusahaan (*Owned*):** Aset kendaraan milik operasional tambang.
  - **Sewa (*Rented*):** Kendaraan sewa dari vendor (*PT Rental Mandiri Trans* & *PT Trans Tambang Nusantara*).

---

## 4. Panduan Menjalankan Aplikasi

Tersedia 2 cara untuk menjalankan aplikasi:

### Opsi A: Menggunakan Docker Compose (Direkomendasikan - 1 Command)

1. Pastikan Docker dan Docker Compose telah terpasang dan berjalan.
2. Jalankan perintah:
   ```bash
   docker compose up -d --build
   ```
3. Lakukan inisialisasi migrasi dan seeder database (sekali di awal):
   ```bash
   docker compose exec app php artisan migrate:fresh --seed
   ```
4. Buka browser pada:
   - **Aplikasi Web:** [http://localhost:8080](http://localhost:8080)
   - **REST API Server:** [http://localhost:8080/api](http://localhost:8080/api)

---

### Opsi B: Menjalankan Secara Standalone (Lokal PHP & Node)

#### 1. Backend (Laravel 13.x):
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

#### 2. Frontend (React.js SPA):
```bash
cd frontend
npm install
npm run dev
```
Akses aplikasi melalui URL Vite: [http://localhost:5173](http://localhost:5173) (otomatis terhubung via proxy ke backend port 8000).

---

## 5. Alur Kerja Fitur Utama Aplikasi

### A. Alur Pemesanan & Persetujuan Berjenjang (Multi-Level Approval)
```
[Admin Buat Pemesanan]
       │
       ▼ (Status: pending_level_1)
[Persetujuan Level 1: Supervisor / Atasan]
       │
       ├─► [DITOLAK] ──► Status: rejected (Selesai/Batal)
       │
       ▼ [DISETUJUI] (Status: pending_level_2)
[Persetujuan Level 2: Kepala Pool / GM Operasional]
       │
       ├─► [DITOLAK] ──► Status: rejected (Selesai/Batal)
       │
       ▼ [DISETUJUI] (Status: approved)
[Admin Klik "Mulai Perjalanan"] ──► Status: in_use (Mobil & Driver aktif bertugas)
       │
       ▼
[Admin Klik "Selesaikan Perjalanan"] ──► Input Odometer Akhir ──► Status: completed
```

### B. Dashboard Monitoring & Visualisasi Grafik
Dashboard menyajikan 3 grafik visual dinamis berbasis **Chart.js**:
1. **Frekuensi Pemakaian Kendaraan (Bar Chart):** Memantau tren jumlah perjalanan dinas per bulan dalam 6 bulan terakhir.
2. **Komposisi Armada Tambang (Doughnut Chart):** Membandingkan proporsi angkutan orang vs barang serta status milik sendiri vs sewa.
3. **Tren Konsumsi BBM & Biaya (Line Chart):** Memantau volume liter konsumsi bahan bakar dan biaya operasional bulanan.
4. **Summary KPI Cards:** Menampilkan jumlah persetujuan pending, unit kendaraan aktif jalan, unit tersedia, dan total BBM bulan ini.

### C. Laporan Periodik & Export Microsoft Excel (.xlsx)
1. Buka menu **Laporan & Export Excel**.
2. Tentukan parameter filter:
   - Rentang Tanggal Mulai s/d Selesai
   - Lokasi Wilayah / Blok Tambang
   - Status Pemesanan
   - Tipe Kendaraan (Orang / Barang)
   - Status Kepemilikan (Milik / Sewa)
3. Pratinjau data tampil secara interaktif dilengkapi kalkulasi total liter BBM dan total biaya.
4. Klik tombol hijau **"Export ke Excel (.xlsx)"** untuk mengunduh laporan spreadsheet berformat resmi dengan header berstempel tanggal dan formula kalkulasi otomatis.

### D. Log Aktivitas Aplikasi (Audit Trail)
Setiap tindakan pengguna dicatat secara otomatis pada tabel log:
- Pembuatan pemesanan baru
- Persetujuan Level 1 & Level 2 / Penolakan
- Penugasan driver & status perjalanan
- Pencatatan konsumsi BBM dan jadwal servis
- Login dan logout pengguna
- Dilengkapi pencarian, filter modul, alamat IP, waktu kejadian, dan viewer **Payload JSON**.

---

## 6. Struktur Direktori Project

```
sekawan-media-test/
├── backend/                  # Laravel 13.x REST API Core
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API Controllers (Auth, Booking, Approval, Fleet, Report, dll)
│   │   ├── Models/                 # Eloquent Models (10 Tabel)
│   │   └── Services/               # ActivityLogger & Business Services
│   ├── database/
│   │   ├── migrations/             # 10 Skema Migrasi Database
│   │   └── seeders/                # DatabaseSeeder komprehensif
│   └── routes/api.php              # 41 Endpoints REST API
│
├── frontend/                 # React.js 19 SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Layout (Sidebar, Navbar), Common (Modals, Badges, Charts)
│   │   ├── context/          # AuthContext & ToastContext
│   │   ├── pages/            # Dashboard, Bookings, Approvals, Vehicles, Drivers, BBM, Servis, Reports, Logs
│   │   └── services/         # Axios API Client & Interceptors
│   └── vite.config.js
│
├── docker/                   # Konfigurasi Container Nginx & PHP 8.2 Alpine
│   ├── nginx/default.conf
│   └── php/Dockerfile
├── docker-compose.yml        # Orchestrator Multi-Container (App, DB, Web)
└── README.md                 # Dokumentasi Utama Sistem
```
