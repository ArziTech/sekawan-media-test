> **Dibuat:** 2026-09-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Skema Basis Data & Relasi ORM

**Terkait:**
- [docs/README.md](./README.md)
- [docs/log.md](./log.md)
- [docs/arsitektur-aplikasi.md](./arsitektur-aplikasi.md)
- [docs/alur-persetujuan-berjenjang.md](./alur-persetujuan-berjenjang.md)
- [backend/database/migrations/](../backend/database/migrations/)
- [backend/app/Models/](../backend/app/Models/)

Dokumen ini berisi dokumentasi detail struktur 10 tabel database MySQL, tipe data, foreign key constraints, dan relasi Eloquent ORM.

---

## 1. Daftar Tabel & Struktur

### 1. `regions` (Wilayah Kantor & Lokasi Tambang)
- `id` (BigInt, PK)
- `name` (VarChar) — Nama wilayah/kantor/tambang
- `type` (Enum: `head_office`, `branch_office`, `mine_site`)
- `code` (VarChar, Nullable) — Kode unit (e.g. `HQ-JKT`, `MINE-PML`)
- `address` (Text, Nullable)

### 2. `rental_companies` (Vendor Persewaan Kendaraan)
- `id` (BigInt, PK)
- `name` (VarChar)
- `contact_person` (VarChar)
- `phone` (VarChar)
- `email` (VarChar)
- `address` (Text)

### 3. `vehicles` (Armada Kendaraan Operasional)
- `id` (BigInt, PK)
- `name` (VarChar) — e.g. Toyota Hilux 4x4, Fuso Mining Dump
- `license_plate` (VarChar, Unique)
- `type` (Enum: `passenger`, `cargo`)
- `ownership_type` (Enum: `owned`, `rented`)
- `rental_company_id` (FK -> `rental_companies.id`, Nullable)
- `region_id` (FK -> `regions.id`)
- `status` (Enum: `available`, `in_use`, `in_service`)
- `fuel_type` (VarChar)
- `current_odometer` (Unsigned Integer)
- `last_service_date` (Date, Nullable)
- `next_service_date` (Date, Nullable)
- `next_service_odometer` (Unsigned Integer, Nullable)

### 4. `drivers` (Master Personil Supir)
- `id` (BigInt, PK)
- `name` (VarChar)
- `phone` (VarChar)
- `license_number` (VarChar, Nullable)
- `region_id` (FK -> `regions.id`)
- `status` (Enum: `available`, `on_duty`, `off`)

### 5. `users` (Pengguna Aplikasi)
- `id` (BigInt, PK)
- `name` (VarChar)
- `email` (VarChar, Unique)
- `password` (VarChar, Hashed)
- `role` (Enum: `admin`, `approver`)
- `approval_tier` (Unsigned TinyInt, Nullable: `1` atau `2`)
- `position` (VarChar, Nullable)
- `region_id` (FK -> `regions.id`, Nullable)

### 6. `bookings` (Transaksi Pemesanan Kendaraan)
- `id` (BigInt, PK)
- `booking_code` (VarChar, Unique) — e.g. `BKG-YYYYMM-XXXX`
- `requester_name` (VarChar)
- `requester_department` (VarChar)
- `region_id` (FK -> `regions.id`, Asal)
- `destination_region_id` (FK -> `regions.id`, Tujuan)
- `vehicle_id` (FK -> `vehicles.id`)
- `driver_id` (FK -> `drivers.id`)
- `start_date` (DateTime)
- `end_date` (DateTime)
- `purpose` (Text)
- `status` (Enum: `pending_level_1`, `pending_level_2`, `approved`, `in_use`, `completed`, `rejected`, `cancelled`)
- `start_odometer` (Unsigned Integer, Nullable)
- `end_odometer` (Unsigned Integer, Nullable)
- `created_by_user_id` (FK -> `users.id`)

### 7. `booking_approvals` (Catatan Persetujuan Berjenjang)
- `id` (BigInt, PK)
- `booking_id` (FK -> `bookings.id`, Cascade)
- `approval_level` (Unsigned TinyInt: `1` atau `2`)
- `approver_user_id` (FK -> `users.id`)
- `status` (Enum: `pending`, `approved`, `rejected`)
- `notes` (Text, Nullable)
- `action_date` (Timestamp, Nullable)

### 8. `fuel_logs` (Pencatatan Konsumsi Bahan Bakar)
- `id` (BigInt, PK)
- `vehicle_id` (FK -> `vehicles.id`)
- `booking_id` (FK -> `bookings.id`, Nullable)
- `log_date` (Date)
- `liters` (Decimal 8,2)
- `cost_per_liter` (Decimal 12,2)
- `total_cost` (Decimal 14,2)
- `odometer_reading` (Unsigned Integer)
- `fuel_type` (VarChar)
- `receipt_no` (VarChar, Nullable)
- `notes` (Text, Nullable)
- `created_by_user_id` (FK -> `users.id`)

### 9. `service_logs` (Jadwal & Riwayat Servis Armada)
- `id` (BigInt, PK)
- `vehicle_id` (FK -> `vehicles.id`)
- `service_date` (Date)
- `service_type` (Enum: `routine`, `repair`, `inspection`, `overhaul`)
- `cost` (Decimal 14,2)
- `workshop_name` (VarChar)
- `odometer_at_service` (Unsigned Integer)
- `next_service_date` (Date, Nullable)
- `next_service_odometer` (Unsigned Integer, Nullable)
- `status` (Enum: `scheduled`, `in_progress`, `completed`, `cancelled`)
- `scheduled_at` (Timestamp, Nullable) — Waktu pencatatan jadwal servis
- `in_progress_at` (Timestamp, Nullable) — Waktu unit masuk ke bengkel rekanan
- `completed_at` (Timestamp, Nullable) — Waktu pekerjaan servis selesai
- `cancelled_at` (Timestamp, Nullable) — Waktu jadwal servis dibatalkan
- `notes` (Text, Nullable)
- `created_by_user_id` (FK -> `users.id`)

### 10. `activity_logs` (Audit Trail Sistem)
- `id` (BigInt, PK)
- `user_id` (FK -> `users.id`, Nullable)
- `action` (VarChar) — e.g. `create_booking`, `approve_level_1`, `start_trip`, dll
- `module` (VarChar) — e.g. `bookings`, `approvals`, `vehicles`, `fuel`, `service`, `auth`
- `description` (Text)
- `ip_address` (VarChar 45, Nullable)
- `user_agent` (Text, Nullable)
- `payload` (JSON, Nullable)
- `created_at` (Timestamp)
