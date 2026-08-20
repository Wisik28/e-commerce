package com.example.ecommerce.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateConversationRequest {

    @NotNull(message = "Seller ID is required")
    private UUID sellerId;

    private UUID orderId;
}
