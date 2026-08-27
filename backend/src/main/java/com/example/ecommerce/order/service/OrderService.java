package com.example.ecommerce.order.service;

import com.example.ecommerce.common.exception.ForbiddenException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.order.dto.OrderItemResponse;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.entity.Order;
import com.example.ecommerce.order.entity.OrderItem;
import com.example.ecommerce.order.repository.OrderItemRepository;
import com.example.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import com.example.ecommerce.order.entity.OrderStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public Page<OrderResponse> getBuyerOrders(UUID buyerId, Pageable pageable) {
        Page<Order> orders = orderRepository.findByBuyerId(buyerId, pageable);
        return mapOrdersToResponses(orders);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Check if user is buyer or has items as seller
        boolean isBuyer = order.getBuyer().getId().equals(userId);
        boolean isSeller = orderItemRepository.existsByOrderIdAndSellerId(orderId, userId);

        if (!isBuyer && !isSeller) {
            throw new ForbiddenException("You do not have access to this order");
        }

        return toOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getSellerOrders(UUID sellerId, Pageable pageable) {
        Page<Order> orders = orderItemRepository.findOrdersBySellerId(sellerId, pageable);
        return mapOrdersToResponses(orders);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        Page<Order> orders = orderRepository.findAll(pageable);
        return mapOrdersToResponses(orders);
    }

    private Page<OrderResponse> mapOrdersToResponses(Page<Order> orders) {
        if (orders.isEmpty()) {
            return orders.map(this::toOrderResponse);
        }

        List<UUID> orderIds = orders.getContent().stream()
                .map(Order::getId)
                .collect(Collectors.toList());

        List<OrderItem> allItems = orderItemRepository.findByOrderIdIn(orderIds);
        var itemsByOrderId = allItems.stream()
                .collect(Collectors.groupingBy(item -> item.getOrder().getId()));

        return orders.map(order -> {
            List<OrderItem> items = itemsByOrderId.getOrDefault(order.getId(), List.of());
            order.setItems(items);
            return toOrderResponseWithItems(order, items);
        });
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItem> items = order.getItems() != null && !order.getItems().isEmpty()
                ? order.getItems()
                : orderItemRepository.findByOrderId(order.getId());
        return toOrderResponseWithItems(order, items);
    }

    private OrderResponse toOrderResponseWithItems(Order order, List<OrderItem> items) {
        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .sellerId(item.getSeller().getId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .lineTotal(item.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .buyerId(order.getBuyer().getId())
                .status(order.getStatus().name())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .paidAt(order.getPaidAt())
                .completedAt(order.getCompletedAt())
                .build();
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, UUID sellerId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        boolean hasItems = orderItemRepository.existsByOrderIdAndSellerId(orderId, sellerId);

        if (!hasItems) {
            throw new ForbiddenException("You do not have access to this order");
        }

        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        if (status.equalsIgnoreCase("COMPLETED")) {
            order.setCompletedAt(java.time.Instant.now());
        }
        orderRepository.save(order);
        return toOrderResponse(order);
    }

}
