package com.example.ecommerce.cart.controller;

import com.example.ecommerce.cart.dto.AddCartItemRequest;
import com.example.ecommerce.cart.dto.CartResponse;
import com.example.ecommerce.cart.dto.UpdateCartItemRequest;
import com.example.ecommerce.cart.service.CartService;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal UserPrincipal principal) {
        CartResponse response = cartService.getCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddCartItemRequest request) {
        CartResponse response = cartService.addItem(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added to cart", response));
    }

    @PatchMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse response = cartService.updateItem(principal.getId(), itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Cart item updated", response));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID itemId) {
        cartService.removeItem(principal.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart"));
    }
}
