# Product Requirements Document (PRD)

## 1. Product Overview

Sistem adalah backend marketplace yang mempertemukan pembeli dan penjual dengan peran admin sebagai pengelola/verifikator.

Sistem mendukung dua metode pembayaran:

1. **Virtual Account (VA)** sebagai metode utama.
2. **Manual Payment** sebagai fallback jika VA mengalami error atau tidak dapat digunakan.

Manual payment terintegrasi dengan chat buyer-seller sehingga pembeli dapat mengirim informasi/bukti pembayaran dan seller dapat melakukan konfirmasi.

## 2. Goals

### Primary Goals

- Menyediakan REST API marketplace yang aman.
- Mendukung registrasi dan autentikasi tiga role.
- Menjamin seller diverifikasi sebelum dapat berjualan.
- Menyediakan product CRUD.
- Menyediakan cart dan checkout.
- Menyediakan pembayaran VA.
- Menyediakan fallback manual payment.
- Menyediakan chat buyer-seller.
- Menyediakan monitoring admin.
- Menjaga konsistensi stok dan transaksi.

### Non-Goals

Untuk scope awal, sistem tidak wajib mencakup:

- frontend/web/mobile UI,
- recommendation engine,
- loyalty points,
- voucher kompleks,
- multi-warehouse,
- advanced shipping aggregator,
- live-stream shopping,
- dispute center kompleks,
- refund otomatis multi-provider.

Fitur tersebut dapat menjadi phase berikutnya.

## 3. Actors

### Buyer

Tujuan:
- Membeli produk.
- Membayar order.
- Berkomunikasi dengan seller.

### Seller

Tujuan:
- Menjual produk.
- Mengelola stok.
- Memproses order.
- Mengonfirmasi pembayaran manual.

### Admin

Tujuan:
- Memastikan seller valid.
- Memantau sistem.
- Menjaga integritas aktivitas marketplace.

## 4. Functional Requirements

## FR-01 Authentication

### Register Buyer

Input minimal:
- email
- password
- full name
- phone opsional

Rules:
- email unik.
- password memenuhi policy.
- role otomatis `BUYER`.

### Register Seller

Input minimal:
- email
- password
- full name
- phone
- store name
- store description

Rules:
- role otomatis `SELLER`.
- seller profile otomatis `PENDING`.
- seller belum boleh menjual sampai disetujui admin.

### Login

Input:
- email
- password

Output:
- access token.
- refresh token.
- role.
- expiration.

Admin tidak disediakan public registration; akun admin dibuat melalui seed/migration/administrative provisioning.

## FR-02 Seller Verification

Admin dapat:
- melihat seller `PENDING`.
- melihat detail seller.
- approve seller.
- reject seller dengan alasan.

Acceptance criteria:
- Seller approved dapat melakukan operasi seller.
- Seller rejected tidak dapat berjualan.
- Setiap approval/rejection tercatat di audit log.

## FR-03 Product Management

Seller approved dapat:

### Create Product

Input:
- name
- description
- price
- stock
- weight

Rules:
- seller harus approved.
- price >= 0.
- stock >= 0.

### Edit Product

Seller hanya dapat mengedit produknya sendiri.

### Delete Product

Rekomendasi: soft delete/nonaktif.

Alasan:
- order lama harus tetap memiliki referensi produk.
- histori transaksi tidak boleh hilang.

## FR-04 Product Discovery

Public/buyer dapat:
- melihat produk aktif.
- melihat detail produk.
- melihat seller/store yang terkait.
- pagination.
- filter/sort dasar.

Backend tidak menentukan tampilan frontend.

## FR-05 Cart

Buyer dapat:
- menambah item.
- mengubah quantity.
- menghapus item.
- melihat isi cart.

Rules:
- hanya produk aktif.
- quantity > 0.
- quantity divalidasi kembali ketika checkout.

## FR-06 Checkout

Buyer memilih item cart lalu membuat order.

Backend melakukan:
1. Validasi user.
2. Validasi product.
3. Validasi stock.
4. Lock stock.
5. Membuat order.
6. Membuat order item snapshot.
7. Mengurangi stock.
8. Membuat payment `PENDING`.
9. Mengosongkan item cart yang berhasil checkout.

Order harus menyimpan:
- buyer.
- item.
- harga snapshot.
- quantity.
- subtotal.
- shipping fee.
- total.
- shipping address snapshot.

## FR-07 Virtual Account Payment

Flow:

```text
Buyer checkout
    |
    v
Create order
    |
    v
Create payment PENDING
    |
    v
Payment adapter -> provider
    |
    v
VA generated
    |
    v
Buyer pays
    |
    v
Provider webhook
    |
    v
Backend validates webhook
    |
    v
Payment PAID
    |
    v
Order PAID
```

Rules:
- Jangan menganggap payment sukses berdasarkan response frontend.
- Status final berasal dari server/provider callback.
- Webhook wajib signature verification.
- Webhook harus idempotent.

Jika VA gagal dibuat:
- payment menjadi `FAILED`, atau
- sistem mengizinkan buyer memilih manual payment sebagai fallback.

## FR-08 Manual Payment

Manual payment tersedia jika:
- VA error.
- VA tidak tersedia.
- buyer memilih metode manual sesuai policy.

Flow:

```text
Buyer checkout
    |
    v
Select MANUAL
    |
    v
Payment PENDING
    |
    v
Buyer mengirim bukti/informasi melalui chat
    |
    v
Payment PROOF_SUBMITTED
    |
    v
Seller review
    |
    +---- reject ----> FAILED / PROOF_SUBMITTED
    |
    +---- approve ---> PAID
                         |
                         v
                       Order PAID
```

Rules:
- Bukti pembayaran harus dapat dilacak ke payment.
- Seller hanya boleh mengonfirmasi payment untuk order yang melibatkan seller tersebut.
- Konfirmasi tidak boleh dilakukan dua kali.
- Perubahan status dicatat di audit log.
- Sistem sebaiknya menyediakan alasan penolakan.

## FR-09 Chat

Chat digunakan untuk komunikasi buyer-seller.

Minimum:
- conversation.
- messages.
- attachment.
- timestamp.
- read status.

Authorization:
- Buyer hanya dapat membuka conversation yang melibatkan dirinya.
- Seller hanya dapat membuka conversation yang melibatkan dirinya.
- Conversation terkait order harus memvalidasi relasi terhadap order.

Chat untuk manual payment harus dapat menghubungkan bukti dengan payment.

### Real-time

MVP dapat menggunakan REST polling.

Phase berikutnya dapat menggunakan:
- WebSocket,
- Server-Sent Events,
- Redis pub/sub bila membutuhkan scale-out.

## FR-10 Order Management

Buyer dapat melihat:
- order list.
- detail order.
- status payment.
- status order.

Seller dapat melihat:
- order yang memiliki item dari tokonya.
- item dan quantity yang harus diproses.

Admin dapat melihat:
- seluruh order.

## FR-11 Admin Dashboard Monitoring

Dashboard API minimal menyediakan agregasi:
- total buyer.
- total seller.
- seller pending verification.
- total product aktif.
- total order.
- order berdasarkan status.
- payment berdasarkan status.
- total transaksi berdasarkan periode.
- manual payment pending review.

Contoh endpoint:

`GET /api/v1/admin/dashboard?from=2026-08-01&to=2026-08-19`

## 5. Authorization Matrix

| Resource/Action | Buyer | Seller | Admin |
|---|---:|---:|---:|
| Register buyer | Public | Public | Public |
| Register seller | Public | Public | Public |
| Login | ✓ | ✓ | ✓ |
| View active products | ✓ | ✓ | ✓ |
| Manage own cart | ✓ | - | - |
| Checkout | ✓ | - | - |
| View own orders | ✓ | - | ✓ |
| View seller orders | - | ✓ | ✓ |
| Create product | - | ✓* | - |
| Edit own product | - | ✓* | - |
| Delete own product | - | ✓* | - |
| Approve seller | - | - | ✓ |
| Reject seller | - | - | ✓ |
| Chat buyer-seller | ✓ | ✓ | Optional monitoring |
| Confirm manual payment | - | ✓* | Optional override |
| View dashboard | - | - | ✓ |

`*` seller harus `APPROVED`.

## 6. Non-Functional Requirements

### NFR-01 Security

- BCrypt/Argon2id.
- JWT.
- Role-based access control.
- Input validation.
- SQL injection protection via JPA/parameterized queries.
- File upload validation.
- Webhook signature validation.
- Rate limiting.
- Audit log.
- Secrets tidak disimpan dalam source code.

### NFR-02 Reliability

- Database transaction untuk checkout.
- Row locking untuk stock.
- Idempotent payment webhook.
- Idempotent operation bila memungkinkan.

### NFR-03 Performance

Target MVP:
- API read umum < 500 ms pada kondisi normal tanpa dependency eksternal lambat.
- Checkout memprioritaskan consistency daripada latency.
- Pagination wajib untuk list besar.
- Index untuk kolom query utama.

Target dapat disesuaikan setelah load test.

### NFR-04 Observability

Backend harus memiliki:
- structured logging.
- request correlation ID.
- error logging.
- payment integration logging tanpa membocorkan secret.
- audit log untuk aktivitas kritis.
- metrics dasar.

### NFR-05 Maintainability

- Clean separation antara controller, service, repository, domain/model, integration.
- DTO tidak diekspos langsung sebagai entity JPA.
- Business rule berada di service/domain layer.
- Database migration menggunakan Flyway.
- Unit dan integration test.

## 7. Error Handling

Error harus konsisten.

Kategori:
- Validation error.
- Authentication error.
- Authorization error.
- Resource not found.
- Business conflict.
- Payment provider error.
- Internal server error.

Payment provider error tidak boleh mengekspos detail internal provider kepada client.

## 8. Acceptance Criteria MVP

### Authentication
- [ ] Buyer dapat register/login.
- [ ] Seller dapat register/login setelah approved.
- [ ] Admin dapat login.
- [ ] Password di-hash.

### Seller
- [ ] Seller baru berstatus pending.
- [ ] Admin dapat approve/reject.
- [ ] Seller approved dapat CRUD product.
- [ ] Seller rejected tidak dapat menjual.

### Buyer
- [ ] Buyer dapat melihat product.
- [ ] Buyer dapat menggunakan cart.
- [ ] Buyer dapat checkout.
- [ ] Stock tidak boleh menjadi negatif.

### Payment
- [ ] VA payment dapat dibuat melalui payment adapter.
- [ ] Webhook dapat mengubah payment menjadi paid.
- [ ] Webhook idempotent.
- [ ] Manual payment dapat dibuat.
- [ ] Buyer dapat mengirim bukti.
- [ ] Seller dapat approve/reject manual payment.
- [ ] Payment status memengaruhi order sesuai state machine.

### Chat
- [ ] Buyer dan seller dapat membuat conversation.
- [ ] Pesan dapat dikirim.
- [ ] Attachment dapat dikirim dengan validasi.
- [ ] User tidak dapat membaca conversation milik user lain.

### Admin
- [ ] Seller pending dapat dimonitor.
- [ ] Dashboard menyediakan statistik dasar.
- [ ] Aktivitas kritis tercatat.

## 9. Future Enhancements

- Shipping provider integration.
- Refund.
- Cancellation workflow yang lebih kompleks.
- Review/rating.
- Voucher.
- Notification service.
- Email/WhatsApp notification.
- WebSocket real-time chat.
- Redis caching.
- Search engine seperti Elasticsearch/OpenSearch.
- Object storage S3-compatible.
- Outbox pattern dan message broker.
- Microservice decomposition bila scale sudah membutuhkan.

## 10. Important Backend Decision

MVP sebaiknya dibuat sebagai **modular monolith**, bukan langsung microservices.

Alasannya:
- domain masih sederhana.
- transaction checkout dan stock lebih mudah dijaga.
- deployment lebih sederhana.
- debugging lebih mudah.
- module boundary tetap dapat disiapkan agar nantinya mudah diekstrak menjadi service.

