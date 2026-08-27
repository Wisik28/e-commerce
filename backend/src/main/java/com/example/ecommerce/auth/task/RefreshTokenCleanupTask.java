package com.example.ecommerce.auth.task;

import com.example.ecommerce.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupTask.class);
    private final RefreshTokenRepository refreshTokenRepository;

    // Run every day at 3:00 AM
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void purgeExpiredTokens() {
        log.info("Starting scheduled cleanup of expired refresh tokens...");
        try {
            refreshTokenRepository.deleteByExpiresAtBeforeOrRevoked(Instant.now());
            log.info("Finished scheduled cleanup of expired refresh tokens.");
        } catch (Exception e) {
            log.error("Failed to cleanup expired refresh tokens: {}", e.getMessage(), e);
        }
    }
}
