# Mutexa Frontend Development Plan

## 1. Daftar Kebutuhan Fitur (Dashboard & Analisis)

Berikut adalah 11 metrik dan data yang akan divisualisasikan pada halaman Frontend:

1. **Ringkasan Saldo**: Rata-rata Credit (3 bln), Rata-rata Debit (3 bln), Rata-rata Saldo Per Hari, Total Credit (3 bln), Total Debit (3 bln).
2. **Summary Perbulan**: Tabel berisi Periode, Saldo Akhir, Total Credit, Total Debit, Freq Credit, Freq Debit.
3. **Top 10 Credit Amount**: Keterangan, Nominal, Tanggal.
4. **Top 10 Debit Amount**: Keterangan, Nominal, Tanggal.
5. **Top 10 Credit Frequency**: Keterangan, Frekuensi berulang.
6. **Top 10 Debit Frequency**: Keterangan, Frekuensi berulang.
7. **Anomali Transaksi (Credit & Debit)**: Keterangan, Nominal, Tanggal (menggunakan hasil deteksi AnomalyDetectionService).
8. **Income**: Mutasi masuk yang berkategori INCOME (Keterangan, Nominal, Tanggal).
9. **Pajak (Tax)**: Mutasi pengeluaran yang berkategori TAX (Keterangan, Nominal, Tanggal).
10. **Bunga Pinjaman (Interest)**: Mutasi berkategori INTEREST (Keterangan, Nominal, Tanggal).
11. **Detail Semua Transaksi**: Tabel master memuat Tanggal, Keterangan, Flag (DB/CR), dan Jumlah.
12. **Fitur Exclusion / Blacklist**: Fitur pengecualian mutasi (berdasarkan text deskripsi, nama, atau no rekening pengirim/penerima). Data yang dikecualikan (contoh: biaya admin atau transaksi internal owner) _tidak akan dimasukkan dalam hitungan statistik poin 1 s/d 10_.

---

## 2. Arsitektur Angular (Standalone Components)

Aplikasi dibangun menggunakan struktur modular modern dan strict-typing:

- `core/`
  - `models/request` & `models/response`: Interface DTO untuk komunikasi API.
  - `services/`: API Services (`mutasi.service.ts`, `analisis.service.ts`).
  - `guards/` & `interceptors/`: Autentikasi dan perlindungan route.
- `shared/`
  - `components/`: Komponen UI _reusable_ seperti custom button, tabel data, atau statistik card.
  - `pipes/`: Konversi mata uang (Rupiah).
- `layout/`
  - Berisi `navbar`, `sidebar`, dan `footer`.
- `features/`
  - `auth/`: Login, Register.
  - `dashboard/`: Menampung metrik Top 10 dan Ringkasan Saldo.
  - `analisis/`: Menampung Summary per bulan dan grafis anomali.
  - `mutasi/`: Menampung Upload Dokumen dan Tabel Detail Transaksi dengan aksi Exclude.
  - `profil/`: Pengaturan pengguna.

---

## 3. Roadmap Implementasi

- [ ] **Tahap 1: Scaffolding Angular** - Menginisialisasi komponen kerangka UI di `mutexa-fe` (Layout, Features, Shared).
- [ ] **Tahap 2: Pembuatan DTO & Models** - Membuat file konektor interface Angular agar sesuai dengan JSON response backend.
- [ ] **Tahap 3: Pembuatan Endpoint Analytics di Backend** - Merancang query Agregasi (Group By, Sum, Avg) pada `mutexa-be` untuk metrik-metrik Top 10 dan Ringkasan Saldo.
- [ ] **Tahap 4: Integrasi Dashboard UI** - Menyatukan data dari API ke Angular menggunakan kartu UI dan tabel `shared/`.
- [ ] **Tahap 5: Fitur Blacklist / Exclusion** - Membuka manajemen UI Exclusion Rule (blacklist) dari mutasi tabel, lalu me-refresh ulang state data di backend.
