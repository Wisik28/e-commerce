package com.example.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    // return informasi jika token ID tidak tersedia
    @NotBlank(message = "Google ID Token is required")
    private String idToken;
}
