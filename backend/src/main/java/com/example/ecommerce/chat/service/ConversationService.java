package com.example.ecommerce.chat.service;

import com.example.ecommerce.chat.dto.*;
import com.example.ecommerce.chat.entity.Conversation;
import com.example.ecommerce.chat.entity.Message;
import com.example.ecommerce.chat.entity.MessageType;
import com.example.ecommerce.chat.repository.ConversationRepository;
import com.example.ecommerce.chat.repository.MessageRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.ForbiddenException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.order.entity.Order;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.entity.UserRole;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final SellerProfileRepository sellerProfileRepository;

    public Page<ConversationResponse> getConversations(UUID userId, Pageable pageable) {
        return conversationRepository.findByParticipant(userId, pageable)
                .map(this::toConversationResponse);
    }

    @Transactional
    public ConversationResponse createConversation(UUID buyerId, CreateConversationRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", buyerId));

        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", request.getSellerId()));

        if (seller.getRole() != UserRole.SELLER) {
            throw new BusinessRuleException("Target user is not a seller");
        }

        // Check if conversation already exists
        if (request.getOrderId() != null) {
            conversationRepository.findByBuyerIdAndSellerIdAndOrderId(
                    buyerId, request.getSellerId(), request.getOrderId())
                    .ifPresent(c -> {
                        throw new BusinessRuleException("Conversation already exists for this order");
                    });
        }

        Conversation conversation = Conversation.builder()
                .buyer(buyer)
                .seller(seller)
                .build();

        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));
            conversation.setOrder(order);
        }

        conversation = conversationRepository.save(conversation);
        return toConversationResponse(conversation);
    }

    public Page<MessageResponse> getMessages(UUID userId, UUID conversationId, Pageable pageable) {
        Conversation conversation = getAuthorizedConversation(userId, conversationId);
        return messageRepository.findByConversationId(conversationId, pageable)
                .map(this::toMessageResponse);
    }

    @Transactional
    public MessageResponse sendMessage(UUID userId, UUID conversationId, SendMessageRequest request) {
        Conversation conversation = getAuthorizedConversation(userId, conversationId);

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        MessageType messageType = MessageType.TEXT;
        if (request.getMessageType() != null) {
            messageType = MessageType.valueOf(request.getMessageType());
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .messageType(messageType)
                .content(request.getContent())
                .build();

        message = messageRepository.save(message);
        return toMessageResponse(message);
    }

    private Conversation getAuthorizedConversation(UUID userId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        boolean isParticipant = conversation.getBuyer().getId().equals(userId)
                || conversation.getSeller().getId().equals(userId);

        if (!isParticipant) {
            throw new ForbiddenException("You are not a participant of this conversation");
        }

        return conversation;
    }

    private ConversationResponse toConversationResponse(Conversation c) {
        String storeName = sellerProfileRepository.findById(c.getSeller().getId())
                .map(p -> p.getStoreName())
                .orElse(null);

        return ConversationResponse.builder()
                .id(c.getId())
                .buyerId(c.getBuyer().getId())
                .buyerName(c.getBuyer().getFullName())
                .sellerId(c.getSeller().getId())
                .sellerStoreName(storeName)
                .orderId(c.getOrder() != null ? c.getOrder().getId() : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MessageResponse toMessageResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .messageType(m.getMessageType().name())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .readAt(m.getReadAt())
                .build();
    }
}
