package com.example.ecommerce.admin.service;

import com.example.ecommerce.admin.dto.DashboardResponse;
import com.example.ecommerce.catalog.entity.ProductStatus;
import com.example.ecommerce.catalog.repository.ProductRepository;
import com.example.ecommerce.order.entity.OrderStatus;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.payment.entity.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import com.example.ecommerce.seller.entity.VerificationStatus;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import com.example.ecommerce.user.entity.UserRole;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public DashboardResponse getDashboardStats() {
        // Orders by status
        Map<String, Long> ordersByStatus = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            ordersByStatus.put(status.name(), orderRepository.countByStatus(status));
        }

        // Payments by status
        Map<String, Long> paymentsByStatus = new HashMap<>();
        for (PaymentStatus status : PaymentStatus.values()) {
            paymentsByStatus.put(status.name(), paymentRepository.countByStatus(status));
        }

        return DashboardResponse.builder()
                .totalBuyers(userRepository.countByRole(UserRole.BUYER))
                .totalSellers(userRepository.countByRole(UserRole.SELLER))
                .pendingSellers(sellerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING))
                .totalActiveProducts(productRepository.countByStatus(ProductStatus.ACTIVE))
                .totalOrders(orderRepository.count())
                .ordersByStatus(ordersByStatus)
                .paymentsByStatus(paymentsByStatus)
                .pendingManualPayments(paymentRepository.countByStatus(PaymentStatus.PROOF_SUBMITTED))
                .build();
    }
}
