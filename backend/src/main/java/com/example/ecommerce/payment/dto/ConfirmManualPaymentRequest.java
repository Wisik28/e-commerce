package com.example.ecommerce.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmManualPaymentRequest {

    @NotBlank(message = "Action is required (APPROVE or REJECT)")
    private String action; // APPROVE or REJECT

    private String note;
}
