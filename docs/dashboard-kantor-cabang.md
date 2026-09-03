> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Dashboard Monitoring Kantor Cabang & Wilayah Tambang

**Terkait:**
- [`plans/dashboard-kantor-cabang.md`](../plans/dashboard-kantor-cabang.md)
- [`plans/halaman-detail-kantor-cabang.md`](../plans/halaman-detail-kantor-cabang.md)
- [`backend/app/Http/Controllers/Api/DashboardController.php`](../backend/app/Http/Controllers/Api/DashboardController.php)
- [`frontend/src/pages/BranchDashboard.jsx`](../frontend/src/pages/BranchDashboard.jsx)
- [`frontend/src/pages/BranchDetail.jsx`](../frontend/src/pages/BranchDetail.jsx)
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

## 2. Fitur & Struktur Tata Letak Terkategori

Dashboard ini menyajikan panel pemantauan terstruktur dalam 4 section terpisah:
1. **Section Kantor Pusat (Head Office):** Monitoring khusus kantor pusat holding PT Tambang Nikel Nusantara di Jakarta Selatan (`HQ-JKT`).
2. **Section Kantor Cabang (Branch Office):** Monitoring khusus kantor cabang operasional di Kendari, Sulawesi Tenggara (`BC-KDR`).
3. **Section Wilayah Site Tambang Nikel (Mining Sites):** Grid visual 6 site ekstraksi nikel aktif (Pomalaa, Morowali, Konawe, Kolaka, Halmahera, Sorowako).
4. **Section Analitik Visual & Tabel Rekapitulasi:** Grafik perbandingan alokasi armada & frekuensi trip, grafik distribusi beban BBM, dan tabel komprehensif 8 wilayah.

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

---

## 4. Halaman Detail Wilayah Operasional (`/branch-dashboard/:id`)

Halaman `BranchDetail.jsx` menyediakan analitik mendalam (*deep-dive*) dengan 4 tab komprehensif:
1. **Tab Armada & Supir:** Inventaris kendaraan lengkap (odometer, plat, status) dan master personil supir lokal.
2. **Tab Arus Perjalanan:** Trip Keluar Aktif (*Outgoing*), Trip Masuk Aktif (*Incoming*), dan riwayat 10 perjalanan selesai terakhir.
3. **Tab BBM & Servis:** 10 log pengisian bahan bakar terakhir dan jadwal/riwayat servis armada.
4. **Tab Analitik Destinasi:** Grafik frekuensi dan peringkat rute tujuan yang paling sering dikunjungi dari wilayah ini.
- Dilengkapi **Quick Switcher** untuk berpindah antar wilayah kantor pusat, cabang, maupun 6 site tambang tanpa kembali ke halaman index.
