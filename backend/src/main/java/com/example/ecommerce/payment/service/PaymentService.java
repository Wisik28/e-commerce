package com.example.ecommerce.payment.service;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.PaymentException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.common.service.AuditLogService;
import com.example.ecommerce.order.entity.Order;
import com.example.ecommerce.order.entity.OrderStatus;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.payment.dto.CreatePaymentRequest;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.payment.entity.Payment;
import com.example.ecommerce.payment.entity.PaymentMethod;
import com.example.ecommerce.payment.entity.PaymentStatus;
import com.example.ecommerce.payment.integration.PaymentGateway;
import com.example.ecommerce.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
    private final AuditLogService auditLogService;

    @Transactional
    public PaymentResponse createPayment(UUID buyerId, UUID orderId, CreatePaymentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new BusinessRuleException("Order does not belong to this buyer");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessRuleException("Order is not in PENDING_PAYMENT status");
        }

        // Check if active payment already exists
        paymentRepository.findByOrderId(orderId).ifPresent(existing -> {
            if (existing.getStatus() != PaymentStatus.FAILED &&
                existing.getStatus() != PaymentStatus.CANCELLED &&
                existing.getStatus() != PaymentStatus.EXPIRED) {
                throw new BusinessRuleException("An active payment already exists for this order");
            }
        });

        PaymentMethod method = PaymentMethod.valueOf(request.getPaymentMethod());

        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(method)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .build();

        payment = paymentRepository.save(payment);

        // For VA, call payment gateway
        if (method == PaymentMethod.VIRTUAL_ACCOUNT) {
            try {
                var result = paymentGateway.createVirtualAccount(payment.getId(), order.getTotalAmount());
                payment.setVirtualAccountNumber(result.virtualAccountNumber());
                payment.setExternalReference(result.externalReference());
                payment.setProvider(result.provider());
                payment.setExpiresAt(result.expiresAt());
                payment.setStatus(PaymentStatus.PROCESSING);
                payment = paymentRepository.save(payment);
            } catch (Exception e) {
                log.error("Failed to create VA: {}", e.getMessage());
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Failed to create virtual account");
                paymentRepository.save(payment);
                throw new PaymentException("Failed to create virtual account payment");
            }
        }

        return toResponse(payment);
    }

    public PaymentResponse getPayment(UUID orderId, UUID userId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        return toResponse(payment);
    }

    @Transactional
    public void processWebhook(String provider, String payload, String signature) {
        if (!paymentGateway.validateWebhook(payload, signature)) {
            throw new PaymentException("Invalid webhook signature");
        }

        var result = paymentGateway.parseWebhook(payload);

        Payment payment = paymentRepository.findByExternalReferenceWithLock(result.externalReference())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "externalReference",
                        result.externalReference()));

        // Idempotency check
        if (payment.getStatus() == PaymentStatus.PAID) {
            log.info("Payment already PAID, ignoring duplicate webhook for {}", result.externalReference());
            return;
        }

        if ("PAID".equals(result.status())) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
            paymentRepository.save(payment);

            // Update order
            Order order = payment.getOrder();
            order.setStatus(OrderStatus.PAID);
            order.setPaidAt(Instant.now());
            orderRepository.save(order);

            auditLogService.log(null, "PAYMENT_STATUS_CHANGED", "PAYMENT", payment.getId());
        }
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .paymentMethod(payment.getPaymentMethod().name())
                .status(payment.getStatus().name())
                .amount(payment.getAmount())
                .provider(payment.getProvider())
                .virtualAccountNumber(payment.getVirtualAccountNumber())
                .expiresAt(payment.getExpiresAt())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
