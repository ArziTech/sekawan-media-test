# Plan: Manajemen User (CRUD) untuk Administrator

## 1. Ringkasan & Tujuan
Menyediakan fitur pengelolaan pengguna (*User Management*) bagi akun Administrator (`role === 'admin'`) untuk menambah, melihat, memperbarui, dan menghapus akun pengguna (Admin maupun Penyetujui Level 1 / Level 2), serta mengatur penempatan wilayah operasional dan jabatan.

---

## 2. Kebutuhan Fungsional & Spesifikasi Teknis

### A. Backend (Laravel 11 REST API)
1. **Controller Baru:** `App\Http\Controllers\Api\UserController.php`
   - `index(Request $request)`: Mengembalikan daftar pengguna dengan pencarian (nama/email), filter peran (`role`), filter wilayah (`region_id`), dan pagination.
   - `store(Request $request)`: Validasi dan simpan pengguna baru (nama, email, password, role `admin` / `approver`, `approval_tier`, `position`, `region_id`).
   - `show($id)`: Mengembalikan detail 1 pengguna beserta data relasi `region`.
   - `update(Request $request, $id)`: Memperbarui data pengguna, termasuk opsi penggantian kata sandi (opsional).
   - `destroy(Request $request, $id)`: Menghapus pengguna dengan proteksi (tidak dapat menghapus akun sendiri yang sedang aktif login).
2. **Audit Logging:** Setiap aksi `create_user`, `update_user`, `delete_user` dicatat ke tabel `activity_logs`.
3. **Routing:** `Route::apiResource('users', UserController::class)` di `backend/routes/api.php` dengan proteksi autentikasi Sanctum dan role admin.

### B. Frontend (React + Vite + shadcn/ui)
1. **Halaman Baru:** `frontend/src/pages/UsersManagement.jsx`
   - Header & Search bar, filter dropdown peran (`Semua`, `Admin`, `Penyetujui Level 1`, `Penyetujui Level 2`).
   - Tombol modal **"Tambah User Baru"**.
   - Tabel responsif: Nama & Email, Peran & Tingkat, Jabatan, Wilayah Penugasan, dan Tombol Aksi (Edit, Hapus).
   - Modal Form (Tambah / Edit) dengan validasi field, conditional approval tier jika memilih role Approver.
   - Modal Dialog Konfirmasi Hapus.
2. **Integrasi Navigasi:**
   - Route `/users` di `frontend/src/App.jsx`.
   - Menu **"Manajemen User"** dengan icon `UserCog` pada `frontend/src/components/app-sidebar.jsx` (khusus Admin).
   - Breadcrumb di `frontend/src/components/site-header.jsx`.

---

## 3. Tahapan Eksekusi (Step-by-Step)
```
1. [Backend Controller & Routes] Buat UserController.php & daftarkan rute API /api/users → verify: curl CRUD endpoints
2. [Frontend Page] Buat frontend/src/pages/UsersManagement.jsx dengan komponen shadcn → verify: bun run build
3. [Navigasi & Routing] Daftarkan route /users di App.jsx, app-sidebar.jsx, site-header.jsx → verify: navigasi aktif
4. [Dokumentasi Wiki] Buat docs/manajemen-user.md, perbarui docs/README.md & docs/log.md → verify: compliance AGENTS.md
5. [Git Commit & Push] Commit seluruh kode dan push ke origin main → verify: git status clean & push success
```
