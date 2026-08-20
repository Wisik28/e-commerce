package com.example.ecommerce.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private String messageType; // TEXT, IMAGE, PAYMENT_PROOF — defaults to TEXT
}
