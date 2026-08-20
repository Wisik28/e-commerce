package com.example.ecommerce.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private UUID id;
    private UUID buyerId;
    private String buyerName;
    private UUID sellerId;
    private String sellerStoreName;
    private UUID orderId;
    private Instant createdAt;
    private Instant updatedAt;
}
