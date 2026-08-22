package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.dto.DashboardResponse;
import com.example.ecommerce.admin.dto.SellerVerificationRequest;
import com.example.ecommerce.admin.service.AdminDashboardService;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.response.PagedResponse;
import com.example.ecommerce.common.security.UserPrincipal;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.seller.dto.SellerProfileResponse;
import com.example.ecommerce.seller.service.SellerVerificationService;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.entity.UserRole;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.example.ecommerce.user.entity.UserStatus;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.common.exception.BusinessRuleException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SellerVerificationService sellerVerificationService;
    private final AdminDashboardService adminDashboardService;
    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/sellers/pending")
    public ResponseEntity<ApiResponse<PagedResponse<SellerProfileResponse>>> getPendingSellers(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<SellerProfileResponse> page = sellerVerificationService.getPendingSellers(pageable);
        PagedResponse<SellerProfileResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/sellers/{sellerId}/approve")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> approveSeller(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID sellerId) {
        SellerProfileResponse response = sellerVerificationService.approveSeller(
                sellerId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Seller approved", response));
    }

    @PostMapping("/sellers/{sellerId}/reject")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> rejectSeller(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID sellerId,
            @RequestBody(required = false) SellerVerificationRequest request) {
        String reason = request != null ? request.getRejectionReason() : null;
        SellerProfileResponse response = sellerVerificationService.rejectSeller(
                sellerId, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Seller rejected", response));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse response = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PagedResponse<Object>>> getUsers(
            @RequestParam(required = false) String role,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<User> page;
        if (role != null) {
            page = userRepository.findByRole(UserRole.valueOf(role.toUpperCase()), pageable);
        } else {
            page = userRepository.findAll(pageable);
        }

        var userResponses = page.map(user -> {
            var map = new java.util.LinkedHashMap<String, Object>();
            map.put("id", user.getId());
            map.put("email", user.getEmail());
            map.put("fullName", user.getFullName());
            map.put("phone", user.getPhone());
            map.put("role", user.getRole().name());
            map.put("status", user.getStatus().name());
            map.put("createdAt", user.getCreatedAt());
            return (Object) map;
        });

        PagedResponse<Object> response = PagedResponse.of(
                userResponses.getContent(), userResponses.getNumber(), userResponses.getSize(),
                userResponses.getTotalElements(), userResponses.getTotalPages(), userResponses.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getOrders(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OrderResponse> page = orderService.getAllOrders(pageable);
        PagedResponse<OrderResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/users/{userId}/toggle-status")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (user.getStatus() == UserStatus.ACTIVE) {
            user.setStatus(UserStatus.INACTIVE);
        } else {
            user.setStatus(UserStatus.ACTIVE);
        }
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Status pengguna berhasil diubah"));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        try {
            userRepository.delete(user);
        } catch (Exception e) {
            throw new BusinessRuleException("Tidak dapat menghapus penjual yang memiliki produk atau transaksi. Silakan nonaktifkan penjual saja.");
        }
        return ResponseEntity.ok(ApiResponse.success("Pengguna berhasil dihapus"));
    }
}
