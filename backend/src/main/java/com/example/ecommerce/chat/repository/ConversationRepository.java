package com.example.ecommerce.chat.repository;

import com.example.ecommerce.chat.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE c.buyer.id = :userId OR c.seller.id = :userId")
    Page<Conversation> findByParticipant(@Param("userId") UUID userId, Pageable pageable);

    Optional<Conversation> findByBuyerIdAndSellerId(UUID buyerId, UUID sellerId);

    Optional<Conversation> findByBuyerIdAndSellerIdAndOrderId(UUID buyerId, UUID sellerId, UUID orderId);
}
