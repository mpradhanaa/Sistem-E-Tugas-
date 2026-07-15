# E-Tugas 4 - UI/UX Design Documentation

Dokumen ini berisi informasi arsitektur antarmuka, standarisasi sistem desain, dan spesifikasi komponen visual untuk proyek sistem informasi akademik mini e-learning "E-Tugas 4". Dokumentasi ini disusun secara mandiri oleh tim UI/UX Designer sebagai panduan implementasi layout bagi tim Frontend Developer.

---

## 1. Identitas Perancang

* **Nama:** Muhamad Kurnia Hidayat
* **NPM:** 2306700038
* **Kelas:** TI-6B
* **Peran:** UI/UX Designer (Kelompok 4)

---

## 2. Spesifikasi Sistem Desain (Design System)

Seluruh komponen dalam proyek ini dirancang dengan pendekatan minimalis modern menggunakan basis elemen asli (native) guna mempermudah proses translasi ke dalam kode CSS.

### Tipografi
* **Font Family:** Inter (Satu font tunggal yang digunakan secara konsisten di semua halaman untuk menjaga keterbacaan data).
* **Hierarki Ketebalan dan Ukuran Huruf:**
  * Judul Halaman Utama: 24px - 28px (Bold, 700)
  * Judul Section & Kepala Modal: 16px - 18px (SemiBold, 600)
  * Kepala Tabel & Label Input Form: 14px (Medium, 500)
  * Isi Data Tabel & Teks Deskripsi: 14px (Regular, 400)
  * Keterangan Tambahan / Teks Redup: 12px (Regular, 400)

### Palet Warna (Color Palette)
* **Background Utama Aplikasi:** `#F5F5F5` (Abu-abu tipis untuk memunculkan dimensi kontras yang tegas antara area latar dengan kartu konten).
* **Background Kartu & Tabel:** `#FFFFFF` (Putih pekat dilengkapi efek Drop Shadow tipis).
* **Warna Elemen Interaktif & Navigasi Aktif:** Blue Gradient (Menyelaraskan tema visual utama dari panel halaman login).
* **Warna Dasar Teks:** `#1A202C` (Teks Utama/Pekat) dan `#6C757D` (Sub-teks/Muted).

### Aset Ikon (Iconography)
* Seluruh ikon penunjang pada bilah navigasi kiri, filter, dan tombol aksi di dalam tabel memanfaatkan pustaka dari **Lucide Icons** guna memastikan konsistensi ketebalan garis (stroke width).

---

## 3. UI/UX Design Structure

Berikut adalah tata letak arsitektur halaman, pembagian frame kerja, serta penempatan state melayang (Popup Modal) yang telah diselesaikan dengan standar resolusi layar desktop (1440x900 px):

Page 1: Authentication & Admin
├──  [Frame] Login Page (Double Split Layout)
├──  [Frame] Dashboard Admin (Stats Cards & Daftar User)
├──     └──  [Popup Modal] Tambah Mahasiswa Baru
├──     └──  [Popup Modal] Tambah Dosen Baru
└──  [Frame] Kelola User (Filter & Search Bar)

Page 2: Dosen
├──  [Frame] Dashboard Dosen
├──  [Frame] Buka Kelas Baru
├──  [Frame] Kelas Saya (Daftar Kelas yang Diampu)
├──  [Frame] Nilai Tugas
└──     └── [Popup Modal] Beri Nilai & Feedback

Page 3: Mahasiswa
├──  [Frame] Dashboard Mahasiswa (Greeting Banner & Tenggat Waktu Terdekat)
├──  [Frame] Tugas Saya
├──  [Frame] Detail Tugas (2-Column Split Layout & Dropzone Upload)
├──  [Frame] Nilai Saya
├──     └──  [Popup Modal] Feedback Dosen
├──     └──  [Popup Modal] Preview File Jawaban
└──  [Frame] Kelas Saya (Daftar Kelas Diikuti)

---

## 4. Design Handoff & Deliverables

* **Figma Live Link:** [https://www.figma.com/design/skZUoCh6wMrC6TDtCCrw8B/E-Tugas-4--Revisi-?node-id=0-1&t=aKxslbu1sAe94TrF-1] 
* **Dokumentasi Preview Visual:** Seluruh tangkapan layar dari frame di atas disimpan pada direktori `/preview-screens/` lokal untuk mempermudah pemeriksaan visual cepat.

---
Dokumentasi Desain UI/UX Proyek E-Tugas 4 - Kelompok 4.