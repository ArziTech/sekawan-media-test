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

## 2. Fitur & Panel Monitoring Terpadu

Dashboard ini menyajikan panel ringkasan komprehensif (*Overview Panel*) seluruh 8 wilayah operasional:
1. **8 Kartu Status Wilayah:** Menampilkan ringkasan kesiapan armada pool (unit tersedia vs total), personil supir siap jalan, ritase perjalanan aktif keluar, serta beban biaya BBM bulan berjalan untuk Kantor Pusat (Jakarta), Kantor Cabang (Kendari), dan 6 Site Tambang Nikel.
2. **Grafik Komparasi Utilisasi Armada:** Bar chart perbandingan jumlah kendaraan terdaftar dan frekuensi keberangkatan trip logistik per site.
3. **Grafik Distribusi Beban BBM:** Bar chart sebaran total biaya konsumsi BBM operasional kendaraan pada masing-masing pool wilayah.
4. **Tabel Ringkasan Komparasi 8 Wilayah:** Rekapitulasi tabel terstruktur memuat rincian armada, supir, ritase perjalanan keluar/masuk, konsumsi BBM (liter & biaya), dan status keaktifan pool.

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
