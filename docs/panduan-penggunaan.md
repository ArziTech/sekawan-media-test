> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Panduan Penggunaan & Operasional Sistem

**Terkait:**
- [docs/README.md](./README.md)
- [docs/log.md](./log.md)
- [docs/arsitektur-aplikasi.md](./arsitektur-aplikasi.md)
- [docs/alur-persetujuan-berjenjang.md](./alur-persetujuan-berjenjang.md)
- [README.md](../README.md)

Dokumen ini memuat panduan lengkap tata cara pengoperasian aplikasi web pemesanan dan monitoring kendaraan operasional tambang nikel untuk Admin dan Pihak Penyetujui.

---

## 1. Masuk ke Sistem & Ganti Akun Demo

1. Buka browser pada alamat URL aplikasi: `http://localhost:8080` (Docker) atau `http://localhost:5173` (Vite Dev).
2. Pada halaman Login, Anda dapat mengetikkan email & password, atau menggunakan tombol **1-Klik Login Demo Reviewer**:
   - **Admin:** `admin@tambang.com` / `password123`
   - **Approver Level 1:** `approver1@tambang.com` / `password123`
   - **Approver Level 2:** `approver2@tambang.com` / `password123`
3. Setelah masuk, gunakan dropdown **"Ganti Akun Demo"** di bagian atas Navbar untuk berpindah peran tanpa perlu logout manual.

---

## 2. Tata Cara Pemesanan Kendaraan (Admin)

1. Buka menu **Pemesanan Kendaraan** pada Sidebar.
2. Klik tombol **"Buat Pemesanan Baru"**.
3. Isi data form:
   - Nama Pemohon & Divisi/Departemen.
   - Lokasi Asal & Lokasi Tujuan (pilih dari 1 Kantor Pusat, 1 Cabang, atau 6 Lokasi Tambang).
   - Pilih Kendaraan (hanya unit yang berstatus *available*).
   - Pilih Supir / Driver (hanya driver yang berstatus *available*).
   - Tentukan Tanggal & Waktu Mulai serta Selesai.
   - Pilih **Penyetujui Level 1** (Supervisor) dan **Penyetujui Level 2** (Kepala Pool / GM).
   - Tuliskan keperluan pemakaian.
4. Klik **"Simpan & Kirim Persetujuan"**.

---

## 3. Tata Cara Melakukan Persetujuan (Approver)

1. Masuk sebagai akun **Approver Level 1** atau **Approver Level 2**.
2. Buka menu **Portal Persetujuan**.
3. Pada tab **"Menunggu Tindakan"**, klik tombol **"Setujui (Approve)"** atau **"Tolak (Reject)"** pada kartu pemesanan.
4. Masukkan catatan atau alasan penolakan pada modal konfirmasi, lalu klik tombol konfirmasi.
5. Pemesanan yang disetujui Level 1 akan otomatis masuk ke antrean Level 2. Pemesanan yang disetujui Level 2 akan berstatus `approved` dan siap diberangkatkan.

---

## 4. Eksekusi Perjalanan & Penyelesaian

1. **Mulai Perjalanan:** Admin membuka detail pemesanan berstatus `approved`, lalu mengklik **"Mulai Perjalanan"** $\rightarrow$ Status berubah menjadi `in_use`, mobil dan supir ditandai sedang bertugas.
2. **Selesai Perjalanan:** Setelah mobil kembali, Admin mengklik **"Selesaikan Perjalanan"** $\rightarrow$ Masukkan angka odometer akhir $\rightarrow$ Status berubah menjadi `completed`, mobil dan supir kembali berstatus `available`.

---

## 5. Monitoring BBM, Jadwal Servis & Ekspor Excel

1. **Konsumsi BBM:** Buka menu **Konsumsi BBM** $\rightarrow$ Klik **"Catat Pengisian BBM"** untuk mencatat liter, harga, total biaya, dan odometer.
2. **Jadwal & Riwayat Servis:** Buka menu **Jadwal & Riwayat Servis** untuk memantau pemeliharaan rutin, perbaikan kendala teknis, dan jadwal servis berkala:
   - **Jadwalkan Servis Baru:** Klik **"Jadwalkan Servis"** untuk memasukkan armada, bengkel rekanan, estimasi biaya, odometer saat ini, dan jadwal servis berikutnya.
   - **Pembaruan Status Servis (Update Status):** Klik tombol **"Update Status"** pada baris data tabel servis untuk memperbarui tahapan:
     - `Terjadwal (scheduled)`: Menunggu jadwal masuk bengkel.
     - `Sedang Dikerjakan (in_progress)`: Unit masuk bengkel $\rightarrow$ status armada otomatis menjadi **Dalam Servis (`in_service`)** sehingga tidak dapat dipesan.
     - `Selesai (completed)`: Pengerjaan selesai $\rightarrow$ status armada otomatis kembali menjadi **Tersedia (`available`)** di pool, serta memperbarui *last service date* dan target servis berikutnya.
     - `Dibatalkan (cancelled)`: Jadwal servis dibatalkan $\rightarrow$ status armada otomatis dipulihkan menjadi **Tersedia (`available`)** di pool.
3. **Laporan & Export Excel (.xlsx):**
   - Buka menu **Laporan & Export Excel** $\rightarrow$ Tentukan filter rentang tanggal, wilayah/site tambang, tipe armada, status kepemilikan, atau status pemesanan.
   - Klik **"Export ke Excel (.xlsx)"** untuk mengunduh laporan spreadsheet Microsoft Excel resmi yang telah diformat secara profesional.
   - **Fitur Tata Letak Spreadsheet:**
     - *Header Banner* resmi `PT SEKAWAN MEDIA MINING` dengan stempel waktu dan parameter filter.
     - *Header Tabel* berwarna Deep Navy dengan teks putih tebal dan fitur *AutoFilter* otomatis Excel.
     - *Zebra Striping* (selang-seling abu-abu muda) dan garis batas rapi (*thin border*).
     - *Lebar Kolom Optimal* yang disesuaikan sehingga tidak ada teks terpotong (*no clipped text*).
     - *Format Mata Uang & Angka* untuk volume BBM (desimal) dan Biaya Operasional (Rupiah).
     - *Baris Ringkasan Total* dengan kalkulasi formula otomatis `=SUM(...)`.
     - *Freeze Pane* pada baris header untuk kenyamanan navigasi data dalam jumlah besar.
4. **Audit Trail:** Buka menu **Log Aktivitas (Audit Trail)** untuk memantau rekam jejak setiap aksi pengguna.

