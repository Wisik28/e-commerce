# Spesifikasi Desain Frontend — Platform E-Commerce (Admin / Penjual / Pembeli)

> Dokumen ini adalah dokumentasi ulang dari 13 screenshot desain UI yang di-generate oleh Rocket AI. Desain aslinya menampilkan semua halaman dalam **satu sidebar gabungan** (untuk keperluan preview di tool builder). Di dokumen ini, struktur tersebut **dipecah ulang menjadi 3 area halaman yang benar-benar terpisah** — Admin, Penjual, Pembeli — masing-masing dengan alur login dan navigasi sendiri, siap dipakai sebagai acuan implementasi di Antigravity.

⚠️ **Penting sebelum mulai implementasi:** Chrome/UI bawaan tool builder yang muncul di screenshot — bar "Exit full screen", address bar URL, ikon Edit/kamera/copy/user+/git, tombol **"Launch"** di pojok kanan atas, serta pill hitam **"N · 1 Issue ×"** di pojok kiri bawah — itu semua adalah UI dari Rocket AI, **BUKAN bagian dari produk**. Jangan ikut diimplementasikan.

---

## Daftar Isi

1. [Ringkasan Produk](#1-ringkasan-produk)
2. [Alur Autentikasi & Pemisahan Role](#2-alur-autentikasi--pemisahan-role)
3. [Design System](#3-design-system)
4. [Komponen UI Bersama](#4-komponen-ui-bersama)
5. [Layout Shell per Role](#5-layout-shell-per-role)
6. [Role: Admin](#6-role-admin)
7. [Role: Penjual (Seller)](#7-role-penjual-seller)
8. [Role: Pembeli (Buyer)](#8-role-pembeli-buyer)
9. [Peta Rute Lengkap](#9-peta-rute-lengkap)
10. [Struktur Folder Frontend yang Disarankan](#10-struktur-folder-frontend-yang-disarankan)
11. [Model Data Tersirat](#11-model-data-tersirat)
12. [Catatan, Asumsi & Rekomendasi Lanjutan](#12-catatan-asumsi--rekomendasi-lanjutan)

---

## 1. Ringkasan Produk

- **Nama aplikasi back-office** (dari desain): `EcomDashboard`
- **Nama storefront pembeli** (dari desain): `Toko Nusantara`
- **Tipe platform:** marketplace e-commerce dengan 3 aktor:
  - **Admin** — mengelola platform & data penjual
  - **Penjual (Seller)** — mengelola toko, produk, dan pesanan miliknya sendiri
  - **Pembeli (Buyer)** — berbelanja produk dari para penjual
- **Konteks data contoh di desain:** produk fashion & aksesori lokal Indonesia (batik, sneakers, tas), mata uang Rupiah, tanggal format `DD/MM/YYYY` dan `DD Mmm YYYY`.

---

## 2. Alur Autentikasi & Pemisahan Role

Logika sesuai kebutuhan: **ketiga aktor login lewat 1 pintu yang sama, tapi dengan kredensial berbeda**, lalu sistem otomatis mengarahkan ke halaman miliknya masing-masing berdasarkan role akun tersebut — bukan user yang memilih role secara manual.

| Role | Kredensial | Redirect setelah login | Prefix rute |
|---|---|---|---|
| Admin | username/email + password khusus admin | `/admin/dashboard` | `/admin/*` |
| Penjual | username/email + password akun toko | `/seller/dashboard` | `/seller/*` |
| Pembeli | email/no. HP + password akun pembeli | `/buyer` | `/buyer/*` |

### 2.1 Halaman Login — `/login`
*(tidak ada di screenshot — didesain mengikuti kebutuhan role-based auth di atas)*

- Satu form: input **Email/Username**, input **Password**, checkbox "Ingat saya", tombol primary **"Masuk"**.
- Setelah submit, backend mengembalikan data user + `role`. Frontend redirect otomatis sesuai tabel di atas.
- Pesan error jika gagal: "Email/username atau password salah."
- Link tambahan (opsional, lihat §12): "Daftar sebagai Pembeli" dan "Daftar sebagai Penjual".

### 2.2 Route Guard
- Bungkus setiap grup halaman dengan `RoleGuard` (mis. `<RoleGuard allow="admin">`).
- Belum login → redirect ke `/login`.
- Login tapi role tidak cocok dengan prefix rute yang diakses → redirect ke halaman "403 / Tidak diizinkan" atau kembali ke dashboard sesuai role-nya.
- Simpan `token` + `role` di auth state (Context/store) agar bisa dipakai di seluruh app.

### 2.3 Logout
Tersedia di semua layout:
- Admin/Penjual: tombol logout di footer sidebar (dekat kartu profil user).
- Pembeli: dropdown dari avatar/ikon akun di topbar.
- Aksi: clear session → redirect `/login`.

---

## 3. Design System

Warna berikut diambil langsung (color-picked) dari screenshot, bukan tebakan — supaya hasil implementasi konsisten dengan desain asli.

### 3.1 Palet Warna

| Token | Hex | Dipakai untuk |
|---|---|---|
| `primary` (orange/coral) | `#EB5E28` | tombol utama ("+ Tambah Penjual", "+ Tambah", "+ Keranjang"), teks & ikon menu aktif di sidebar, highlight penting |
| `primary-hover` | `#D6531F` *(estimasi, sedikit lebih gelap)* | hover state tombol primary |
| `success` (hijau) | teks `#16A34A` / bg `#DCF1E4` | status "Aktif", "Terkirim", "Sehat"; tren positif |
| `info` (biru langit) | teks `#0EA5E9` / bg `#DFF2FD` | status "Dikirim" |
| `warning` (oranye) | teks `#F97316` / bg `#FEEADC` | status "Diproses"; ikon peringatan stok rendah |
| `pending` (amber) | teks `#D97706` / bg `#FBEBD0` | status "Menunggu" / "Perlu Konfirmasi"; card highlight |
| `danger` (merah) | teks `#DC2626` / bg `#FEE2E2` *(estimasi, mengikuti pola warna lain)* | status "Dikembalikan", "Habis Stok", "Nonaktif" |
| `neutral-900` | `#111827` | judul halaman, teks utama |
| `neutral-700` | `#374151` | label menu tidak aktif |
| `neutral-500` | `#6B7280` | teks sekunder / caption |
| `neutral-200` | `#E5E7EB` | border, garis pemisah baris tabel |
| `neutral-50` | `#F9FAFB` | background halaman di luar card |
| `white` | `#FFFFFF` | background sidebar, card, header |

> Catatan penting soal warna tren: arah panah **tidak selalu** hijau = naik / merah = turun. Warnanya mengikuti **makna bisnis**. Contoh: "Tingkat Retur turun 0,4%" tetap diwarnai **hijau** karena retur turun itu bagus, sementara "Nilai Rata-rata Pesanan turun 2,1%" diwarnai **merah**. Pastikan logic-nya per-metrik, bukan asal ikut arah panah.

### 3.2 Tipografi
- Font sans-serif modern (mis. Inter / Plus Jakarta Sans).
- Judul halaman (H1, contoh "Overview Dashboard"): ~24–28px, bold, `neutral-900`.
- Subtitle halaman (contoh "Pantau semua aspek toko Anda hari ini"): ~14px, regular, `neutral-500`.
- Angka besar pada stat card: ~28–32px, bold.
- Label uppercase kecil pada stat card (contoh "REVENUE HARI INI"): ~11–12px, letter-spacing lebar, `neutral-500`.
- Teks body/tabel: 14px regular.

### 3.3 Layout & Elevation
- Card: bg putih, radius besar (`rounded-xl`/`2xl`, ±12–16px), border tipis `neutral-200` atau shadow lembut, padding ±20–24px.
- Grid stat card: 4 kolom desktop → 2 kolom tablet → 1 kolom mobile.
- Badge status: bentuk pill (`rounded-full`), dot kecil solid + teks warna sama, background tint pucat dari warna yang sama.
- Progress bar: track `neutral-200`, fill `primary` atau `pending`, `rounded-full`, tinggi ±8px.

### 3.4 Ikon
Gaya line-icon (mis. Lucide/Feather), stroke ±1.5–2px, ukuran 16–20px.

---

## 4. Komponen UI Bersama

| Komponen | Deskripsi | Dipakai di |
|---|---|---|
| `StatCard` | Label uppercase kecil, ikon kanan-atas, angka besar, caption, badge tren (panah + %) | Semua dashboard |
| `DataTable` | Tabel dengan header sortable (↕), badge status, pagination, search | Pesanan, Manajemen Penjual, Produk, dst |
| `StatusBadge` | Pill dot + label sesuai palet semantic | Semua status di tabel |
| `TrendChart` | Line/area chart dengan tooltip per titik saat hover, opsional garis target | Revenue trend (harian/mingguan/bulanan) |
| `DonutChart` + `Legend` | Donut multi-warna + daftar (dot, label, angka, %) | Distribusi Status Pesanan |
| `HorizontalBarList` | Item dengan bar horizontal proporsional | Metode Pembayaran, Top Produk |
| `FilterChips` | Deretan pill kategori, satu aktif (bg orange) sisanya outline | Produk & Inventaris |
| `SegmentedControl` | Toggle group (mis. Harian / Mingguan / Bulanan) | Tren Revenue |
| `Sidebar` | Navigasi vertikal grouped, badge angka, item aktif orange | Shell Admin & Penjual |
| `TopHeader` | Judul + subtitle, indikator "● Diperbarui HH:MM", badge tanggal, search global, tombol refresh | Shell Admin & Penjual |
| `ProductCard` | Gambar, nama toko, nama produk, rating, harga, tombol "+ Keranjang" | Katalog Pembeli |
| `UserFooterCard` | Avatar inisial + nama + label role, di footer sidebar | Shell Admin & Penjual |

---

## 5. Layout Shell per Role

### 5.1 Admin & Penjual — Sidebar Layout
- **Kiri (sidebar, fixed):** logo brand → section menu (isi berbeda per role, lihat §6/§7) → section Notifikasi & Pengaturan → footer `UserFooterCard` (avatar, nama, label role, logout).
- **Kanan (top header, konsisten di semua halaman):**
  - Kiri: judul halaman (H1) + subtitle deskriptif.
  - Kanan: dot hijau "● Diperbarui HH:MM", badge tanggal "📅 20 Agu 2026", search bar "🔍 Cari produk, pesanan...", tombol refresh (↻).

### 5.2 Pembeli — Topbar Layout (tanpa sidebar)
- Navbar atas: logo/nama toko di kiri; search bar "🔍 Cari produk...", ikon pesanan saya, ikon keranjang (+ badge jumlah item) di kanan.
- Konten full-width, grid produk responsif, tanpa sidebar.

---

## 6. ROLE: ADMIN

**Prefix rute:** `/admin` · **Redirect setelah login:** `/admin/dashboard`

**Isi sidebar MENU (Admin):**
- Dashboard (`/admin/dashboard`)
- *(lihat rekomendasi pengembangan di §12 untuk halaman admin lanjutan)*
- Notifikasi, Pengaturan (di bagian bawah)

### 6.1 Halaman: Admin Dashboard — `/admin/dashboard`
*(sumber: screenshot "Admin Dashboard", route asli `/admin`)*

**Judul:** "Admin Dashboard" · **Subtitle:** "Monitoring platform & manajemen penjual"

**A. Stat card (4 kolom)**

| Kartu | Ikon | Contoh angka | Caption | Tren |
|---|---|---|---|---|
| Total Penjual | toko | 5 | "3 aktif" | ↗ 25% |
| Total Pembeli | users | 1.247 | "Total pembeli terdaftar" | ↗ 18,3% |
| Total Pesanan | cart | 829 | "semua waktu" | ↗ 8,7% |
| Revenue Bulan Ini | trending-up | Rp 48,3jt | "Agustus 2026" | ↗ 12,4% |

**B. Revenue Platform** (chart, ±2/3 lebar)
Judul + subtitle "6 bulan terakhir" + badge hijau "+12,4% MoM" di kanan atas. Line/area chart 6 titik bulan (Mar–Agu) dengan garis orange & area fill gradasi tipis. Tooltip on-hover contoh: "Jun · Revenue: Rp 38,9jt".

**C. Status Pesanan** (donut, ±1/3 lebar)
Judul + subtitle "Distribusi saat ini". Donut chart + legend: Terkirim 412, Dikirim 187, Diproses 143, *(data lain kemungkinan terpotong di screenshot — lengkapi proporsional hingga total = total pesanan platform)*.

**D. Manajemen Penjual** (tabel, full width)
- Header "Manajemen Penjual" + subtitle "5 penjual terdaftar".
- Kanan atas: search "Cari penjual..." + tombol primary **"+ Tambah Penjual"**.
- Kolom: **Penjual** (avatar inisial 2 huruf berwarna + nama toko bold + nama pemilik di bawahnya), **Kategori**, **Produk** (jumlah), **Pesanan** (jumlah), **Status** (badge: Aktif=hijau / Menunggu=amber / Nonaktif=merah), **Aksi** (ikon ⋮ → Lihat Detail / Edit / Nonaktifkan-Aktifkan / Hapus).
- Contoh data:
  - Batik Nusantara (Rina Kusumawati) — Fashion & Batik — 24 produk — 187 pesanan — **Aktif**
  - Sneaker Lokal ID (Dimas Prasetyo) — Sepatu & Aksesori — 18 produk — 241 pesanan — **Aktif**
  - Tas Cantik Store (Sari Dewi) — Tas & Dompet — 31 produk — 312 pesanan — **Aktif**
  - Elektronik Murah (Budi Hartono) — Elektronik — 0 produk — 0 pesanan — **Menunggu**
  - Kosmetik Natural (Mega Lestari) — Kecantikan — 12 produk — 89 pesanan — **Nonaktif**

> Status "Menunggu" pada toko yang belum punya produk/pesanan kemungkinan besar berarti akun baru mendaftar dan menunggu persetujuan Admin — lihat rekomendasi alur approve/reject di §12.

---

## 7. ROLE: PENJUAL (SELLER)

**Prefix rute:** `/seller` · **Redirect setelah login:** `/seller/dashboard`

**Isi sidebar MENU (Penjual):**
- Dashboard (`/seller/dashboard`)
- Sales & Revenue (`/seller/sales-revenue`)
- Produk & Inventaris (`/seller/products-inventory`) — badge angka (jumlah stok rendah, contoh: `4`)
- Notifikasi (badge unread, contoh: `3`), Pengaturan
- Footer: `UserFooterCard` — avatar "N", nama pemilik toko (contoh "Budi Santoso"), label "Pemilik Toko"

> **Catatan penggabungan konten:** di desain asli, ringkasan performa toko tersebar di 2 layar berbeda ("Dashboard Penjual" & "Overview Dashboard") yang isinya saling melengkapi (keduanya sama-sama dashboard ringkasan milik penjual yang login). Di bawah ini digabung jadi satu halaman Dashboard yang utuh, ditandai sumber aslinya masing-masing.

### 7.1 Halaman: Dashboard Penjual — `/seller/dashboard`
*(sumber: "Dashboard Penjual" route asli `/seller` + "Overview Dashboard" route asli `/`)*

**Judul:** "Dashboard Penjual" · **Subtitle dinamis:** `"{Nama Toko} — Kelola produk & pesanan Anda"` (contoh: "Batik Nusantara — Kelola produk & pesanan Anda")

**A. Stat card utama (4 kolom)** — dari "Dashboard Penjual"

| Kartu | Contoh angka | Tren |
|---|---|---|
| Total Produk | 2 | — |
| Pesanan Masuk | 2 | ↗ 9,4% |
| Perlu Konfirmasi | 1 | — |
| Revenue Bulan Ini | Rp 12,4jt | ↗ 15,2% |

**B. Ringkasan Hari Ini** — dari "Overview Dashboard"
- Revenue Hari Ini (contoh Rp11,5jt) dengan target harian (Rp12jt) + progress bar % + tren vs kemarin.
- Total Pesanan hari ini + tren.
- Nilai Rata-rata Pesanan + tren (ingat: warna tren ikuti makna bisnis, lihat §3.1).
- 3 kartu highlight bg kuning pucat: **Pesanan Menunggu** ("perlu diproses segera"), **Produk Stok Rendah** ("perlu reorder"), **Pelanggan Baru** (+tren).

**C. Chart Revenue Mingguan** — dari "Dashboard Penjual"
Judul + subtitle "7 minggu terakhir" + badge hijau "+15,2%". Line/area chart 7 titik minggu (W1 Jul–W3 Agu). Tooltip contoh: "W3 Jul · Revenue: Rp 2,6jt". *(Varian dari Overview Dashboard: "Tren Revenue 30 Hari" dengan toggle "30 Hari" — bisa dijadikan filter periode pada chart yang sama.)*

**D. Chart Akuisisi Pelanggan** — dari "Overview Dashboard"
*(judul terlihat di screenshot, isi chart terpotong saat scroll — tipe data belum sepenuhnya tervalidasi; disarankan bar/line perbandingan pelanggan baru vs pelanggan berulang per periode)*

**E. Tab Produk / Pesanan** — dari "Dashboard Penjual"
Tab pill: **"Produk (n)"** (aktif, orange) / **"Pesanan (n)"**. Kanan atas: search "Cari..." + tombol primary **"+ Tambah"**.

- **Tab Produk** — kolom: Produk (thumbnail bulat + nama bold + kategori kecil di bawahnya), Harga, Stok, Terjual, Status (badge "Aktif"), Aksi (ikon pensil = edit, ikon tempat sampah = hapus).
  Contoh: Kemeja Batik Parang Premium (Atasan Pria) — Rp285.000 — Stok 48 — Terjual 142 — Aktif; Dress Batik Mega Mendung (Atasan Wanita) — Rp375.000 — Stok 22 — Terjual 68 — Aktif.
- **Tab Pesanan** — *(kolom tidak sepenuhnya tertangkap di screenshot; disarankan mengikuti pola tabel "Pesanan Terbaru" di poin F: Order ID, Pembeli, Produk, Jumlah, Metode, Tanggal, Status dengan dropdown ubah status)*

**F. Pesanan Terbaru** — dari "Overview Dashboard" (8 pesanan terbaru)
Kolom: **Order ID** (`#ORD-xxxx`), **Pelanggan**, **Produk**, **Jumlah** (Rp), **Metode** (Transfer Bank/GoPay/OVO/QRIS/COD/Dana), **Tanggal**, **Status** (badge dot + label + chevron dropdown untuk update status: Menunggu → Diproses → Dikirim → Terkirim, atau Dikembalikan).

**G. Stok Hampir Habis** — dari "Overview Dashboard"
Header + link **"Kelola ↗"** di kanan. List card bg kuning pucat: nama produk (bold) + kategori kecil, badge **"X sisa"** (orange, kanan atas), progress bar (sisa vs threshold), caption "Threshold: N unit".
Contoh: Blouse Tenun Ikat (Atasan Wanita) — 3 sisa — Threshold 10 unit; Jaket Denim Vintage (Outerwear) — 2 sisa — Threshold 8 unit; Sandal Kulit Pria (Sepatu) — 5 sisa — Threshold 15 unit; Topi Bucket Canvas (Aksesori) — 1 sisa.

**H. Top Produk (30 Hari)** — dari "Overview Dashboard"
Header + caption "berdasarkan revenue". List rank 1–5: nomor urut, nama produk, revenue (bold, kanan), caption "N terjual", mini progress bar proporsional.
Contoh: 1. Kemeja Batik Premium — Rp40,5jt — 142 terjual; 2. Tas Kulit Wanita — Rp52,2jt — 87 terjual; 3. Sepatu Sneakers Lokal — Rp33,5jt — 73 terjual; 4. Dress Batik Modern — Rp25,5jt — 68 terjual; 5. Celana Chino Slim Fit — Rp13,4jt — 61 terjual.

---

### 7.2 Halaman: Sales & Revenue Analytics — `/seller/sales-revenue`
*(sumber: route asli `/sales-revenue-analytics`)*

**Judul:** "Sales & Revenue Analytics" · **Subtitle:** "Analisis mendalam tren penjualan dan pendapatan toko"

**A. Stat card (4 kolom)**

| Kartu | Contoh | Caption | Tren |
|---|---|---|---|
| Revenue Bulan Ini | Rp347,2jt | "Agustus 2026" | ↗ +14,3% vs Juli |
| Total Pesanan | 1.284 | "Agustus 2026" | ↗ +9,7% vs Juli |
| Nilai Rata-rata Pesanan | Rp270rb | "Per transaksi" | ↗ +4,2% vs Juli |
| Tingkat Retur | 2,9% | "14 pesanan dikembalikan" | ↘ -0,4% vs Juli *(hijau — retur turun = baik)* |

**B. Progress Target Revenue Bulanan**
"Target: Rp400jt · Tercapai: Rp347,2jt" (kiri), "86,8% dari target" (kanan, besar). Progress bar full-width dengan label ujung kiri "Rp0", tengah "Sisa: Rp52,8jt dalam 11 hari", ujung kanan "Rp400jt".

**C. Tren Revenue**
Header "Tren Revenue" + caption "Total Rp323,4jt · 1.268 pesanan". `SegmentedControl` kanan atas: **Harian** (aktif) / Mingguan / Bulanan. Chart line/area di bawahnya.

**D. Baris 3 panel**
- **Revenue per Kategori** — subtitle "Agustus 2026" — chart bar per kategori produk *(isi terpotong di screenshot)*
- **Tren Nilai Rata-rata Pesanan** — subtitle "Target AOV: Rp300rb" — chart line dengan garis target *(isi terpotong di screenshot)*
- **Distribusi Status Pesanan** — subtitle "484 total pesanan" — donut + legend: Terkirim 312 (64%), Dikirim 87 (18%), Diproses 43 (9%), Menunggu 28 (6%), Dikembalikan 14 (3%)

**E. Metode Pembayaran**
Subtitle "Distribusi revenue per metode". `HorizontalBarList`: Transfer Bank Rp124,3jt (32,1%), GoPay Rp87,6jt (22,6%), OVO Rp64,2jt (16,6%), QRIS Rp52,8jt (13,6%) — *(data terpotong; lengkapi metode lain seperti Dana/COD hingga total 100%)*.

**F. Pesanan Nilai Tinggi**
Header + caption "8 pesanan". Kolom (sortable ↕ pada beberapa kolom): Order ID, Pelanggan, Produk, Kategori, **Jumlah ↕** (Rp, bold), **Margin ↕** (%, hijau), Metode, **Tanggal ↕**, Status.
Contoh: `#ORD-8799` — Maharani Putri — Tas Kulit Wanita ×3 — Aksesori — Rp1.800.000 — 48,3% — Transfer Bank — 18/08/2026 — Terkirim.

---

### 7.3 Halaman: Produk & Inventaris — `/seller/products-inventory`
*(sumber: route asli `/products-inventory`)*

**Judul:** "Produk & Inventaris" · **Subtitle:** "Kelola stok, pantau performa produk, dan reorder tepat waktu"

**A. Stat card (4 kolom, 2 di antaranya highlighted)**

| Kartu | Contoh | Caption | Style |
|---|---|---|---|
| Total SKU Aktif | 247 | "12 kategori produk" · ↗ +3,4% vs bulan lalu | putih |
| Stok Rendah | 4 | "Di bawah threshold reorder" | **bg amber pucat** |
| Habis Stok | 2 | "Perlu restok segera" | **bg merah pucat** |
| Nilai Inventaris | Rp284,7jt | "Total nilai stok saat ini" · ↘ -2,1% vs bulan lalu | putih |

**B. Filter & Tabel Produk**
- `FilterChips` kategori (scroll horizontal): **Semua** (aktif) · Aksesori · Atasan Pria · Atasan Wanita · Bawahan Pria · Bawahan Wanita · Outerwear · Sepatu
- Tombol ikon search + dropdown filter **"Semua Status"** + caption jumlah "12 produk" (kanan)
- Kolom tabel: checkbox (bulk select), **Nama Produk ↕** (ikon kotak + nama bold), **SKU**, **Kategori**, **Harga Jual ↕**, **HPP** (harga pokok, dengan caption **Margin X%** warna hijau di bawah harga), **Stok ↕**, **Terjual (30h) ↕**, **Revenue (30h) ↕**, kolom aksi *(terpotong di screenshot — sediakan minimal ikon edit/hapus/lihat detail)*
- Contoh baris: Tas Kulit Wanita — `SKU-AKS-008` — Aksesori — Rp600.000 — HPP Rp280.000 (Margin 53%) — Stok 24 unit — Terjual 87 — Revenue Rp52,2jt
- Pagination: dropdown "Tampilkan [10 ▾]" + caption "dari 12 produk · halaman 1 dari 2" (kiri), tombol ‹ 1 2 › (kanan)

**C. Kesehatan Stok**
Subtitle "Distribusi 247 SKU". Legend: Sehat 233 (94,3%, dot hijau) · Rendah 4 (1,6%, dot amber) · Habis 2 (0,8%, dot merah) · Lambat 8 (3,2%, dot abu — *slow moving stock*).

**D. Saran Reorder**
Header + caption "4 produk". List card: nama produk (bold) + kategori kecil, caption "N unit · Rp[harga]rb", badge **"Sisa N"** (orange, kanan atas), tombol **"🛒 Reorder"** (kanan bawah).
Contoh: Blouse Tenun Ikat (Atasan Wanita) — 30 unit · Rp264rb — Sisa 3 — [Reorder]; Jaket Denim Vintage — Sisa 2 — [Reorder].

---

## 8. ROLE: PEMBELI (BUYER)

**Prefix rute:** `/buyer` · **Redirect setelah login:** `/buyer`

### 8.1 Halaman: Katalog / Toko — `/buyer`
*(sumber: screenshot "Toko Nusantara", route asli `/buyer`)*

**A. Topbar**
- Kiri: ikon 🛍️ + nama toko "Toko Nusantara" (bold)
- Kanan: search bar pill "🔍 Cari produk...", ikon kotak (kemungkinan "Pesanan Saya"), ikon keranjang 🛒 (+ badge jumlah item saat > 0)

**B. Grid Produk**
Grid responsif 3 kolom desktop (2 kolom tablet, 1 kolom mobile). `ProductCard`: gambar produk (rasio persegi, rounded besar), nama toko kecil abu-abu di atas judul, nama produk (bold), rating ⭐ + jumlah ulasan (contoh "4,8 (87)"), harga (bold, orange), tombol **"+ Keranjang"** (pill orange, kanan bawah).

Contoh produk: "Kemeja Batik Parang Premium" — Batik Nusantara — ⭐4,8 (87) — Rp285.000; "Dress Batik Mega Mendung" — Batik Nusantara — ⭐4,6 (43) — Rp375.000; "Sneakers Canvas Lokal Putih" — Sneaker Lokal ID — ⭐4,7 (56) — Rp459.000.

> Hanya 1 baris grid yang tertangkap di screenshot (grid berlanjut ke bawah). Terapkan pagination atau infinite scroll.

---

## 9. Peta Rute Lengkap

| Rute baru | Role | Deskripsi | Rute asli di screenshot |
|---|---|---|---|
| `/login` | Publik | Login terpadu, redirect otomatis sesuai role | *(tidak ada di screenshot)* |
| `/admin/dashboard` | Admin | Monitoring platform & manajemen penjual | `/admin` |
| `/seller/dashboard` | Penjual | Ringkasan performa toko + kelola cepat produk/pesanan | `/seller` + `/` |
| `/seller/sales-revenue` | Penjual | Analitik penjualan & revenue mendalam | `/sales-revenue-analytics` |
| `/seller/products-inventory` | Penjual | Kelola produk & stok | `/products-inventory` |
| `/buyer` | Pembeli | Katalog/toko, belanja produk | `/buyer` |

---

## 10. Struktur Folder Frontend yang Disarankan

```
frontend/
├─ src/
│  ├─ pages/
│  │  ├─ auth/
│  │  │  └─ Login.jsx
│  │  ├─ admin/
│  │  │  └─ AdminDashboardPage.jsx
│  │  ├─ seller/
│  │  │  ├─ SellerDashboardPage.jsx
│  │  │  ├─ SalesRevenueAnalyticsPage.jsx
│  │  │  └─ ProductsInventoryPage.jsx
│  │  └─ buyer/
│  │     └─ StorefrontPage.jsx
│  ├─ layouts/
│  │  ├─ AdminLayout.jsx        # sidebar shell
│  │  ├─ SellerLayout.jsx       # sidebar shell
│  │  └─ BuyerLayout.jsx        # topbar shell
│  ├─ components/
│  │  ├─ shared/    # StatCard, DataTable, StatusBadge, TrendChart,
│  │  │             # DonutChart, HorizontalBarList, FilterChips,
│  │  │             # SegmentedControl, Pagination
│  │  ├─ admin/     # SellerManagementTable
│  │  ├─ seller/    # LowStockList, TopProductsList, ProductTable, OrderTable
│  │  └─ buyer/     # ProductCard, ProductGrid
│  ├─ routes/
│  │  ├─ AppRouter.jsx
│  │  └─ RoleGuard.jsx
│  ├─ context/               # AuthContext: user, role, login(), logout()
│  └─ services/               # authApi, adminApi, sellerApi, buyerApi
```

---

## 11. Model Data Tersirat

Field-field berikut disimpulkan dari data yang tampil di UI — berguna sebagai acuan awal tipe/interface di frontend.

- **User/Account** — `id`, `name`, `email/username`, `passwordHash`, `role (admin|seller|buyer)`, `avatarInitial`
- **Store (Toko)** — `id`, `ownerId (User)`, `storeName`, `category`, `status (aktif|menunggu|nonaktif)`, `createdAt`
- **Product** — `id`, `storeId`, `name`, `sku`, `category`, `sellPrice`, `costPrice (HPP)`, `stock`, `reorderThreshold`, `sold30d`, `revenue30d`, `status`, `imageUrl`
- **Order** — `id (#ORD-xxxx)`, `buyerId`, `items[]`, `totalAmount`, `paymentMethod (transfer_bank|gopay|ovo|qris|dana|cod)`, `status (menunggu|diproses|dikirim|terkirim|dikembalikan)`, `createdAt`
- **OrderItem** — `orderId`, `productId`, `qty`, `price`
- **Category** — `id`, `name`

---

## 12. Catatan, Asumsi & Rekomendasi Lanjutan

**Asumsi yang dibuat saat menyusun dokumen ini:**
1. Pada desain asli, halaman "Overview Dashboard", "Sales & Revenue Analytics", dan "Produk & Inventaris" tampil dalam satu sidebar bersama "Admin Dashboard" — ini kemungkinan besar hanya untuk keperluan demo/preview di canvas Rocket AI (semua halaman diakses dari satu app). Karena isinya membahas *"toko Anda"* dan data SKU milik satu toko spesifik, ketiga halaman tersebut dikelompokkan ke role **Penjual**, bukan Admin.
2. "Dashboard Penjual" dan "Overview Dashboard" digabung jadi satu halaman `/seller/dashboard` karena keduanya sama-sama dashboard ringkasan milik penjual yang sedang login (lihat §7.1 untuk pemetaan sumbernya).
3. Halaman Login tidak ada di screenshot — didesain dari nol mengikuti kebutuhan role-based auth yang kamu jelaskan.

**Halaman/alur yang belum tercakup di screenshot, direkomendasikan untuk dilengkapi:**
- **Pembeli:** halaman detail produk, keranjang belanja, checkout, riwayat/tracking pesanan, profil & alamat pembeli, wishlist.
- **Penjual:** isi lengkap tabel di tab "Pesanan" pada dashboard (kolom belum sepenuhnya tertangkap di screenshot), halaman detail pesanan, form tambah/edit produk.
- **Admin:** halaman "Lihat Detail" penjual, alur approve/reject untuk penjual berstatus "Menunggu", manajemen pembeli, laporan platform.
- Beberapa chart terpotong di screenshot karena posisi scroll ("Akuisisi Pelanggan", "Revenue per Kategori", "Tren Nilai Rata-rata Pesanan") — tipe chart di dokumen ini adalah estimasi terbaik berdasarkan konteks judul & data di sekitarnya, sebaiknya dikonfirmasi ulang saat implementasi.
