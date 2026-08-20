package com.example.ecommerce.payment.integration;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentGateway {

    CreateVirtualAccountResult createVirtualAccount(UUID paymentId, BigDecimal amount);

    boolean validateWebhook(String payload, String signature);

    PaymentWebhookResult parseWebhook(String payload);

    record CreateVirtualAccountResult(
            String virtualAccountNumber,
            String externalReference,
            String provider,
            java.time.Instant expiresAt
    ) {}

    record PaymentWebhookResult(
            String externalReference,
            String status,
            BigDecimal amount
    ) {}
}
