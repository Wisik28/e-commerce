# Database Schema

Database menggunakan **PostgreSQL**. ORM menggunakan Spring Data JPA/Hibernate, sedangkan perubahan schema dikelola melalui **Flyway**.

## 1. Konvensi

- Primary key: `UUID`.
- Nama tabel/kolom: `snake_case`.
- Timestamp: `TIMESTAMPTZ`.
- Uang: `NUMERIC(19,2)`.
- Password: hash string, bukan plaintext.
- Enum dapat diimplementasikan sebagai PostgreSQL enum atau `VARCHAR` + application enum. Dokumen ini merekomendasikan `VARCHAR` + constraint/application enum agar migration lebih fleksibel.
- Soft delete digunakan pada produk.
- Foreign key menggunakan `ON DELETE RESTRICT` untuk data transaksi dan `ON DELETE CASCADE` pada child data yang memang tidak memiliki arti tanpa parent.

## 2. Relasi Utama

```text
users
  ├── seller_profiles
  ├── cart
  │     └── cart_items ──> products
  ├── orders
  │     ├── order_items ──> products
  │     └── payments
  └── conversations
        └── messages

users (seller)
  └── products

orders
  └── payments

payments
  └── payment_proofs

admin/seller verification
  users.role + seller_profiles.verification_status
```

## 3. Tabel `users`

Menyimpan seluruh akun pembeli, penjual, dan admin.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(150) | NOT NULL |
| phone | VARCHAR(30) | NULL |
| role | VARCHAR(20) | NOT NULL, CHECK |
| status | VARCHAR(20) | NOT NULL, CHECK |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| last_login_at | TIMESTAMPTZ | NULL |

`role`: `BUYER`, `SELLER`, `ADMIN`

`status`: `ACTIVE`, `INACTIVE`, `SUSPENDED`

Index:
- unique index pada `email`.
- index pada `(role, status)`.

## 4. Tabel `seller_profiles`

Data khusus seller dan proses verifikasi admin.

| Kolom | Tipe | Constraint |
|---|---|---|
| user_id | UUID | PK, FK users.id |
| store_name | VARCHAR(150) | NOT NULL, UNIQUE |
| store_description | TEXT | NULL |
| verification_status | VARCHAR(20) | NOT NULL, CHECK |
| rejection_reason | TEXT | NULL |
| verified_by | UUID | FK users.id, NULL |
| verified_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

`verification_status`: `PENDING`, `APPROVED`, `REJECTED`

Business constraint:
- `verified_by` wajib diisi jika status `APPROVED` atau `REJECTED`.
- `verified_at` wajib diisi setelah review.

## 5. Tabel `products`

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| seller_id | UUID | NOT NULL, FK users.id |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | NULL |
| price | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| stock | INTEGER | NOT NULL, CHECK >= 0 |
| weight_gram | INTEGER | NULL, CHECK > 0 |
| status | VARCHAR(20) | NOT NULL, CHECK |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

`status`: `ACTIVE`, `INACTIVE`

Constraint:
- seller harus memiliki `role=SELLER` dan verification `APPROVED` saat product dibuat.
- `price >= 0`.
- `stock >= 0`.

Index:
- `(seller_id, status)`.
- `(status, created_at)`.

## 6. Tabel `carts`

Satu cart aktif untuk setiap buyer.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| buyer_id | UUID | NOT NULL, UNIQUE, FK users.id |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

## 7. Tabel `cart_items`

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| cart_id | UUID | NOT NULL, FK carts.id |
| product_id | UUID | NOT NULL, FK products.id |
| quantity | INTEGER | NOT NULL, CHECK > 0 |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

Constraint:
- `UNIQUE(cart_id, product_id)`.
- Product harus aktif ketika checkout.
- Quantity tidak boleh melebihi stok saat checkout.

## 8. Tabel `orders`

Header transaksi.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| order_number | VARCHAR(40) | NOT NULL, UNIQUE |
| buyer_id | UUID | NOT NULL, FK users.id |
| status | VARCHAR(30) | NOT NULL, CHECK |
| subtotal | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| shipping_fee | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| total_amount | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| shipping_address | JSONB | NOT NULL |
| notes | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| paid_at | TIMESTAMPTZ | NULL |
| completed_at | TIMESTAMPTZ | NULL |
| cancelled_at | TIMESTAMPTZ | NULL |

`status`:
- `PENDING_PAYMENT`
- `PAID`
- `PROCESSING`
- `SHIPPED`
- `COMPLETED`
- `CANCELLED`

`shipping_address` disimpan sebagai snapshot agar perubahan alamat user tidak mengubah histori order.

## 9. Tabel `order_items`

Snapshot produk saat checkout.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | NOT NULL, FK orders.id |
| product_id | UUID | NOT NULL, FK products.id |
| seller_id | UUID | NOT NULL, FK users.id |
| product_name | VARCHAR(200) | NOT NULL |
| unit_price | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| quantity | INTEGER | NOT NULL, CHECK > 0 |
| line_total | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| created_at | TIMESTAMPTZ | NOT NULL |

`line_total = unit_price * quantity`.

Menyimpan `seller_id` dan `product_name` sebagai snapshot untuk kebutuhan histori dan query seller order.

Index:
- `(order_id)`.
- `(seller_id, created_at)`.

## 10. Tabel `payments`

Mencatat percobaan/metode pembayaran untuk order.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | NOT NULL, FK orders.id |
| payment_method | VARCHAR(30) | NOT NULL, CHECK |
| status | VARCHAR(30) | NOT NULL, CHECK |
| amount | NUMERIC(19,2) | NOT NULL, CHECK >= 0 |
| provider | VARCHAR(50) | NULL |
| external_reference | VARCHAR(150) | NULL, UNIQUE |
| virtual_account_number | VARCHAR(100) | NULL |
| expires_at | TIMESTAMPTZ | NULL |
| paid_at | TIMESTAMPTZ | NULL |
| failure_reason | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

`payment_method`:
- `VIRTUAL_ACCOUNT`
- `MANUAL`

`status`:
- `PENDING`
- `PROCESSING`
- `PROOF_SUBMITTED`
- `PAID`
- `FAILED`
- `CANCELLED`
- `EXPIRED`

Constraint:
- Untuk `VIRTUAL_ACCOUNT`, provider/VA dapat diwajibkan setelah payment dibuat.
- `external_reference` harus idempotent jika provider mengirim reference yang sama.

Disarankan partial unique index agar satu order hanya memiliki satu payment aktif pada satu waktu, sesuai business rule yang dipilih.

## 11. Tabel `payment_proofs`

Bukti pembayaran manual.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| payment_id | UUID | NOT NULL, FK payments.id |
| uploaded_by | UUID | NOT NULL, FK users.id |
| file_url | TEXT | NOT NULL |
| file_name | VARCHAR(255) | NOT NULL |
| mime_type | VARCHAR(100) | NOT NULL |
| file_size | BIGINT | NOT NULL, CHECK > 0 |
| submitted_at | TIMESTAMPTZ | NOT NULL |
| reviewed_at | TIMESTAMPTZ | NULL |
| reviewed_by | UUID | FK users.id, NULL |
| review_status | VARCHAR(20) | NOT NULL, CHECK |
| review_note | TEXT | NULL |

`review_status`: `PENDING`, `APPROVED`, `REJECTED`

Untuk MVP, seller dapat menjadi reviewer manual payment. Jika ke depannya admin juga memverifikasi pembayaran, gunakan authorization tambahan tanpa mengubah struktur utama.

## 12. Tabel `conversations`

Conversation antara buyer dan seller.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| buyer_id | UUID | NOT NULL, FK users.id |
| seller_id | UUID | NOT NULL, FK users.id |
| order_id | UUID | FK orders.id, NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

Constraint:
- buyer dan seller harus berbeda.
- Buyer harus `BUYER`.
- Seller harus `SELLER`.
- Untuk conversation terkait transaksi, `order_id` harus mereferensikan order buyer dan seller harus memiliki item pada order tersebut.

Index:
- `(buyer_id, seller_id)`.
- `(order_id)`.

## 13. Tabel `messages`

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| conversation_id | UUID | NOT NULL, FK conversations.id |
| sender_id | UUID | NOT NULL, FK users.id |
| message_type | VARCHAR(20) | NOT NULL, CHECK |
| content | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| read_at | TIMESTAMPTZ | NULL |

`message_type`:
- `TEXT`
- `IMAGE`
- `PAYMENT_PROOF`
- `SYSTEM`

Constraint:
- `content` wajib untuk `TEXT`.
- Untuk attachment, gunakan tabel attachment agar file tidak disimpan di PostgreSQL sebagai binary besar.

## 14. Tabel `message_attachments`

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| message_id | UUID | NOT NULL, FK messages.id |
| file_url | TEXT | NOT NULL |
| file_name | VARCHAR(255) | NOT NULL |
| mime_type | VARCHAR(100) | NOT NULL |
| file_size | BIGINT | NOT NULL, CHECK > 0 |
| created_at | TIMESTAMPTZ | NOT NULL |

## 15. Tabel `refresh_tokens`

Jika refresh token disimpan server-side.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | NOT NULL, FK users.id |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE |
| expires_at | TIMESTAMPTZ | NOT NULL |
| revoked_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

Jangan menyimpan refresh token plaintext.

## 16. Tabel `audit_logs`

Penting untuk aktivitas admin dan perubahan status transaksi.

| Kolom | Tipe | Constraint |
|---|---|---|
| id | UUID | PK |
| actor_user_id | UUID | FK users.id, NULL |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | NULL |
| old_value | JSONB | NULL |
| new_value | JSONB | NULL |
| ip_address | INET | NULL |
| user_agent | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

Contoh action:
- `SELLER_APPROVED`
- `SELLER_REJECTED`
- `PAYMENT_MANUAL_CONFIRMED`
- `PAYMENT_STATUS_CHANGED`
- `ORDER_CANCELLED`

## 17. Constraint dan Transaction Boundary

### Checkout

Checkout harus dijalankan dalam database transaction:

1. Lock cart/item yang relevan.
2. Validasi product aktif.
3. Lock row product untuk stock (`SELECT ... FOR UPDATE` melalui JPA locking).
4. Validasi stock.
5. Kurangi stock.
6. Buat order.
7. Buat order items.
8. Buat payment `PENDING`.
9. Bersihkan cart.
10. Commit.

Jika salah satu langkah gagal, transaction rollback.

### Payment Callback

Webhook:

1. Validasi signature.
2. Cari payment berdasarkan external reference.
3. Lock payment.
4. Periksa apakah status sudah final.
5. Jika sudah `PAID`, return success tanpa melakukan perubahan ulang.
6. Update payment.
7. Update order menjadi `PAID`.
8. Commit.

## 18. Contoh DDL Dasar

Contoh berikut bukan migration lengkap, tetapi menggambarkan tipe data dan constraint:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(19,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    weight_gram INTEGER CHECK (weight_gram > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_seller_status
    ON products(seller_id, status);
```

Migration produksi sebaiknya dipisah menjadi beberapa file Flyway, misalnya:

```text
V1__create_users.sql
V2__create_seller_profiles.sql
V3__create_products.sql
V4__create_carts.sql
V5__create_orders.sql
V6__create_payments.sql
V7__create_chat.sql
V8__create_refresh_tokens.sql
V9__create_audit_logs.sql
```

## 19. Data Integrity

Jangan hanya mengandalkan frontend untuk constraint berikut:

- role.
- seller verification.
- ownership resource.
- product stock.
- payment state transition.
- order state transition.
- payment webhook idempotency.
- chat participant authorization.

Semua harus diverifikasi di backend.
