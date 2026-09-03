> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Manajemen Pengguna & Otorisasi (User CRUD)

**Terkait:**
- [`plans/manajemen-user-crud.md`](../plans/manajemen-user-crud.md)
- [`backend/app/Http/Controllers/Api/UserController.php`](../backend/app/Http/Controllers/Api/UserController.php)
- [`frontend/src/pages/UsersManagement.jsx`](../frontend/src/pages/UsersManagement.jsx)
- [`docs/alur-persetujuan-berjenjang.md`](./alur-persetujuan-berjenjang.md)
- [`docs/skema-basis-data.md`](./skema-basis-data.md)
- [`docs/panduan-penggunaan.md`](./panduan-penggunaan.md)

---

## 1. Ikhtisar & Tujuan

Fitur Manajemen Pengguna (`/users`) memungkinkan akun **Administrator** mengelola seluruh data master pengguna aplikasi secara terpusat (*Create, Read, Update, Delete*). Fitur ini mengontrol hak akses operasional pool, penugasan pihak penyetujui (Approver Level 1 / Level 2), dan alokasi wilayah tugas.

---

## 2. Hak Akses & Matriks Peran

| Peran (Role) | Tingkat (Tier) | Deskripsi Jabatan & Wewenang |
| :--- | :--- | :--- |
| `admin` | `-` | **Admin Pool Kendaraan:** Mengelola master data (armada, supir, bbm, servis, user), membuat pemesanan, memulai/menyelesaikan perjalanan, membatalkan pemesanan. |
| `approver` | `1` | **Penyetujui Level 1 (Supervisor Operasional):** Memvalidasi dan menyetujui/menolak pengajuan pemesanan tahap pertama. |
| `approver` | `2` | **Penyetujui Level 2 (Kepala Pool / GM Tambang):** Memberikan otorisasi final atas pengajuan pemesanan sebelum armada diberangkatkan. |

---

## 3. Spesifikasi REST API Backend

Seluruh endpoint di bawah berada di dalam *route group* terproteksi middleware `auth:sanctum` dan `admin`:

### A. `GET /api/users`
Mengembalikan daftar pengguna dengan pagination dan filter pencarian.
- **Query Params:**
  - `search`: Pencarian nama, email, atau jabatan.
  - `role`: Filter peran (`admin` / `approver`).
  - `approval_tier`: Filter tingkat persetujuan (`1` / `2`).
  - `region_id`: Filter ID wilayah tugas.
  - `per_page`: Jumlah data per halaman (default: 15).

### B. `POST /api/users`
Menambahkan pengguna baru ke tabel `users`.
- **Payload:**
  ```json
  {
    "name": "Ir. Bambang Sutrisno, M.T.",
    "email": "approver1@tambang.com",
    "password": "password123",
    "role": "approver",
    "approval_tier": 1,
    "position": "Supervisor Operasional Lapangan",
    "region_id": 2
  }
  ```

### C. `GET /api/users/{id}`
Mengambil detail satu pengguna beserta relasi `region`.

### D. `PUT /api/users/{id}`
Memperbarui data profil pengguna (termasuk kata sandi opsional).

### E. `DELETE /api/users/{id}`
Menghapus pengguna dengan proteksi:
1. Tidak dapat menghapus akun sendiri yang sedang aktif login.
2. Tidak dapat menghapus pengguna yang memiliki riwayat transaksi persetujuan aktif.
