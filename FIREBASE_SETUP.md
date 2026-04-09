# Setup Sistem Penyimpanan Hybrid

## Arsitektur Penyimpanan

Aplikasi ini menggunakan sistem penyimpanan **hybrid**:

### Data yang Disimpan di Firebase (Cloud):
- ✅ **Absensi** (`attendance`) - Data kehadiran siswa
- ✅ **Kode Akses** (`access_codes`) - Kode absensi harian
- ✅ **Password Admin** (`admin_password`) - Password administrator

### Data yang Disimpan di Local Storage (Browser):
- ✅ **Anggota OSIS** (`local_members`) - Data anggota
- ✅ **Struktur OSIS** (`local_osis_structure`) - Data struktur organisasi + foto
- ✅ **Foto Profil** (`local_photos`) - Foto dalam format data URL

## Keuntungan Sistem Hybrid:

1. **Data Absensi Tetap Aman di Cloud** - Bisa diakses dari device mana saja
2. **Data Anggota & Foto Local** - Lebih cepat, offline-friendly, tidak perlu Firebase Storage
3. **Permanent & Shared** - Ketika dijalankan dengan Live Server, data tersimpan di browser semua pengguna
4. **Lebih Efisien** - Tidak perlu upload foto ke cloud storage

## Setup Firebase (Hanya untuk Absensi)

### 1. Buat Proyek Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Create a project" atau "Tambah proyek"
3. Masukkan nama proyek (contoh: "absensi-osis-singaparna")
4. Ikuti langkah-langkah setup

### 2. Aktifkan Firestore
1. Di menu sebelah kiri, klik "Firestore Database"
2. Klik "Create database"
3. Pilih "Start in test mode" (untuk development)
4. Pilih lokasi (contoh: asia-southeast1)

### 3. Dapatkan Konfigurasi Firebase
1. Klik ikon gear (settings) > "Project settings"
2. Scroll ke bawah ke bagian "Your apps"
3. Klik ikon web (</>) untuk menambah web app
4. Masukkan nama app (contoh: "Absensi OSIS Web")
5. Copy konfigurasi yang diberikan

### 4. Update Konfigurasi di File HTML
Ganti bagian `firebaseConfig` di **semua file HTML** dengan konfigurasi Anda:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...g", // Ganti dengan API key Anda
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**File yang perlu diupdate:**
- index.html
- admin-dashboard.html
- admin-members.html
- admin-edit-attendance.html
- admin-set-code.html
- admin-login.html
- recap.html
- recap-detail.html

**Catatan:** admin-osis-structure.html sudah tidak menggunakan Firebase Storage lagi.

## Menjalankan Aplikasi

### Menggunakan Live Server (Recommended)
1. Install extension **Live Server** di VS Code
2. Klik kanan pada `index.html` > "Open with Live Server"
3. Atau gunakan terminal: `npx live-server --port=3000`

### Menggunakan Python Server
```bash
cd path/to/project
python -m http.server 8000
```

## Cara Kerja Data Sharing

Ketika aplikasi dijalankan dengan **Live Server** atau web server lokal:

1. **Data Local Storage** akan tersimpan di browser setiap pengguna
2. **Data Firebase** akan disinkronkan ke cloud dan bisa diakses semua pengguna
3. **Foto** disimpan sebagai data URL di local storage browser
4. Semua pengguna yang mengakses aplikasi dari server yang sama akan melihat data yang sama

## Backup & Restore Data

### Export Data
```javascript
// Di browser console
Storage.exportData().then(data => console.log(JSON.stringify(data)))
```

### Import Data
```javascript
// Di browser console
const data = {/* data dari export */};
Storage.importData(data);
```

## Troubleshooting

### Error "Firebase belum dikonfigurasi"
- Pastikan konfigurasi Firebase sudah diupdate di semua file HTML
- Periksa console browser untuk error konfigurasi

### Foto tidak tersimpan
- Pastikan menggunakan Live Server atau web server lokal
- Cek localStorage di browser DevTools > Application > Local Storage

### Data tidak sinkron antar device
- Data absensi akan tersimpan di Firebase dan sinkron otomatis
- Data anggota & struktur hanya tersimpan di browser masing-masing pengguna

## Keamanan

- **Development:** Gunakan test mode untuk Firestore
- **Production:** Ubah Firestore rules menjadi lebih ketat
- **Local Data:** Aman karena hanya tersimpan di browser pengguna

---

**Sistem ini memungkinkan data tetap permanent dan shared antar pengguna tanpa perlu Firebase Storage untuk foto!** 🎉
- index.html
- admin-dashboard.html
- admin-members.html
- admin-edit-attendance.html
- admin-osis-structure.html
- admin-set-code.html
- admin-login.html
- profil-osis.html
- recap.html
- recap-detail.html

### 6. Test Aplikasi
1. Buka aplikasi di browser
2. Login sebagai admin
3. Tambahkan anggota atau data
4. Buka link di perangkat berbeda
5. Data sekarang harus tersedia di semua perangkat

## Keamanan
- Untuk production, ubah Firestore rules dari "test mode" ke rules yang lebih ketat
- Pertimbangkan menambahkan authentication jika diperlukan

## Troubleshooting
- Jika data tidak muncul, periksa console browser untuk error Firebase
- Pastikan konfigurasi Firebase sudah benar
- Periksa koneksi internet