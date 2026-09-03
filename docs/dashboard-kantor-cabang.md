> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Dashboard Monitoring Kantor Cabang & Wilayah Tambang

**Terkait:**
- [`plans/dashboard-kantor-cabang.md`](../plans/dashboard-kantor-cabang.md)
- [`backend/app/Http/Controllers/Api/DashboardController.php`](../backend/app/Http/Controllers/Api/DashboardController.php)
- [`frontend/src/pages/BranchDashboard.jsx`](../frontend/src/pages/BranchDashboard.jsx)
- [`docs/arsitektur-aplikasi.md`](./arsitektur-aplikasi.md)
- [`docs/panduan-penggunaan.md`](./panduan-penggunaan.md)

---

## 1. Ikhtisar & Tujuan

Dashboard Monitoring Kantor Cabang dan Wilayah Tambang (`/branch-dashboard`) menyediakan portal analitik visual terdistribusi untuk memantau aktivitas operasional di seluruh 8 wilayah kerja PT Tambang Nikel Nusantara:
1. **1 Kantor Pusat:** Jakarta Selatan (`HQ-JKT`)
2. **1 Kantor Cabang:** Kendari, Sulawesi Tenggara (`BC-KDR`)
3. **6 Wilayah Tambang Nikel:**
   - Tambang A (Pomalaa) — `MINE-PML`
   - Tambang B (Morowali) — `MINE-MRW`
   - Tambang C (Konawe) — `MINE-KNW`
   - Tambang D (Kolaka) — `MINE-KLK`
   - Tambang E (Halmahera) — `MINE-HLM`
   - Tambang F (Sorowako) — `MINE-SRW`

---

## 2. Fitur & Mode Tampilan

### A. Mode 1: Ringkasan Komparatif Semua Wilayah (*Overview Mode*)
- **8 Kartu Wilayah:** Menampilkan ringkasan armada pool (tersedia vs total), supir siap jalan, ritase aktif, dan biaya BBM bulanan.
- **Grafik Komparasi Utilisasi:** Bar chart perbandingan jumlah kendaraan dan frekuensi keberangkatan logistik per site.
- **Grafik Beban Biaya BBM:** Distribusi pengeluaran bahan bakar kendaraan pada masing-masing pool wilayah.
- **Tabel Rekapitulasi 8 Wilayah:** Tabel lengkap dengan metrik kesiapan dan tombol pintas navigasi detail (*drill-down*).

### B. Mode 2: Analisis Mendalam Wilayah Terpilih (*Drill-Down Mode*)
- **Banner Identitas Wilayah:** Nama, tipe wilayah, kode registrasi, dan alamat operasional.
- **4 Kartu Metrik Utama:**
  1. *Kesiapan Armada Pool:* Unit tersedia vs total, komposisi angkutan orang vs barang.
  2. *Personil Supir:* Supir siap bertugas vs sedang dalam penugasan dinas (*on duty*).
  3. *Ritase Logistik Aktif:* Perjalanan keluar (*outgoing*) vs perjalanan masuk (*incoming*).
  4. *Konsumsi BBM Bulan Ini:* Total liter dan beban biaya (Rupiah).
- **Grafik Komposisi & Koridor:**
  - Donut chart komposisi armada milik sendiri vs sewa dan penumpang vs kargo.
  - Bar chart destinasi perjalanan terpadat dari cabang terpilih.
- **4 Tab Data Detail:**
  1. *Armada Pool:* Daftar kendaraan, plat nomor, status kepemilikan, odometer, dan jadwal servis terdekat.
  2. *Personil Supir:* Profil supir terdaftar, nomor telepon, nomor SIM, dan status penugasan.
  3. *Logistik & Trip Terkini:* Riwayat perjalanan aktif dan terbaru yang melibatkan cabang terkait.
  4. *BBM & Servis:* Log pengisian bahan bakar dan jadwal/riwayat perawatan berkala kendaraan cabang.

---

## 3. Spesifikasi API Backend

### `GET /api/dashboard/regions`
Mengembalikan rekapitulasi ke-8 wilayah beserta dataset grafik komparatif.
- **Auth:** `Bearer <Sanctum Token>`
- **Response Structure:**
  ```json
  {
    "success": true,
    "data": {
      "regions": [
        {
          "id": 1,
          "name": "Kantor Pusat Jakarta",
          "type": "head_office",
          "code": "HQ-JKT",
          "fleet": { "total": 2, "available": 2, "in_use": 0, "in_service": 0 },
          "drivers": { "total": 1, "available": 1, "on_duty": 0 },
          "trips": { "active_outgoing": 0, "active_incoming": 0, "total_origin": 3, "total_destination": 0 },
          "fuel": { "monthly_liters": 0, "monthly_cost": 0 }
        }
      ],
      "comparison_chart": {
        "labels": ["..."],
        "fleet_counts": [2, 2, 2, ...],
        "trip_counts": [3, 2, 1, ...],
        "fuel_cost_millions": [0.0, 1.3, ...]
      }
    }
  }
  ```

### `GET /api/dashboard/regions/{id}`
Mengembalikan data lengkap untuk 1 wilayah spesifik.
- **Auth:** `Bearer <Sanctum Token>`
- **Parameters:** `id` (ID Region)
- **Response Data:** `region`, `stats`, `vehicles`, `drivers`, `active_outgoing`, `active_incoming`, `recent_completed`, `fuel_logs`, `service_logs`, `top_destinations`.
