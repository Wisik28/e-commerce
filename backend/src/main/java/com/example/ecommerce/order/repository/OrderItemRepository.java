package com.example.ecommerce.order.repository;

import com.example.ecommerce.order.entity.OrderItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderId(UUID orderId);

    List<OrderItem> findByOrderIdIn(List<UUID> orderIds);

    boolean existsByOrderIdAndSellerId(UUID orderId, UUID sellerId);

    @Query("SELECT DISTINCT oi.order FROM OrderItem oi WHERE oi.seller.id = :sellerId")
    Page<com.example.ecommerce.order.entity.Order> findOrdersBySellerId(
            @Param("sellerId") UUID sellerId, Pageable pageable);

    List<OrderItem> findBySellerId(UUID sellerId);

    @Query("SELECT COUNT(DISTINCT oi.order.id) FROM OrderItem oi WHERE oi.seller.id = :sellerId")
    long countOrdersBySellerId(@Param("sellerId") UUID sellerId);
}
