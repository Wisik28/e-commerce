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
import com.example.ecommerce.order.dto.CheckoutRequest;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.entity.Order;
import com.example.ecommerce.order.entity.OrderStatus;
import com.example.ecommerce.order.repository.OrderItemRepository;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.payment.entity.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.entity.UserRole;
import com.example.ecommerce.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CheckoutService checkoutService;

    private User buyer;
    private User seller;
    private Cart cart;
    private Product product;
    private CartItem cartItem;
    private UUID buyerId;
    private UUID cartItemId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        buyerId = UUID.randomUUID();
        cartItemId = UUID.randomUUID();
        productId = UUID.randomUUID();

        buyer = User.builder().id(buyerId).email("buyer@example.com").role(UserRole.BUYER).build();
        seller = User.builder().id(UUID.randomUUID()).email("seller@example.com").role(UserRole.SELLER).build();

        cart = Cart.builder().id(UUID.randomUUID()).buyer(buyer).build();

        product = Product.builder()
                .id(productId)
                .seller(seller)
                .name("Test Product")
                .price(BigDecimal.valueOf(100000))
                .stock(10)
                .status(ProductStatus.ACTIVE)
                .build();

        cartItem = CartItem.builder()
                .id(cartItemId)
                .cart(cart)
                .product(product)
                .quantity(2)
                .build();
    }

    @Test
    @DisplayName("Checkout should set Order status to PENDING_PAYMENT and Payment status to PENDING")
    void checkout_Success_SetsPendingPaymentStatus() throws Exception {
        CheckoutRequest request = new CheckoutRequest();
        request.setCartItemIds(List.of(cartItemId));
        request.setShippingAddress("Jl. Merdeka No. 10");

        when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(cartRepository.findByBuyerId(buyerId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findAllById(List.of(cartItemId))).thenReturn(List.of(cartItem));
        when(productRepository.findAllByIdWithLock(List.of(productId))).thenReturn(List.of(product));
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"address\":\"Jl. Merdeka No. 10\"}");

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order savedOrder = invocation.getArgument(0);
            return savedOrder;
        });

        OrderResponse response = checkoutService.checkout(buyerId, request);

        assertNotNull(response);
        assertEquals(OrderStatus.PENDING_PAYMENT.name(), response.getStatus());
        assertEquals(8, product.getStock()); // Stock decremented from 10 to 8

        verify(orderRepository).save(any(Order.class));
        verify(paymentRepository).save(argThat(payment -> payment.getStatus() == PaymentStatus.PENDING));
        verify(cartItemRepository).deleteAll(List.of(cartItem));
    }

    @Test
    @DisplayName("Checkout should throw InsufficientStockException when stock is low")
    void checkout_InsufficientStock_ThrowsException() {
        product.setStock(1); // Quantity requested is 2

        CheckoutRequest request = new CheckoutRequest();
        request.setCartItemIds(List.of(cartItemId));

        when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(cartRepository.findByBuyerId(buyerId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findAllById(List.of(cartItemId))).thenReturn(List.of(cartItem));
        when(productRepository.findAllByIdWithLock(List.of(productId))).thenReturn(List.of(product));

        assertThrows(InsufficientStockException.class, () -> checkoutService.checkout(buyerId, request));
    }

    @Test
    @DisplayName("Checkout with empty cartItemIds should throw BusinessRuleException")
    void checkout_EmptyCartItemIds_ThrowsException() {
        CheckoutRequest request = new CheckoutRequest();
        request.setCartItemIds(List.of());

        when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(cartRepository.findByBuyerId(buyerId)).thenReturn(Optional.of(cart));

        assertThrows(BusinessRuleException.class, () -> checkoutService.checkout(buyerId, request));
    }
}
