package com.example.ecommerce.payment.integration.provider;

import com.example.ecommerce.payment.integration.PaymentGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class MockPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentGateway.class);

    @Override
    public CreateVirtualAccountResult createVirtualAccount(UUID paymentId, BigDecimal amount) {
        log.info("Mock: Creating VA for payment {} amount {}", paymentId, amount);

        String vaNumber = "VA-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String externalRef = "MOCK-" + paymentId.toString().substring(0, 8);
        Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);

        return new CreateVirtualAccountResult(vaNumber, externalRef, "MOCK", expiresAt);
    }

    @Override
    public boolean validateWebhook(String payload, String signature) {
        log.info("Mock: Validating webhook signature");
        // Mock always validates
        return true;
    }

    @Override
    public PaymentWebhookResult parseWebhook(String payload) {
        log.info("Mock: Parsing webhook payload");
        // In a real implementation, parse the JSON payload from the provider
        return new PaymentWebhookResult("mock-reference", "PAID", BigDecimal.ZERO);
    }
}
