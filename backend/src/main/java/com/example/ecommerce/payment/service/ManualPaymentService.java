package com.example.ecommerce.payment.service;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.ForbiddenException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.common.service.AuditLogService;
import com.example.ecommerce.order.entity.Order;
import com.example.ecommerce.order.entity.OrderStatus;
import com.example.ecommerce.order.repository.OrderItemRepository;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.payment.dto.ConfirmManualPaymentRequest;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.payment.entity.Payment;
import com.example.ecommerce.payment.entity.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ManualPaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public PaymentResponse confirmManualPayment(UUID sellerId, UUID orderId,
                                                 ConfirmManualPaymentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Validate seller has items in this order
        boolean hasItems = orderItemRepository.findByOrderId(orderId).stream()
                .anyMatch(item -> item.getSeller().getId().equals(sellerId));

        if (!hasItems) {
            throw new ForbiddenException("You do not have items in this order");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Payment is already confirmed");
        }

        if (payment.getStatus() != PaymentStatus.PROOF_SUBMITTED &&
            payment.getStatus() != PaymentStatus.PENDING) {
            throw new BusinessRuleException("Payment cannot be confirmed in current status: " +
                    payment.getStatus());
        }

        String action = request.getAction().toUpperCase();

        if ("APPROVE".equals(action)) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
            paymentRepository.save(payment);

            order.setStatus(OrderStatus.PAID);
            order.setPaidAt(Instant.now());
            orderRepository.save(order);

            auditLogService.log(sellerId, "PAYMENT_MANUAL_CONFIRMED", "PAYMENT", payment.getId());
        } else if ("REJECT".equals(action)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(request.getNote());
            paymentRepository.save(payment);

            auditLogService.log(sellerId, "PAYMENT_MANUAL_REJECTED", "PAYMENT", payment.getId());
        } else {
            throw new BusinessRuleException("Action must be APPROVE or REJECT");
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(order.getId())
                .paymentMethod(payment.getPaymentMethod().name())
                .status(payment.getStatus().name())
                .amount(payment.getAmount())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
