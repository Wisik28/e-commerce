package com.example.ecommerce.seller.service;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.common.service.AuditLogService;
import com.example.ecommerce.seller.dto.SellerProfileResponse;
import com.example.ecommerce.seller.entity.SellerProfile;
import com.example.ecommerce.seller.entity.VerificationStatus;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.entity.UserStatus;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SellerVerificationService {

    private final SellerProfileRepository sellerProfileRepository;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    public Page<SellerProfileResponse> getPendingSellers(Pageable pageable) {
        return sellerProfileRepository
                .findByVerificationStatus(VerificationStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    public SellerProfileResponse getSellerProfile(UUID userId) {
        SellerProfile profile = sellerProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "userId", userId));
        return toResponse(profile);
    }

    @Transactional
    public SellerProfileResponse approveSeller(UUID sellerId, UUID adminId) {
        SellerProfile profile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "userId", sellerId));

        if (profile.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BusinessRuleException("Seller is not in PENDING status");
        }

        profile.setVerificationStatus(VerificationStatus.APPROVED);
        profile.setVerifiedBy(adminId);
        profile.setVerifiedAt(Instant.now());
        sellerProfileRepository.save(profile);

        User user = profile.getUser();
        if (user != null) {
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
        }

        auditLogService.log(adminId, "SELLER_APPROVED", "SELLER_PROFILE", sellerId);

        return toResponse(profile);
    }

    @Transactional
    public SellerProfileResponse rejectSeller(UUID sellerId, UUID adminId, String reason) {
        SellerProfile profile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "userId", sellerId));

        if (profile.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BusinessRuleException("Seller is not in PENDING status");
        }

        profile.setVerificationStatus(VerificationStatus.REJECTED);
        profile.setRejectionReason(reason);
        profile.setVerifiedBy(adminId);
        profile.setVerifiedAt(Instant.now());
        sellerProfileRepository.save(profile);

        auditLogService.log(adminId, "SELLER_REJECTED", "SELLER_PROFILE", sellerId);

        return toResponse(profile);
    }

    private SellerProfileResponse toResponse(SellerProfile profile) {
        User user = profile.getUser();
        return SellerProfileResponse.builder()
                .userId(profile.getUserId())
                .email(user != null ? user.getEmail() : null)
                .fullName(user != null ? user.getFullName() : null)
                .phone(user != null ? user.getPhone() : null)
                .storeName(profile.getStoreName())
                .storeDescription(profile.getStoreDescription())
                .verificationStatus(profile.getVerificationStatus().name())
                .rejectionReason(profile.getRejectionReason())
                .verifiedAt(profile.getVerifiedAt())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
