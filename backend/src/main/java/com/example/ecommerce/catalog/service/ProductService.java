package com.example.ecommerce.catalog.service;

import com.example.ecommerce.catalog.dto.CreateProductRequest;
import com.example.ecommerce.catalog.dto.ProductResponse;
import com.example.ecommerce.catalog.dto.UpdateProductRequest;
import com.example.ecommerce.catalog.entity.Product;
import com.example.ecommerce.catalog.entity.ProductStatus;
import com.example.ecommerce.catalog.repository.ProductRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.ForbiddenException;
import com.example.ecommerce.common.exception.ResourceNotFoundException;
import com.example.ecommerce.seller.entity.SellerProfile;
import com.example.ecommerce.seller.entity.VerificationStatus;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import com.example.ecommerce.user.entity.User;
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
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    public Page<ProductResponse> getActiveProducts(Pageable pageable) {
        return productRepository.findByStatus(ProductStatus.ACTIVE, pageable)
                .map(this::toResponse);
    }

    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchByKeyword(keyword, ProductStatus.ACTIVE, pageable)
                .map(this::toResponse);
    }

    public ProductResponse getProductById(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return toResponse(product);
    }

    public Page<ProductResponse> getSellerProducts(UUID sellerId, Pageable pageable) {
        return productRepository.findBySellerId(sellerId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ProductResponse createProduct(UUID sellerId, CreateProductRequest request) {
        validateSellerApproved(sellerId);

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", sellerId));

        Product product = Product.builder()
                .seller(seller)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .weightGram(request.getWeightGram())
                .status(ProductStatus.ACTIVE)
                .build();

        product = productRepository.save(product);
        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(UUID sellerId, UUID productId, UpdateProductRequest request) {
        Product product = getOwnedProduct(sellerId, productId);

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getStock() != null) product.setStock(request.getStock());
        if (request.getWeightGram() != null) product.setWeightGram(request.getWeightGram());
        if (request.getStatus() != null) product.setStatus(ProductStatus.valueOf(request.getStatus()));

        product = productRepository.save(product);
        return toResponse(product);
    }

    @Transactional
    public void deleteProduct(UUID sellerId, UUID productId) {
        Product product = getOwnedProduct(sellerId, productId);
        // Soft delete
        product.setDeletedAt(Instant.now());
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    private Product getOwnedProduct(UUID sellerId, UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!product.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You do not own this product");
        }
        return product;
    }

    private void validateSellerApproved(UUID sellerId) {
        SellerProfile profile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new BusinessRuleException("Seller profile not found"));

        if (profile.getVerificationStatus() == VerificationStatus.REJECTED) {
            throw new BusinessRuleException("Seller profile has been REJECTED by admin");
        }
    }

    private ProductResponse toResponse(Product product) {
        String storeName = null;
        if (product.getSeller() != null) {
            SellerProfile profile = sellerProfileRepository.findById(product.getSeller().getId())
                    .orElse(null);
            if (profile != null) storeName = profile.getStoreName();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .sellerId(product.getSeller().getId())
                .sellerStoreName(storeName)
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .weightGram(product.getWeightGram())
                .status(product.getStatus().name())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
