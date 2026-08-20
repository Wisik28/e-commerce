package com.example.ecommerce.cart.service;

import com.example.ecommerce.cart.dto.*;
import com.example.ecommerce.cart.entity.Cart;
import com.example.ecommerce.cart.entity.CartItem;
import com.example.ecommerce.cart.repository.CartItemRepository;
import com.example.ecommerce.cart.repository.CartRepository;
import com.example.ecommerce.catalog.entity.Product;
import com.example.ecommerce.catalog.entity.ProductStatus;
import com.example.ecommerce.catalog.repository.ProductRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(UUID buyerId) {
        Cart cart = getOrCreateCart(buyerId);
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return toCartResponse(cart, items);
    }

    @Transactional
    public CartResponse addItem(UUID buyerId, AddCartItemRequest request) {
        Cart cart = getOrCreateCart(buyerId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new BusinessRuleException("Product is not active");
        }

        Optional<CartItem> existing = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), product.getId());

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(item);
        }

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return toCartResponse(cart, items);
    }

    @Transactional
    public CartResponse updateItem(UUID buyerId, UUID itemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(buyerId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BusinessRuleException("Cart item does not belong to your cart");
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return toCartResponse(cart, items);
    }

    @Transactional
    public void removeItem(UUID buyerId, UUID itemId) {
        Cart cart = getOrCreateCart(buyerId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BusinessRuleException("Cart item does not belong to your cart");
        }

        cartItemRepository.delete(item);
    }

    private Cart getOrCreateCart(UUID buyerId) {
        return cartRepository.findByBuyerId(buyerId)
                .orElseGet(() -> {
                    User buyer = userRepository.findById(buyerId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", buyerId));
                    Cart cart = Cart.builder().buyer(buyer).build();
                    return cartRepository.save(cart);
                });
    }

    private CartResponse toCartResponse(Cart cart, List<CartItem> items) {
        List<CartItemResponse> itemResponses = items.stream()
                .map(item -> {
                    Product product = item.getProduct();
                    BigDecimal subtotal = product.getPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()));
                    return CartItemResponse.builder()
                            .id(item.getId())
                            .productId(product.getId())
                            .productName(product.getName())
                            .productPrice(product.getPrice())
                            .productStock(product.getStock())
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal total = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalAmount(total)
                .totalItems(itemResponses.size())
                .build();
    }
}
