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
public class MessageResponse {

    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String messageType;
    private String content;
    private Instant createdAt;
    private Instant readAt;
}
