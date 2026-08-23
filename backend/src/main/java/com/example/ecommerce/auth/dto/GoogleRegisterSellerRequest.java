package com.example.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
// class DTO untuk requirements data seller
public class GoogleRegisterSellerRequest {

    @NotBlank(message = "Google ID Token is required")
    private String idToken;

    @NotBlank(message = "Phone is required")
    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @NotBlank(message = "Store name is required")
    @Size(max = 150, message = "Store name must not exceed 150 characters")
    private String storeName;

    private String storeDescription;
}
