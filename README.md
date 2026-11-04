# Maduraa

## Struktur Repository

- `client/` — aplikasi frontend React, TypeScript, dan Vite.
- `server/` — API backend Node.js dan Express.
- `docs/` — dokumentasi arsitektur, API, dan database.

Konfigurasi npm dan Vite berada di root repository. Jalankan `npm run dev` atau `npm run build` dari root untuk frontend. Jalankan backend dengan `cd server` lalu `npm run dev` (atau `npm start`). File environment frontend berada di root; gunakan `client/.env.example` sebagai acuan. File environment backend berada di `server/`; gunakan `server/.env.example` sebagai acuan.

## Autentikasi dan Mode Prototype

Salin `client/.env.example` menjadi `.env.local` di root repository untuk development. Atur `VITE_AUTH_MODE=prototype` untuk menggunakan form Login/Registrasi email dan password dengan mock authentication yang hanya aktif saat development. Session prototype hanya menyimpan identitas (nama dan email) di `sessionStorage`; password tidak pernah disimpan. Produk, kategori, transaksi, keranjang, dan profil warung disimpan di `sessionStorage` tab yang sama.

Mode prototype tidak mengirim request ke Supabase atau backend dan otomatis dinonaktifkan pada production build. Production selalu memilih Supabase Auth terlepas dari nilai `VITE_AUTH_MODE`.

Untuk konfigurasi Supabase Auth, atur `VITE_AUTH_MODE=supabase`, `VITE_SUPABASE_URL`, dan salah satu public key: `VITE_SUPABASE_PUBLISHABLE_KEY` atau `VITE_SUPABASE_ANON_KEY`. Ambil nilainya hanya dari project Supabase yang memang terhubung dengan Maduraa. Frontend hanya boleh menggunakan publishable/anon key; jangan pernah menggunakan `service_role`. Jika Supabase belum dikonfigurasi, Login, Registrasi, dan pemulihan session menampilkan pesan konfigurasi.

Supabase data adapter belum dihubungkan karena schema data dan kebijakan RLS aplikasi belum diverifikasi. Adapter prototype dan interface data dipisahkan agar integrasi schema terverifikasi dapat dilakukan tanpa merombak form autentikasi dan komponen fitur.

Backend Express masih memiliki endpoint autentikasi JWT lama dan route API yang memvalidasi token tersebut. Frontend saat ini tidak memanggil endpoint itu; jangan mencampur token backend dengan session Supabase. Jika route API tersebut akan dipakai oleh frontend, verifikasi token Supabase dan pemetaan user perlu ditangani sebagai perubahan backend terpisah sebelum integrasi data.

Dev tim:

Nenglia Fitri (Project Leader)

Srefi Noor Diana (Frontend)

Moh.alfan Setya Sudarita (backend)

Sistem Pencatatan Omzet Toko Madura adalah aplikasi berbasis web yang dikembangkan menggunakan React, TypeScript, dan Vite.

Toko Madura merupakan salah satu jenis usaha ritel yang memiliki aktivitas operasional seperti pengelolaan produk, pencatatan transaksi, pemantauan stok, serta perhitungan omzet dan keuntungan.

Dalam proses pencatatan yang masih dilakukan secara manual, terdapat beberapa kendala yang dapat terjadi, seperti:

- Pencatatan transaksi yang belum terstruktur.
- Kesulitan dalam memantau omzet penjualan.
- Kesulitan mengetahui jumlah stok produk secara cepat.
- Risiko kesalahan dalam pencatatan transaksi.
- Kesulitan mengetahui produk yang paling banyak terjual.
- Kesulitan mengetahui produk yang memiliki stok menipis.
- Perhitungan omzet dan estimasi keuntungan yang masih dilakukan secara manual.
- Data produk, kategori, stok, dan transaksi belum terintegrasi dalam satu sistem.

Berdasarkan permasalahan tersebut, Sistem Pencatatan Omzet Toko Madura dikembangkan sebagai aplikasi pencatatan omzet berbasis web yang mengintegrasikan pengelolaan produk, kategori, stok, transaksi, dan laporan penjualan dalam satu platform.

Dengan adanya sistem ini, proses pencatatan dan monitoring aktivitas penjualan dapat dilakukan secara lebih terstruktur dan mudah dipantau.


---

## Teknologi yang Digunakan

Project ini menggunakan teknologi berikut:

- React
- TypeScript
- Vite
- React Router DOM
- Supabase
- Lucide React
- CSS

---

# Fitur MVP

## Authentication

- Login
- Logout
- Session management
- Proteksi halaman Dashboard

## Dashboard

- Omzet hari ini
- Omzet bulan ini
- Jumlah transaksi
- Estimasi keuntungan
- Produk terlaris
- Produk dengan stok menipis

## Produk

- Tambah produk
- Lihat produk
- Edit produk
- Hapus produk
- Harga beli
- Harga jual
- Stok
- Satuan
- Kategori
- Foto produk

## Kategori

- Tambah kategori
- Lihat kategori
- Edit kategori
- Hapus kategori

## Transaksi

- Pilih produk
- Masukkan jumlah produk
- Menghitung subtotal
- Menghitung total transaksi
- Menyimpan transaksi
- Mengurangi stok secara otomatis

## Laporan

- Laporan harian
- Laporan mingguan
- Laporan bulanan
- Filter berdasarkan tanggal
- Omzet
- Estimasi keuntungan

---

# Arsitektur Sistem

                         ┌───────────────┐
                         │     Figma     │
                         │   UI / UX     │
                         └───────┬───────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   React + TypeScript   │
                    │         + Vite         │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      Tailwind CSS      │
                    │       UI Styling       │
                    └────────────┬───────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │              Supabase                │
              │                                     │
              │  ┌─────────────┐  ┌─────────────┐  │
              │  │ Supabase    │  │ PostgreSQL  │  │
              │  │ Auth        │  │ Database    │  │
              │  └─────────────┘  └─────────────┘  │
              │                                     │
              │  ┌─────────────┐  ┌─────────────┐  │
              │  │   Storage   │  │     RLS     │  │
              │  │             │  │             │  │
              │  └─────────────┘  └─────────────┘  │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │    Vercel     │
                         │   Deployment  │
                         └───────────────┘
```

## Persyaratan

Sebelum menjalankan project, pastikan komputer sudah memiliki:

- Node.js
- npm
- Git
- Visual Studio Code

Untuk memeriksa apakah Node.js dan npm sudah terinstall:

```bash
node -v
npm -v
