package com.example.ecommerce.seller.controller;

import com.example.ecommerce.catalog.dto.CreateProductRequest;
import com.example.ecommerce.catalog.dto.ProductResponse;
import com.example.ecommerce.catalog.dto.UpdateProductRequest;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.response.PagedResponse;
import com.example.ecommerce.common.security.UserPrincipal;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.payment.dto.ConfirmManualPaymentRequest;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.payment.service.ManualPaymentService;
import com.example.ecommerce.seller.dto.SellerProfileResponse;
import com.example.ecommerce.seller.service.SellerVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/seller")
@RequiredArgsConstructor
public class SellerController {

    private final SellerVerificationService sellerVerificationService;
    private final ProductService productService;
    private final OrderService orderService;
    private final ManualPaymentService manualPaymentService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> getProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        SellerProfileResponse response = sellerVerificationService.getSellerProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.createProduct(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", response));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getProducts(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductResponse> page = productService.getSellerProducts(principal.getId(), pageable);
        PagedResponse<ProductResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request) {
        ProductResponse response = productService.updateProduct(principal.getId(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated", response));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID productId) {
        productService.deleteProduct(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Product deleted"));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OrderResponse> page = orderService.getSellerOrders(principal.getId(), pageable);
        PagedResponse<OrderResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/orders/{orderId}/payment/confirm-manual")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmManualPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @Valid @RequestBody ConfirmManualPaymentRequest request) {
        PaymentResponse response = manualPaymentService.confirmManualPayment(
                principal.getId(), orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Payment confirmed", response));
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        OrderResponse response = orderService.updateOrderStatus(orderId, principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", response));
    }
}
