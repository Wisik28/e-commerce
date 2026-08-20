package com.example.ecommerce.payment.repository;

import com.example.ecommerce.payment.entity.Payment;
import com.example.ecommerce.payment.entity.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByOrderId(UUID orderId);

    Optional<Payment> findByExternalReference(String externalReference);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.externalReference = :ref")
    Optional<Payment> findByExternalReferenceWithLock(@Param("ref") String externalReference);

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    long countByStatus(PaymentStatus status);
}
