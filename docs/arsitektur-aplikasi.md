> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Arsitektur Aplikasi Pemesanan & Monitoring Kendaraan

**Terkait:**
- [docs/README.md](./README.md)
- [docs/log.md](./log.md)
- [docs/panduan-penggunaan.md](./panduan-penggunaan.md)
- [plans/perbaikan-hak-akses-role-approver.md](../plans/perbaikan-hak-akses-role-approver.md)
- [plans/aplikasi-pemesanan-monitoring-kendaraan.md](../plans/aplikasi-pemesanan-monitoring-kendaraan.md)
- [frontend/src/App.jsx](../frontend/src/App.jsx)
- [backend/bootstrap/app.php](../backend/bootstrap/app.php)
- [backend/routes/api.php](../backend/routes/api.php)
- [backend/app/Http/Middleware/EnsureAdmin.php](../backend/app/Http/Middleware/EnsureAdmin.php)
- [AGENTS.md](../AGENTS.md)

Dokumen ini menjelaskan arsitektur teknis, spesifikasi API, dan pola komunikasi antara backend Laravel 13.x dan frontend React.js untuk sistem pemesanan kendaraan tambang nikel.

---

## 1. Arsitektur Komponen

Aplikasi menggunakan arsitektur Decoupled Single Page Application (SPA):
1. **Backend (Laravel 13.x REST API):**
   - **Autentikasi & Otorisasi:** Laravel Sanctum (Token & Session) dan Route Middleware `EnsureAdmin` (`admin`) serta `EnsureApprover` (`approver`) terdaftar pada `backend/bootstrap/app.php`.
   - **State Engine:** Sequential Multi-Level Approvals (Level 1 -> Level 2 -> Approved).
   - **Audit Trail:** Interceptor & Event Listener untuk Activity Logs.
   - **Reporting:** PhpSpreadsheet / CSV Streamer.
2. **Frontend (React.js SPA):**
   - **Tooling & Styling:** Vite + Tailwind CSS v4 + Radix UI + shadcn/ui Design System + Lucide Icons.
   - **Server State Management:** TanStack Query (React Query v5) dengan caching cerdas, asynchronous data fetching, background synchronization, dan automatic cache invalidation on mutations.
   - **Form Architecture & Validation:** React Hook Form (`useForm`, `Controller`) terintegrasi dengan skema Zod Validation (`@hookform/resolvers/zod`) dan komponen standar shadcn/ui `Form` (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`), `Input`, `Textarea`, dan `Select`.
   - **Routing & RBAC Guard:** React Router v7 dengan `ProtectedRoute` berparameter `adminOnly` pada `frontend/src/App.jsx` untuk mengarahkan pengguna non-admin ke `/dashboard` jika mengakses rute terproteksi.
   - **Charts:** Chart.js & React-Chartjs-2.

---

## 2. Matriks Otorisasi Berbasis Peran (RBAC)

| Modul / Halaman / Endpoint | Peran Admin | Peran Approver (L1 & L2) | Catatan Keamanan & Isolasi Data |
| :--- | :--- | :--- | :--- |
| **Portal Persetujuan (`/approvals`)** | 👁️ Monitoring & Batal | ✅ Setujui / Tolak | **Khusus Approver:** Antrean hanya memuat item yang ditugaskan ke user terkait, dan tab riwayat hanya memuat tindakan pribadi user |
| **Dashboard Utama (`/dashboard`)** | ✅ Akses Penuh | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Dashboard Cabang (`/branch-dashboard`)** | ✅ Akses Penuh | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Personil Bertugas (`/duties`)** | ✅ Akses Penuh | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Pemesanan Kendaraan (`/bookings`)** | ✅ CRUD & Dispatch | ❌ Dilarang (Redirect `/approvals` / 403) | Pembuatan & manajemen booking hanya oleh Admin Pool |
| **Armada Kendaraan (`/vehicles`)** | ✅ CRUD Lengkap | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Master Driver (`/drivers`)** | ✅ CRUD Lengkap | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Konsumsi BBM (`/fuel-logs`)** | ✅ Catat & Riwayat | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Jadwal Servis (`/service-logs`)** | ✅ Catat & Pantau | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Laporan & Excel (`/reports`)** | ✅ Unduh .xlsx | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Audit Trail (`/activity-logs`)** | ✅ Lihat Log Lengkap | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |
| **Manajemen User (`/users`)** | ✅ CRUD Akun | ❌ Dilarang (Redirect `/approvals` / 403) | Dilindungi `ProtectedRoute adminOnly` & Middleware `admin` |

---

## 3. Struktur Wilayah & Master Data Tambang

- **1 Kantor Pusat (Head Office):** Pusat koordinasi operasional & pool utama (Jakarta).
- **1 Kantor Cabang (Branch Office):** Kantor pendukung regional (Kendari).
- **6 Lokasi Tambang (Mine Sites):** Tambang A (Pomalaa), Tambang B (Morowali), Tambang C (Konawe), Tambang D (Kolaka), Tambang E (Halmahera), Tambang F (Sorowako).

---

## 4. Workflow Persetujuan Berjenjang

1. **Admin Input Booking:** Memilih kendaraan, driver, tujuan tambang, tanggal, serta memilih Approver Level 1 dan Approver Level 2.
2. **Approval Level 1 (Supervisor/Atasan):** Approver 1 meninjau dan menyetujui/menolak via aplikasi.
3. **Approval Level 2 (Kepala Pool / GM):** Hanya dapat dilakukan setelah Level 1 disetujui.
4. **Eksekusi Pemakaian:** Status berubah menjadi `approved`, lalu `in_use` saat mobil mulai jalan, dan `completed` saat kembali dengan pencatatan odometer & konsumsi BBM.
