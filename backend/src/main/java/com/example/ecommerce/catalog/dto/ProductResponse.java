package com.example.ecommerce.catalog.dto;

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
public class ProductResponse {

    private UUID id;
    private UUID sellerId;
    private String sellerStoreName;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private Integer weightGram;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
