> **Dibuat:** 2026-07-03 · **Diperbarui:** 2026-09-03 · **Status:** aktif

# Docs Index

Indeks per topik untuk `docs/*.md`. Satu file = satu topik (lihat aturan dokumentasi di `AGENTS.md` §Documentation Rules). Setiap file diawali header `Dibuat`/`Diperbarui`/`Status` — update `Diperbarui` setiap kali mengedit filenya, dan tambahkan barisnya di sini saat menambah dokumen baru.

`docs/` mengikuti pola **LLM Wiki**: file-file ini bukan sekadar arsip, tapi wiki yang saling terhubung dan dirawat terus-menerus.

- **File ini (`README.md`)** = index — katalog isi per topik.
- **[log.md](./log.md)** = timeline — catatan kronologis append-only tiap kali docs dibuat/diubah signifikan.
- **[landing-page-dan-presentasi.md](./landing-page-dan-presentasi.md)** = Presentasi hasil technical test, matriks kepatuhan soal, activity diagram, PDM, dan demo credentials login.
- **[arsitektur-aplikasi.md](./arsitektur-aplikasi.md)** = Arsitektur teknis decoupled SPA, REST API Laravel 13.x, React.js SPA, dan autentikasi.
- **[alur-persetujuan-berjenjang.md](./alur-persetujuan-berjenjang.md)** = Alur kerja persetujuan berjenjang sekuensial (Level 1 $\rightarrow$ Level 2) dan state machine.
- **[skema-basis-data.md](./skema-basis-data.md)** = Dokumentasi skema 10 tabel basis data MySQL, tipe data, dan relasi Eloquent ORM.
- **[dashboard-kantor-cabang.md](./dashboard-kantor-cabang.md)** = Dashboard monitoring kantor cabang, kantor pusat, dan 6 wilayah tambang nikel terdistribusi.
- **[panduan-penggunaan.md](./panduan-penggunaan.md)** = Panduan operasional aplikasi, alur booking, otorisasi approval, monitoring BBM/servis, export Excel, dan audit log.

---

## Rencana Implementasi

- **[plans/dashboard-kantor-cabang.md](../plans/dashboard-kantor-cabang.md)** = Dokumen rencana implementasi dashboard monitoring kantor cabang dan site tambang.
- **[plans/landing-page-dan-login-enhancement.md](../plans/landing-page-dan-login-enhancement.md)** = Dokumen rencana implementasi landing page publik dan login enhancement.
- **[plans/aplikasi-pemesanan-monitoring-kendaraan.md](../plans/aplikasi-pemesanan-monitoring-kendaraan.md)** = Dokumen rencana master spesifikasi sistem, skema basis data, dan tahapan implementasi.
