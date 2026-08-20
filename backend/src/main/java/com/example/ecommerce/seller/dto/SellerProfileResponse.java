package com.example.ecommerce.seller.dto;

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
public class SellerProfileResponse {

    private UUID userId;
    private String email;
    private String fullName;
    private String phone;
    private String storeName;
    private String storeDescription;
    private String verificationStatus;
    private String rejectionReason;
    private Instant verifiedAt;
    private Instant createdAt;
}
