package com.example.ecommerce.order.service;

import com.example.ecommerce.cart.entity.Cart;
import com.example.ecommerce.cart.entity.CartItem;
import com.example.ecommerce.cart.repository.CartItemRepository;
import com.example.ecommerce.cart.repository.CartRepository;
import com.example.ecommerce.catalog.entity.Product;
import com.example.ecommerce.catalog.entity.ProductStatus;
import com.example.ecommerce.catalog.repository.ProductRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.InsufficientStockException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.order.dto.CheckoutRequest;
import com.example.ecommerce.order.dto.OrderItemResponse;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.entity.Order;
import com.example.ecommerce.order.entity.OrderItem;
import com.example.ecommerce.order.entity.OrderStatus;
import com.example.ecommerce.order.repository.OrderItemRepository;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.payment.entity.Payment;
import com.example.ecommerce.payment.entity.PaymentMethod;
import com.example.ecommerce.payment.entity.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse checkout(UUID buyerId, CheckoutRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", buyerId));

        Cart cart = cartRepository.findByBuyerId(buyerId)
                .orElseThrow(() -> new BusinessRuleException("Cart is empty"));

        // Load selected cart items
        List<CartItem> selectedItems = request.getCartItemIds().stream()
                .map(id -> cartItemRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", id)))
                .collect(Collectors.toList());

        if (selectedItems.isEmpty()) {
            throw new BusinessRuleException("No items selected for checkout");
        }

        // Validate ownership
        for (CartItem item : selectedItems) {
            if (!item.getCart().getId().equals(cart.getId())) {
                throw new BusinessRuleException("Cart item does not belong to your cart");
            }
        }

        // Lock products for stock validation
        List<UUID> productIds = selectedItems.stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList());
        List<Product> lockedProducts = productRepository.findAllByIdWithLock(productIds);

        // Validate products and stock
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : selectedItems) {
            Product product = lockedProducts.stream()
                    .filter(p -> p.getId().equals(cartItem.getProduct().getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", cartItem.getProduct().getId()));

            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw new BusinessRuleException("Product '" + product.getName() + "' is not active");
            }

            if (product.getStock() < cartItem.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(), cartItem.getQuantity(), product.getStock());
            }

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            // Decrement stock
            product.setStock(product.getStock() - cartItem.getQuantity());

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .seller(product.getSeller())
                    .productName(product.getName())
                    .unitPrice(product.getPrice())
                    .quantity(cartItem.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
            orderItems.add(orderItem);
        }

        // Save updated stock
        productRepository.saveAll(lockedProducts);

        // Create order
        BigDecimal shippingFee = BigDecimal.ZERO; // Simplified for MVP
        BigDecimal totalAmount = subtotal.add(shippingFee);

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .buyer(buyer)
                .status(OrderStatus.PENDING_PAYMENT)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .shippingAddress(request.getShippingAddress())
                .notes(request.getNotes())
                .build();

        order = orderRepository.save(order);

        // Save order items
        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }
        orderItemRepository.saveAll(orderItems);

        // Create payment PENDING
        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.VIRTUAL_ACCOUNT)
                .status(PaymentStatus.PENDING)
                .amount(totalAmount)
                .build();
        paymentRepository.save(payment);

        // Clear checked-out cart items
        cartItemRepository.deleteAll(selectedItems);

        order.setItems(orderItems);
        return toOrderResponse(order);
    }

    private String generateOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "ORD-" + datePart + "-" + randomPart;
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
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
                .items(items)
                .createdAt(order.getCreatedAt())
                .paidAt(order.getPaidAt())
                .completedAt(order.getCompletedAt())
                .build();
    }
}
