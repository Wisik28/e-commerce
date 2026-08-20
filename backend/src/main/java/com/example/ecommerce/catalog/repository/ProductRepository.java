package com.example.ecommerce.catalog.repository;

import com.example.ecommerce.catalog.entity.Product;
import com.example.ecommerce.catalog.entity.ProductStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    Page<Product> findBySellerIdAndStatus(UUID sellerId, ProductStatus status, Pageable pageable);

    Page<Product> findBySellerId(UUID sellerId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id IN :ids")
    List<Product> findAllByIdWithLock(@Param("ids") List<UUID> ids);

    long countByStatus(ProductStatus status);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchByKeyword(@Param("keyword") String keyword,
                                  @Param("status") ProductStatus status,
                                  Pageable pageable);
}
