package com.example.ecommerce.order.controller;

import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.response.PagedResponse;
import com.example.ecommerce.common.security.UserPrincipal;
import com.example.ecommerce.order.dto.CheckoutRequest;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.service.CheckoutService;
import com.example.ecommerce.order.service.OrderService;
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
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CheckoutService checkoutService;
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckoutRequest request) {
        OrderResponse response = checkoutService.checkout(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OrderResponse> page = orderService.getBuyerOrders(principal.getId(), pageable);
        PagedResponse<OrderResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId) {
        OrderResponse response = orderService.getOrderById(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
