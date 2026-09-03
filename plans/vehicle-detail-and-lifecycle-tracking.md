# Plan: Vehicle 360° Detail & Lifecycle Tracking System

## 1. Objectives & Overview
Implement a comprehensive vehicle detail view accessible directly from the **Inventaris Armada Tambang (`/vehicles`)** page. This view provides a unified 360-degree timeline and monitoring dashboard for any vehicle, featuring:
1. **Vehicle Identity & Health Stats**: Model, plate number, type, ownership, pool origin, odometer, status, aggregated lifetime stats (total trips, fuel liters/cost, service cost).
2. **Track Penggunaan Armada (Trips & Bookings History)**: History of assignments, routes (origin -> destination), drivers, requesters, and trip status.
3. **Track Pengisian BBM (Fuel Logs & Consumption Tracking)**: History of fuel fill-ups, liters, total cost, odometer, and driver logging.
4. **Track Riwayat & Lifecycle Servis (Service History & Status Transition Timestamps)**: Service history with multi-phase transition timestamps:
   - Terjadwal Sejak: Timestamp when service was scheduled.
   - Masuk Bengkel: Timestamp when vehicle entered the workshop (`in_progress`).
   - Selesai Pengerjaan: Timestamp when maintenance was completed.
   - Dibatalkan: Timestamp if cancelled.

---

## 2. Step-by-Step Implementation

### Step 1: Database Migration for Service Log Status Timestamps
- Update `service_logs` table schema to include:
  - `scheduled_at` (timestamp, nullable)
  - `in_progress_at` (timestamp, nullable)
  - `completed_at` (timestamp, nullable)
  - `cancelled_at` (timestamp, nullable)
- Update `ServiceLog.php` model `$fillable` and `$casts`.

### Step 2: Backend Enhancements
- **`ServiceLogController.php`**:
  - In `store()`, automatically initialize `scheduled_at`, `in_progress_at`, or `completed_at` based on initial status.
  - In `updateStatus()`, timestamp transition events whenever status advances (`scheduled` -> `in_progress` -> `completed` or `cancelled`).
- **`VehicleController.php`**:
  - Enhance `show($id)` to load complete relations (`bookings.originRegion`, `bookings.destinationRegion`, `bookings.driver`, `fuelLogs.driver`, `serviceLogs.createdBy`) and calculate summary statistics (`total_trips`, `total_fuel_liters`, `total_fuel_cost`, `total_service_cost`).

### Step 3: Frontend Vehicle 360° Detail Dialog
- In `frontend/src/pages/Vehicles.jsx`:
  - Add an "Eye" / "Lihat Detail" action button on every table row and make vehicle names clickable.
  - Implement a full-featured, responsive modal dialog (`sm:max-w-4xl max-h-[90vh] overflow-y-auto`) with:
    - **Header & KPI Strip**: 4 summary metric cards (Total Odometer, Total Dinas/Trip, Total Konsumsi BBM, Total Biaya Servis).
    - **Tab 1: Riwayat Pemakaian & Dinas**: Table with badge status, driver, origin -> destination, date range, purpose.
    - **Tab 2: Track Pengisian BBM**: Table with liters, price/liter, total cost, odometer, driver, date.
    - **Tab 3: Track & Lifecycle Servis**: Table & visual step timeline for each service log showing `scheduled_at`, `in_progress_at`, `completed_at`, `cancelled_at`, workshop, cost, and mechanic notes.
    - **Tab 4: Rincian Teknis & Kepemilikan**: Ownership company, pool region, fuel type, next scheduled maintenance date & target odometer.

### Step 4: Verification & Documentation
- Build and verify frontend with `npm run build --prefix frontend`.
- Update `docs/panduan-penggunaan.md`, `docs/skema-basis-data.md`, `docs/README.md`, and `docs/log.md`.
- Commit and push to GitHub.
