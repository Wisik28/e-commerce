package com.example.ecommerce.payment.controller;

import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments/webhooks")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/{provider}")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(
            @PathVariable String provider,
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature) {
        paymentService.processWebhook(provider, payload, signature);
        return ResponseEntity.ok(ApiResponse.success("Webhook processed"));
    }
}
