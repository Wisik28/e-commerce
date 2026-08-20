package com.example.ecommerce.payment.repository;

import com.example.ecommerce.payment.entity.PaymentProof;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentProofRepository extends JpaRepository<PaymentProof, UUID> {

    List<PaymentProof> findByPaymentId(UUID paymentId);
}
