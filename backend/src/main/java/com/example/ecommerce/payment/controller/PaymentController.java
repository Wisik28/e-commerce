package com.example.ecommerce.payment.controller;

import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.security.UserPrincipal;
import com.example.ecommerce.payment.dto.CreatePaymentRequest;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payments")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(principal.getId(), orderId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment created", response));
    }

    @GetMapping("/payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId) {
        PaymentResponse response = paymentService.getPayment(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/payment-proof")
    public ResponseEntity<ApiResponse<Void>> uploadPaymentProof(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @RequestBody java.util.Map<String, String> body) {
        paymentService.uploadPaymentProof(principal.getId(), orderId, body.get("proofDataUrl"));
        return ResponseEntity.ok(ApiResponse.success("Payment proof uploaded successfully"));
    }
}
