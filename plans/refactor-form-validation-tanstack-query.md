# Plan: Audit & Refactoring Form UI (shadcn/ui + React Hook Form + Zod) & Server State (TanStack Query)

## 1. Ringkasan & Tujuan
Melakukan audit dan refactoring menyeluruh di seluruh aplikasi frontend (`frontend/`) untuk:
1. **Server State Management:** Mengintegrasikan **TanStack Query (React Query v5)** untuk mengelola *data fetching*, *caching*, *synchronization*, serta *mutations* dengan invalidasi cache otomatis di seluruh modul.
2. **Form Architecture & UI Standard:** Menggunakan komponen resmi **shadcn/ui `Form`** (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`), **shadcn `Input`**, **shadcn `Textarea`**, **shadcn `Select`**, dan **shadcn `DropdownMenu`**.
3. **Form State & Type-Safe Validation:** Mengintegrasikan **React Hook Form (`useForm`)** bersama **Zod Validation (`zodResolver`)** pada seluruh formulir transaksi dan master data untuk menjamin validasi input yang ketat, pesan error yang informatif, serta performa rendering yang optimal.

---

## 2. Audit Komponen & Modul Aplikasi

### A. Dependencies Baru yang Diperlukan:
- `@tanstack/react-query`: Manajemen server-state, query caching, dan mutasi.
- `react-hook-form`: Manajemen state formulir terisolasi tanpa re-render berlebih.
- `@hookform/resolvers`: Adapter integrasi skema Zod ke React Hook Form.

### B. Komponen UI Baru / Diperbarui (`frontend/src/components/ui/`):
- `form.jsx`: Komponen standar shadcn berbasis `react-hook-form` Context.
- `select.jsx`: Memastikan implementasi shadcn Select bekerja mulus dengan `FormField` / `Controller`.

### C. Modul & Formulir yang Di-refactor:
1. **Autentikasi (`login-form.jsx` & `Login.jsx`):**
   - Skema Zod: `loginSchema` (email valid, password min. 6 karakter).
   - React Hook Form + shadcn `Form`, `Input`, `FormMessage`.
2. **Pemesanan Kendaraan (`Bookings.jsx`):**
   - Skema Zod: `bookingSchema` (nama pemohon, divisi, asal, tujuan, armada, supir, tanggal mulai/selesai, keperluan min. 5 karakter, approver L1 & L2).
   - Skema Zod: `completeTripSchema` (odometer akhir wajib >= odometer awal).
   - TanStack Query: `useQuery(['bookings'])`, `useMutation` untuk Create, Start Trip, Complete Trip.
3. **Manajemen Armada (`Vehicles.jsx`):**
   - Skema Zod: `vehicleSchema` (nama, nomor plat format valid, tipe penumpang/barang, kapasitas, kepemilikan, perusahaan sewa jika rental, status).
   - TanStack Query: `useQuery(['vehicles'])`, `useMutation` untuk Create, Update, Delete.
4. **Master Personil Supir (`Drivers.jsx`):**
   - Skema Zod: `driverSchema` (nama lengkap, nomor SIM format valid, nomor telepon format seluler Indonesia, penempatan wilayah, status).
   - TanStack Query: `useQuery(['drivers'])`, `useMutation` untuk Create, Update, Delete.
5. **Log Konsumsi BBM (`FuelLogs.jsx`):**
   - Skema Zod: `fuelLogSchema` (kendaraan, tanggal pengisian, volume liter > 0, total biaya Rupiah > 0, SPBU, odometer).
   - TanStack Query: `useQuery(['fuel-logs'])`, `useMutation` untuk Create.
6. **Jadwal & Riwayat Servis (`ServiceLogs.jsx`):**
   - Skema Zod: `serviceLogSchema` (kendaraan, tanggal servis, jenis servis, nama bengkel/mekanik, estimasi biaya, status, deskripsi pengerjaan).
   - TanStack Query: `useQuery(['service-logs'])`, `useMutation` untuk Create.
7. **Manajemen Pengguna (`UsersManagement.jsx`):**
   - Skema Zod: `userSchema` & `editUserSchema` (nama lengkap, email unik valid, password min. 6 karakter, role admin/approver, approval tier jika approver, jabatan, wilayah tugas).
   - TanStack Query: `useQuery(['users'])`, `useMutation` untuk Create, Update, Delete.
8. **Portal Persetujuan (`Approvals.jsx`):**
   - Skema Zod: `approvalActionSchema` (catatan wajib jika tolak, opsional jika setuju).
   - TanStack Query: `useQuery(['approvals-pending'])`, `useQuery(['approvals-history'])`, `useMutation` untuk Action & Cancel.
9. **Dashboard & Regional Monitoring (`Dashboard.jsx`, `BranchDashboard.jsx`, `BranchDetail.jsx`):**
   - TanStack Query: `useQuery(['dashboard-stats'])`, `useQuery(['dashboard-charts'])`, `useQuery(['regions-overview'])`, `useQuery(['region-detail', id])`.
10. **Laporan & Export Excel (`Reports.jsx`):**
    - Skema Zod: `reportFilterSchema` untuk filter parameter tanggal dan kriteria ekspor.
    - TanStack Query: `useQuery(['reports-bookings', filters])`.

---

## 3. Desain Arsitektur & Pola Kode

### A. Konfigurasi Global TanStack Query (`frontend/src/main.jsx` / `App.jsx`):
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 menit cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### B. Standard Form Pattern (shadcn + RHF + Zod):
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  // ...
});

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
});
```

---

## 4. Tahapan Pelaksanaan Refactoring (Step-by-Step)
```
1. [Instalasi Package] Install @tanstack/react-query, react-hook-form, @hookform/resolvers → verify: package.json update
2. [Setup Form & Query Core] Buat frontend/src/components/ui/form.jsx & konfigurasi QueryClientProvider di App.jsx → verify: provider terpasang
3. [Refactor Modul Autentikasi] Refactor login-form.jsx & Login.jsx dengan RHF + Zod → verify: validasi login aktif
4. [Refactor Modul Master Data] Refactor Vehicles.jsx, Drivers.jsx, UsersManagement.jsx dengan TanStack Query + RHF + Zod → verify: CRUD lancar
5. [Refactor Modul Operasional & BBM] Refactor Bookings.jsx, FuelLogs.jsx, ServiceLogs.jsx, Approvals.jsx → verify: flow transaksi & approval aktif
6. [Refactor Dashboard & Laporan] Migrasikan Dashboard.jsx, BranchDashboard.jsx, BranchDetail.jsx, Reports.jsx ke TanStack Query → verify: caching & refresh berfungsi
7. [Audit UI & Dropdown] Pastikan seluruh elemen select, input, dan form 100% menggunakan shadcn component → verify: bun run build & UI test
8. [Dokumentasi & Git Commit] Update docs/ dan commit push ke origin main → verify: git status clean & commit tersimpan
```
