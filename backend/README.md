# E-Commerce Backend

Backend e-commerce marketplace dengan tiga peran utama: **Pembeli, Penjual, dan Admin**. Sistem dirancang sebagai backend REST API menggunakan Java Spring Boot dan PostgreSQL, dengan dukungan pembayaran melalui **Virtual Account (VA)** dan **manual payment** sebagai fallback apabila VA bermasalah.

> Fokus dokumen ini hanya pada backend. Tidak ada ketentuan desain/tampilan frontend.

## 1. Tujuan Sistem

Sistem menyediakan alur marketplace sederhana:

- Pembeli dapat membuat akun, login, melihat produk, mengelola keranjang, checkout, membayar, dan chat dengan penjual.
- Penjual dapat registrasi, menunggu verifikasi admin, mengelola produk, menerima order, dan mengonfirmasi pembayaran manual melalui chat.
- Admin dapat login, memverifikasi akun penjual, dan memonitor aktivitas marketplace.
- Pembayaran mendukung:
  - `VIRTUAL_ACCOUNT`: pembayaran melalui VA.
  - `MANUAL`: pembayaran alternatif ketika VA gagal/tidak tersedia; bukti dan konfirmasi dilakukan melalui chat.

## 2. Tech Stack

| Komponen | Teknologi |
|---|---|
| Language | Java 21+ |
| Framework | Spring Boot 3.x |
| API | REST / JSON |
| Security | Spring Security + JWT |
| ORM | Spring Data JPA / Hibernate |
| Database | PostgreSQL |
| Migration | Flyway |
| Validation | Jakarta Bean Validation |
| Build | Maven |
| Testing | JUnit 5 + Mockito + Spring Boot Test |
| API Documentation | OpenAPI / Swagger |
| Logging | SLF4J + Logback |
| Containerization | Docker / Docker Compose |
| Payment | Payment Gateway VA melalui adapter/integration layer |
| File storage | Object storage/local storage abstraction untuk bukti pembayaran |

Versi dependency dapat dikunci pada `pom.xml` saat implementasi.

## 3. Role

### Admin
- Login.
- Melihat daftar seller yang menunggu verifikasi.
- Approve/reject seller.
- Melihat dashboard monitoring.
- Melihat user, produk, order, dan payment untuk kebutuhan monitoring.

### Penjual
- Register.
- Login setelah akun diverifikasi.
- Membuat produk.
- Edit produk.
- Hapus/nonaktifkan produk.
- Melihat order yang berkaitan dengan produknya.
- Melihat chat dengan pembeli.
- Mengonfirmasi pembayaran manual setelah menerima bukti/informasi pembayaran.

### Pembeli
- Register.
- Login.
- Melihat produk.
- Menambahkan produk ke keranjang.
- Mengubah kuantitas/menghapus item keranjang.
- Checkout.
- Memilih metode pembayaran VA atau manual.
- Melihat status order/payment.
- Chat dengan penjual.
- Mengirim bukti pembayaran manual melalui mekanisme attachment yang disediakan backend.

## 4. Prinsip Bisnis Penting

1. Seller tidak boleh menjual produk sebelum akun seller diverifikasi admin.
2. Hanya seller yang statusnya `APPROVED` yang dapat login sebagai seller dan mengelola produk.
3. Produk tidak dihapus secara fisik ketika sudah pernah digunakan dalam order; gunakan soft delete/nonaktif.
4. Harga produk pada order harus disimpan sebagai snapshot (`unit_price`) agar perubahan harga setelah checkout tidak mengubah histori transaksi.
5. Stok harus divalidasi ketika checkout.
6. Payment dan order memiliki status terpisah.
7. Manual payment tidak otomatis dianggap lunas hanya karena pembeli mengirim bukti.
8. Seller mengonfirmasi manual payment.
9. VA dikonfirmasi melalui callback/webhook dari payment gateway.
10. Endpoint webhook harus idempotent.
11. Pembeli hanya dapat mengakses order miliknya.
12. Seller hanya dapat mengakses order yang memiliki item dari tokonya.
13. Chat harus memiliki otorisasi berdasarkan relasi pembeli-seller-order.
14. Password tidak pernah disimpan plaintext.
15. JWT digunakan untuk autentikasi API; role/authority digunakan untuk authorization.

## 5. Status Utama

### Seller Verification

`PENDING -> APPROVED`

atau

`PENDING -> REJECTED`

Seller yang ditolak dapat dibuatkan flow re-registration/review ulang sesuai kebutuhan implementasi.

### Order

Contoh state:

`PENDING_PAYMENT -> PAID -> PROCESSING -> SHIPPED -> COMPLETED`

Cabang lain:

`PENDING_PAYMENT -> CANCELLED`

`PAID -> CANCELLED` hanya jika business rule mengizinkan pembatalan/refund.

### Payment

`PENDING -> PROCESSING -> PAID`

Alternatif:

`PENDING -> FAILED`

`PENDING -> CANCELLED`

Manual:

`PENDING -> PROOF_SUBMITTED -> PAID`

atau `PROOF_SUBMITTED -> FAILED/REJECTED` bila konfirmasi manual ditolak.

## 6. API Convention

Base URL contoh:

`/api/v1`

Format sukses:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Format error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

HTTP status yang digunakan:

- `200 OK`: request berhasil.
- `201 Created`: resource berhasil dibuat.
- `204 No Content`: operasi berhasil tanpa response body.
- `400 Bad Request`: input tidak valid.
- `401 Unauthorized`: belum login/token tidak valid.
- `403 Forbidden`: tidak memiliki akses.
- `404 Not Found`: resource tidak ditemukan.
- `409 Conflict`: konflik state/data.
- `422 Unprocessable Entity`: business validation gagal.
- `500 Internal Server Error`: kesalahan server.

## 7. Endpoint Minimum

### Auth
- `POST /api/v1/auth/register/buyer`
- `POST /api/v1/auth/register/seller`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

### Seller
- `GET /api/v1/seller/profile`
- `POST /api/v1/seller/products`
- `GET /api/v1/seller/products`
- `PUT /api/v1/seller/products/{productId}`
- `DELETE /api/v1/seller/products/{productId}`
- `GET /api/v1/seller/orders`
- `POST /api/v1/seller/orders/{orderId}/payment/confirm-manual`

### Buyer
- `GET /api/v1/products`
- `GET /api/v1/products/{productId}`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{itemId}`
- `DELETE /api/v1/cart/items/{itemId}`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderId}`
- `POST /api/v1/orders/{orderId}/payments`
- `POST /api/v1/orders/{orderId}/payment-proof`
- `GET /api/v1/orders/{orderId}/payment`

### Chat
- `GET /api/v1/conversations`
- `POST /api/v1/conversations`
- `GET /api/v1/conversations/{conversationId}/messages`
- `POST /api/v1/conversations/{conversationId}/messages`
- `POST /api/v1/conversations/{conversationId}/attachments`

### Admin
- `GET /api/v1/admin/sellers/pending`
- `POST /api/v1/admin/sellers/{sellerId}/approve`
- `POST /api/v1/admin/sellers/{sellerId}/reject`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/payments`

### Payment Gateway
- `POST /api/v1/payments/webhooks/{provider}`

Endpoint aktual dapat berkembang berdasarkan kebutuhan frontend dan payment provider.

## 8. Local Development

### Prasyarat

- JDK 21+
- Maven 3.9+
- PostgreSQL 15+
- Docker opsional

### Environment Variable

Contoh:

```env
SPRING_PROFILES_ACTIVE=dev

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USERNAME=postgres
DB_PASSWORD=postgres

JWT_SECRET=change-this-secret
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

PAYMENT_PROVIDER=mock
PAYMENT_API_KEY=
PAYMENT_WEBHOOK_SECRET=

STORAGE_PROVIDER=local
STORAGE_BASE_PATH=./storage
```

Jangan commit secret ke repository.

### Menjalankan PostgreSQL

```bash
docker compose up -d postgres
```

### Menjalankan aplikasi

```bash
./mvnw spring-boot:run
```

Migration Flyway dijalankan saat aplikasi start jika dikonfigurasi aktif.

## 9. Testing

```bash
./mvnw test
```

Integration test:

```bash
./mvnw verify
```

Minimal test coverage yang disarankan:

- Authentication.
- Authorization berdasarkan role.
- Seller verification.
- Product CRUD.
- Cart.
- Checkout dan stock consistency.
- VA payment callback.
- Manual payment confirmation.
- Chat authorization.
- Admin dashboard aggregation.
- Idempotency webhook.

## 10. Security Checklist

- Password menggunakan Argon2id atau BCrypt.
- JWT access token berumur pendek.
- Refresh token dikelola secara aman.
- Validasi input pada semua endpoint.
- Authorization di service layer, bukan hanya controller.
- Rate limiting untuk login dan webhook.
- CORS dikonfigurasi secara eksplisit.
- File bukti pembayaran divalidasi tipe dan ukuran.
- Jangan menerima path file langsung dari client.
- Audit log untuk approve/reject seller dan perubahan status payment.
- Secrets disimpan melalui environment/secret manager.
- Database user aplikasi menggunakan privilege minimum.

## 11. Dokumentasi Lanjutan

- Struktur database: `SCHEMA.md`
- Product requirements: `PRD.md`
- Arsitektur backend: `ARCHITECTURE.md`

## 12. Scope Non-Frontend

Dokumen ini tidak menentukan:

- layout halaman,
- warna,
- typography,
- design system,
- component UI,
- responsive breakpoint,
- framework frontend.

Frontend cukup mengikuti kontrak REST API dan status bisnis yang didefinisikan backend.
