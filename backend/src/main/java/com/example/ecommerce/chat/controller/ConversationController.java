package com.example.ecommerce.chat.controller;

import com.example.ecommerce.chat.dto.*;
import com.example.ecommerce.chat.service.ConversationService;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.response.PagedResponse;
import com.example.ecommerce.common.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ConversationResponse> page = conversationService.getConversations(
                principal.getId(), pageable);
        PagedResponse<ConversationResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateConversationRequest request) {
        ConversationResponse response = conversationService.createConversation(
                principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation created", response));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<PagedResponse<MessageResponse>>> getMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId,
            @PageableDefault(size = 50) Pageable pageable) {
        Page<MessageResponse> page = conversationService.getMessages(
                principal.getId(), conversationId, pageable);
        PagedResponse<MessageResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = conversationService.sendMessage(
                principal.getId(), conversationId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", response));
    }
}
