package com.example.ecommerce.auth.service;

import com.example.ecommerce.auth.dto.*;
import com.example.ecommerce.auth.entity.RefreshToken;
import com.example.ecommerce.auth.repository.RefreshTokenRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.DuplicateResourceException;
import com.example.ecommerce.common.exception.UnauthorizedException;
import com.example.ecommerce.common.security.JwtService;
import com.example.ecommerce.seller.entity.SellerProfile;
import com.example.ecommerce.seller.entity.VerificationStatus;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.entity.UserRole;
import com.example.ecommerce.user.entity.UserStatus;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse registerBuyer(RegisterBuyerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.BUYER)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        log.info("Buyer registered: {}", user.getEmail());

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse registerSeller(RegisterSellerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }
        if (sellerProfileRepository.existsByStoreName(request.getStoreName())) {
            throw new DuplicateResourceException("Store", "name", request.getStoreName());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.SELLER)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .storeName(request.getStoreName())
                .storeDescription(request.getStoreDescription())
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        sellerProfileRepository.save(profile);
        log.info("Seller registered (PENDING): {}", user.getEmail());

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessRuleException("Account is not active");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = hashToken(request.getRefreshToken());

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new UnauthorizedException("Refresh token has been revoked");
        }
        if (refreshToken.isExpired()) {
            throw new UnauthorizedException("Refresh token has expired");
        }

        // Revoke old token
        refreshToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        return generateAuthResponse(user);
    }

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String refreshTokenStr = jwtService.generateRefreshToken(user.getId(), user.getRole().name());

        // Save refresh token hash
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(refreshTokenStr))
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshExpiration()))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .role(user.getRole().name())
                .expiresIn(jwtService.getAccessExpiration())
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
