package com.example.ecommerce.seller.repository;

import com.example.ecommerce.seller.entity.SellerProfile;
import com.example.ecommerce.seller.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {

    Page<SellerProfile> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    boolean existsByStoreName(String storeName);

    long countByVerificationStatus(VerificationStatus status);
}
