package com.example.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoogleRegisterBuyerRequest {

    @NotBlank(message = "Google ID Token is required")
    private String idToken;

    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;
}
