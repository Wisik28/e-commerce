package com.example.ecommerce.common.service;

import com.example.ecommerce.common.entity.AuditLog;
import com.example.ecommerce.common.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private final AuditLogRepository auditLogRepository;

    public void log(UUID actorUserId, String action, String entityType,
                    UUID entityId, String oldValue, String newValue,
                    String ipAddress, String userAgent) {
        AuditLog auditLog = AuditLog.builder()
                .actorUserId(actorUserId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        auditLogRepository.save(auditLog);
        log.info("Audit: {} by user {} on {} {}", action, actorUserId, entityType, entityId);
    }

    public void log(UUID actorUserId, String action, String entityType, UUID entityId) {
        log(actorUserId, action, entityType, entityId, null, null, null, null);
    }
}
