package com.example.ecommerce.auth.service;

import com.example.ecommerce.auth.dto.*;
import com.example.ecommerce.auth.entity.RefreshToken;
import com.example.ecommerce.auth.repository.RefreshTokenRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.DuplicateResourceException;
import com.example.ecommerce.common.exception.UnauthorizedException;
import com.example.ecommerce.common.exception.UserNotRegisteredException;
import com.example.ecommerce.common.recaptcha.service.RecaptchaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
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
    private final RecaptchaService recaptchaService;

    // inisialisasi nilai client ID 
    @Value("${google.client-id}")
    private String googleClientId;

    // inisialisasi nilai client secret
    @Value("${google.client-secret:}")
    private String googleClientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public AuthResponse registerBuyer(RegisterBuyerRequest request) {
        recaptchaService.validateRecaptcha(request.getRecaptchaToken());

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
        recaptchaService.validateRecaptcha(request.getRecaptchaToken());

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
                .status(UserStatus.INACTIVE)
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
        recaptchaService.validateRecaptcha(request.getRecaptchaToken());

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

    // method untuk 
    private GoogleUserInfoDto verifyGoogleToken(String idToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        try {
            GoogleUserInfoDto userInfo = restTemplate.getForObject(url, GoogleUserInfoDto.class);
            if (userInfo == null) {
                throw new UnauthorizedException("Google token verification returned empty response");
            }
            if (googleClientId != null && !googleClientId.trim().isEmpty() && !googleClientId.equals(userInfo.getAud())) {
                log.error("Google token audience mismatch. Expected: {}, Got: {}", googleClientId, userInfo.getAud());
                throw new UnauthorizedException("Google token audience mismatch");
            }
            if (!"true".equalsIgnoreCase(userInfo.getEmailVerified())) {
                throw new UnauthorizedException("Google email is not verified");
            }
            return userInfo;
        } catch (Exception e) {
            log.error("Failed to verify Google token: {}", e.getMessage());
            throw new UnauthorizedException("Invalid Google token: " + e.getMessage());
        }
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleUserInfoDto userInfo = verifyGoogleToken(request.getIdToken());
        User user = userRepository.findByEmail(userInfo.getEmail())
                .orElseThrow(() -> new UserNotRegisteredException(userInfo));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessRuleException("Account is not active");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse registerGoogleBuyer(GoogleRegisterBuyerRequest request) {
        GoogleUserInfoDto userInfo = verifyGoogleToken(request.getIdToken());

        if (userRepository.existsByEmail(userInfo.getEmail())) {
            throw new DuplicateResourceException("User", "email", userInfo.getEmail());
        }

        User user = User.builder()
                .email(userInfo.getEmail())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(userInfo.getName() != null ? userInfo.getName() : "Google User")
                .phone(request.getPhone())
                .role(UserRole.BUYER)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        log.info("Google Buyer registered: {}", user.getEmail());

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse registerGoogleSeller(GoogleRegisterSellerRequest request) {
        GoogleUserInfoDto userInfo = verifyGoogleToken(request.getIdToken());

        if (userRepository.existsByEmail(userInfo.getEmail())) {
            throw new DuplicateResourceException("User", "email", userInfo.getEmail());
        }
        if (sellerProfileRepository.existsByStoreName(request.getStoreName())) {
            throw new DuplicateResourceException("Store", "name", request.getStoreName());
        }

        User user = User.builder()
                .email(userInfo.getEmail())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(userInfo.getName() != null ? userInfo.getName() : "Google User")
                .phone(request.getPhone())
                .role(UserRole.SELLER)
                .status(UserStatus.INACTIVE)
                .build();

        user = userRepository.save(user);

        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .storeName(request.getStoreName())
                .storeDescription(request.getStoreDescription())
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        sellerProfileRepository.save(profile);
        log.info("Google Seller registered (PENDING): {}", user.getEmail());

        return generateAuthResponse(user);
    }
}
