# Backend Architecture

## 1. Architecture Decision

Backend menggunakan **Modular Monolith** berbasis Spring Boot.

Walaupun aplikasi dijalankan sebagai satu deployable application, domain dipisahkan menjadi module/service layer:

```text
Auth
User/Seller Verification
Catalog
Cart
Order
Payment
Chat
Admin/Monitoring
File Storage
```

Istilah "service" pada dokumen ini berarti application/domain service di dalam satu backend, bukan berarti setiap service harus memiliki server/database terpisah.

Microservices dapat dipertimbangkan setelah kebutuhan scale dan operational complexity benar-benar muncul.

## 2. Tech Stack

### Core
- Java 21+
- Spring Boot 3.x
- Spring Web
- Spring Validation
- Spring Security

### Persistence
- PostgreSQL
- Spring Data JPA
- Hibernate
- Flyway

### API
- REST
- JSON
- OpenAPI/Swagger

### Security
- JWT
- BCrypt/Argon2id
- Role-based authorization

### Testing
- JUnit 5
- Mockito
- Spring Boot Test
- Testcontainers untuk PostgreSQL integration test

### Infrastructure
- Docker
- Docker Compose
- CI/CD sesuai platform deployment

### External Integration
- Payment Gateway VA
- Object Storage untuk file/bukti pembayaran

## 3. High-Level Architecture

```text
                         +----------------------+
                         |      Frontend        |
                         +----------+-----------+
                                    |
                                    | HTTPS/JSON
                                    v
+----------------------------------------------------------------+
|                       Spring Boot Backend                      |
|                                                                |
|  +---------+   +----------+   +----------+   +--------------+ |
|  |  Auth   |   | Catalog  |   |   Cart   |   |    Order     | |
|  +---------+   +----------+   +----------+   +--------------+ |
|       |             |              |                |          |
|       +-------------+--------------+----------------+          |
|                                    |                           |
|                             +------+-------+                   |
|                             |   Payment    |----------------+  |
|                             +------+-------+                |  |
|                                    |                        |  |
|                             +------+-------+                |  |
|                             |     Chat     |                |  |
|                             +--------------+                |  |
|                                                            |  |
+------------------------------------------------------------|--+
                                                             |
                 +----------------------+     +--------------+--+
                 |    PostgreSQL        |     | Payment Provider|
                 +----------------------+     +-----------------+
                                                             |
                 +----------------------+                     |
                 | Object Storage       |<--------------------+
                 +----------------------+
```

## 4. Project Structure

Recommended Maven structure:

```text
src/
├── main/
│   ├── java/com/example/ecommerce/
│   │   ├── EcommerceApplication.java
│   │   │
│   │   ├── common/
│   │   │   ├── config/
│   │   │   ├── exception/
│   │   │   ├── response/
│   │   │   ├── security/
│   │   │   ├── validation/
│   │   │   └── util/
│   │   │
│   │   ├── auth/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── service/
│   │   │   └── repository/
│   │   │
│   │   ├── user/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   │
│   │   ├── seller/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   │
│   │   ├── catalog/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   │
│   │   ├── cart/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   │
│   │   ├── order/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   │
│   │   ├── payment/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   ├── service/
│   │   │   └── integration/
│   │   │       ├── PaymentGateway.java
│   │   │       └── provider/
│   │   │
│   │   ├── chat/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   │
│   │   └── admin/
│   │       ├── controller/
│   │       ├── dto/
│   │       └── service/
│   │
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       ├── application-prod.yml
│       └── db/
│           └── migration/
│               ├── V1__create_users.sql
│               ├── V2__create_seller_profiles.sql
│               ├── V3__create_products.sql
│               ├── V4__create_carts.sql
│               ├── V5__create_orders.sql
│               ├── V6__create_payments.sql
│               ├── V7__create_chat.sql
│               ├── V8__create_refresh_tokens.sql
│               └── V9__create_audit_logs.sql
│
└── test/
    └── java/com/example/ecommerce/
```

## 5. Layer Responsibilities

### Controller

Tugas:
- menerima HTTP request.
- validasi DTO.
- memanggil application service.
- mengembalikan response.

Controller tidak boleh menyimpan business logic kompleks.

### DTO

Memisahkan API contract dari entity database.

Contoh:
- `RegisterSellerRequest`
- `LoginRequest`
- `CreateProductRequest`
- `CheckoutRequest`
- `CreatePaymentRequest`

### Service

Tempat business logic.

Contoh:
- `SellerVerificationService`
- `ProductService`
- `CheckoutService`
- `PaymentService`
- `ManualPaymentService`
- `ConversationService`

### Repository

Akses database melalui Spring Data JPA.

### Entity

Representasi persistence.

Entity tidak langsung dikirim sebagai API response.

### Integration

Abstraction untuk external dependency.

Contoh:

```java
public interface PaymentGateway {

    CreateVirtualAccountResult createVirtualAccount(
        PaymentRequest request
    );

    void validateWebhook(String payload, String signature);

    PaymentWebhookResult parseWebhook(String payload);
}
```

Dengan abstraction ini, provider dapat diganti tanpa mengubah `PaymentService`.

## 6. Data Flow: Registration

```text
Client
  |
  | POST /auth/register/seller
  v
AuthController
  |
  v
AuthService
  |
  +--> validate email
  |
  +--> hash password
  |
  +--> UserRepository
  |
  +--> SellerProfileRepository
  |
  v
PostgreSQL
```

Seller profile dibuat dengan:

`verification_status = PENDING`

## 7. Data Flow: Seller Verification

```text
Admin
 |
 | POST /admin/sellers/{id}/approve
 v
Admin/Seller Controller
 |
 v
SellerVerificationService
 |
 +--> Authorization ADMIN
 |
 +--> Lock seller profile
 |
 +--> status = APPROVED
 |
 +--> AuditLogService
 |
 v
PostgreSQL
```

Reject menggunakan flow yang sama dengan `REJECTED` dan `rejection_reason`.

## 8. Data Flow: Product Creation

```text
Seller
 |
 | POST /seller/products
 v
ProductController
 |
 v
ProductService
 |
 +--> authenticated user
 +--> check role SELLER
 +--> check seller APPROVED
 +--> validate request
 |
 v
ProductRepository
 |
 v
PostgreSQL
```

Ownership harus selalu diverifikasi.

## 9. Data Flow: Checkout

Checkout adalah bagian paling sensitif karena melibatkan stock dan transaksi.

```text
Buyer
 |
 | POST /orders
 v
OrderController
 |
 v
CheckoutService @Transactional
 |
 +--> load cart
 |
 +--> load cart items
 |
 +--> lock products FOR UPDATE
 |
 +--> validate stock
 |
 +--> calculate totals
 |
 +--> decrement stock
 |
 +--> create order
 |
 +--> create order items
 |
 +--> create payment PENDING
 |
 +--> clear cart
 |
 v
PostgreSQL
```

Payment provider tidak sebaiknya dipanggil di tengah transaction database yang panjang. Gunakan pendekatan berikut:

```text
DB Transaction
   |
   +--> create order/payment PENDING
   |
   +--> commit
          |
          v
   Payment Application Service
          |
          v
   Payment Gateway
          |
          v
   update payment
```

Jika membutuhkan strong orchestration, gunakan state machine/outbox pada tahap lanjutan.

## 10. Data Flow: Virtual Account

```text
Buyer
 |
 v
POST /orders/{orderId}/payments
 |
 v
PaymentService
 |
 +--> validate order ownership
 +--> validate order status
 +--> create payment PENDING
 |
 v
PaymentGateway interface
 |
 v
Provider Adapter
 |
 v
External VA Provider
 |
 +--> VA number
 +--> external reference
 +--> expiration
 |
 v
PaymentService
 |
 v
PostgreSQL
```

Provider-specific code tidak boleh menyebar ke controller/order service.

## 11. Data Flow: VA Webhook

```text
Payment Provider
 |
 | POST /payments/webhooks/provider
 v
PaymentWebhookController
 |
 v
PaymentGateway Adapter
 |
 +--> verify signature
 +--> parse event
 |
 v
PaymentService
 |
 +--> find payment by external_reference
 +--> lock payment
 +--> idempotency check
 +--> update payment
 +--> update order
 |
 v
PostgreSQL
```

### Idempotency

Jika provider mengirim event dua kali:

```text
Webhook #1 -> PENDING -> PAID
Webhook #2 -> already PAID -> ignore safely
```

Response ke provider tetap sukses setelah event dianggap telah diproses.

## 12. Data Flow: Manual Payment

```text
Buyer
 |
 | select MANUAL
 v
PaymentService
 |
 v
Payment PENDING
 |
 v
Chat
 |
 +--> Buyer sends message
 +--> Buyer uploads proof
 |
 v
PaymentProof
 |
 v
Seller
 |
 | confirm manual payment
 v
ManualPaymentService
 |
 +--> authorize seller
 +--> validate order relation
 +--> validate payment status
 +--> update proof/payment
 +--> update order
 +--> write audit log
 |
 v
PostgreSQL
```

Status:

```text
PENDING
   |
   v
PROOF_SUBMITTED
   |
   +---- reject ----> FAILED / PROOF_SUBMITTED
   |
   +---- approve ---> PAID
```

## 13. Data Flow: Chat

MVP:

```text
Client
 |
 | REST
 v
ConversationController
 |
 v
ConversationService
 |
 +--> authorize participant
 |
 v
MessageRepository
 |
 v
PostgreSQL
```

Attachment:

```text
Client
 |
 | multipart upload
 v
ChatController
 |
 v
FileStorageService
 |
 +--> validate mime/size
 +--> upload object
 |
 v
MessageAttachmentRepository
 |
 v
PostgreSQL
```

File binary tidak disimpan sebagai kolom database untuk MVP.

## 14. State Machine

### Order

```text
PENDING_PAYMENT
      |
      +---- cancel ----> CANCELLED
      |
      v
     PAID
      |
      v
 PROCESSING
      |
      v
   SHIPPED
      |
      v
  COMPLETED
```

### Payment

```text
                  +--> FAILED
                  |
PENDING ----------+--> PROCESSING --> PAID
   |
   +--> CANCELLED
   |
   +--> EXPIRED

Manual:
PENDING --> PROOF_SUBMITTED --> PAID
                         |
                         +----> FAILED
```

Transition harus divalidasi di service, bukan sekadar mengubah string status.

## 15. Security Architecture

### Authentication

```text
Login
 |
 v
AuthService
 |
 +--> verify password hash
 |
 +--> issue access JWT
 |
 +--> issue refresh token
 |
 v
Client
```

### Authorization

JWT membawa claim minimal:

```json
{
  "sub": "user-uuid",
  "role": "SELLER",
  "exp": 1234567890
}
```

Authorization terdiri dari:
1. role check.
2. resource ownership check.
3. business status check.

Contoh:
- Role SELLER saja belum cukup.
- Seller juga harus `APPROVED`.
- Seller hanya boleh edit product miliknya.

## 16. Exception Handling

Gunakan `@RestControllerAdvice`.

Contoh exception:
- `ResourceNotFoundException`
- `UnauthorizedException`
- `ForbiddenException`
- `BusinessRuleException`
- `InsufficientStockException`
- `PaymentException`
- `InvalidWebhookException`

Response dibuat konsisten seperti:

```json
{
  "success": false,
  "message": "Insufficient stock",
  "errors": []
}
```

Jangan mengembalikan stack trace ke client.

## 17. Transaction Strategy

Gunakan `@Transactional` untuk operation yang membutuhkan atomicity.

Contoh:

```java
@Transactional
public Order checkout(UUID buyerId, CheckoutRequest request) {
    // load cart
    // lock products
    // validate stock
    // create order
    // create order items
    // decrement stock
    // create payment
    // clear cart
}
```

Gunakan locking pada stock untuk mencegah:

```text
Buyer A sees stock = 1
Buyer B sees stock = 1

A buys -> stock 0
B buys -> stock -1  // BAD
```

Dengan row lock, salah satu transaction harus menunggu dan kemudian melihat stock terbaru.

## 18. Payment Integration Pattern

Gunakan Adapter/Strategy:

```text
PaymentService
      |
      v
PaymentGateway
      |
      +---- MockPaymentGateway
      |
      +---- ProviderAPaymentGateway
      |
      +---- ProviderBPaymentGateway
```

Keuntungan:
- provider dapat diganti.
- unit test tidak membutuhkan provider asli.
- development dapat menggunakan mock provider.
- business logic tidak tergantung vendor.

## 19. Database Access Rules

- Entity tidak keluar dari service layer.
- Repository hanya dipanggil oleh service.
- Query list besar harus pagination.
- Gunakan projection/query DTO jika entity terlalu berat.
- Hindari N+1 query.
- Gunakan index berdasarkan access pattern.
- Jangan menggunakan `EAGER` relationship tanpa alasan.

## 20. API Versioning

Gunakan:

`/api/v1/...`

Jika terdapat breaking change:

`/api/v2/...`

Jangan mengubah response `v1` secara breaking tanpa versioning.

## 21. Deployment Architecture

MVP:

```text
Internet
   |
   v
Reverse Proxy / Load Balancer
   |
   v
Spring Boot Container
   |
   +---- PostgreSQL
   |
   +---- Object Storage
   |
   +---- Payment Provider
```

Untuk scale:

```text
Load Balancer
      |
 +----+----+
 |         |
 v         v
App 1     App 2
 |         |
 +----+----+
      |
      v
PostgreSQL
```

Jika aplikasi menjadi multi-instance dan chat real-time ditambahkan, pertimbangkan Redis/message broker.

## 22. Observability

Log minimal:
- request ID.
- user ID jika tersedia.
- endpoint.
- HTTP status.
- duration.
- payment external reference tanpa data rahasia.
- exception category.

Metrics:
- request count.
- latency.
- error rate.
- checkout success/failure.
- payment success/failure.
- webhook processing.
- pending manual payments.

## 23. Recommended Implementation Order

1. Project setup + PostgreSQL + Flyway.
2. User/Auth/JWT.
3. Seller registration + verification.
4. Product management.
5. Product listing.
6. Cart.
7. Checkout + stock locking.
8. Order.
9. Payment abstraction.
10. Mock VA provider.
11. Real VA provider adapter.
12. Manual payment.
13. Chat + attachment.
14. Admin dashboard.
15. Audit log.
16. Integration tests.
17. Docker + deployment.
18. Observability.

## 24. Architecture Evolution

Jika kebutuhan meningkat, module dapat diekstrak bertahap:

```text
Current:
Spring Boot Modular Monolith
 |
 +-- Auth
 +-- Catalog
 +-- Order
 +-- Payment
 +-- Chat
 +-- Admin

Possible future:
Auth Service
Catalog Service
Order Service
Payment Service
Chat Service
Notification Service
```

Namun jangan memecah service sebelum kebutuhan scaling, deployment independence, team ownership, atau reliability benar-benar membenarkannya.
