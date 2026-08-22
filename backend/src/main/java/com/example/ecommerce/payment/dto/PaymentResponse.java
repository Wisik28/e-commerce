package com.example.ecommerce.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private UUID id;
    private UUID orderId;
    private String paymentMethod;
    private String status;
    private BigDecimal amount;
    private String provider;
    private String virtualAccountNumber;
    private Instant expiresAt;
    private Instant paidAt;
    private Instant createdAt;
    private String paymentProofUrl;
}
