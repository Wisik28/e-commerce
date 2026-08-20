package com.example.ecommerce.auth.controller;

import com.example.ecommerce.auth.dto.*;
import com.example.ecommerce.auth.service.AuthService;
import com.example.ecommerce.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/buyer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerBuyer(
            @Valid @RequestBody RegisterBuyerRequest request) {
        AuthResponse response = authService.registerBuyer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Buyer registered successfully", response));
    }

    @PostMapping("/register/seller")
    public ResponseEntity<ApiResponse<AuthResponse>> registerSeller(
            @Valid @RequestBody RegisterSellerRequest request) {
        AuthResponse response = authService.registerSeller(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Seller registered successfully. Awaiting admin approval.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }
}
