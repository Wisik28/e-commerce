package com.example.ecommerce.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePaymentRequest {

    @NotNull(message = "Payment method is required")
    private String paymentMethod; // VIRTUAL_ACCOUNT or MANUAL

    private String bank; // bni, bca, etc.
}
