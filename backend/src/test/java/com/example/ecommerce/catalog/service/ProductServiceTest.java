package com.example.ecommerce.catalog.service;

import com.example.ecommerce.catalog.dto.CreateProductRequest;
import com.example.ecommerce.catalog.dto.ProductResponse;
import com.example.ecommerce.catalog.entity.Product;
import com.example.ecommerce.catalog.entity.ProductStatus;
import com.example.ecommerce.catalog.repository.ProductRepository;
import com.example.ecommerce.seller.entity.SellerProfile;
import com.example.ecommerce.seller.entity.VerificationStatus;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.entity.UserRole;
import com.example.ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @InjectMocks
    private ProductService productService;

    private User seller;
    private SellerProfile sellerProfile;
    private Product product;
    private UUID sellerId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        sellerId = UUID.randomUUID();
        productId = UUID.randomUUID();

        seller = User.builder().id(sellerId).email("seller@example.com").role(UserRole.SELLER).build();

        sellerProfile = SellerProfile.builder()
                .userId(sellerId)
                .storeName("Toko Berkah")
                .verificationStatus(VerificationStatus.APPROVED)
                .build();

        product = Product.builder()
                .id(productId)
                .seller(seller)
                .name("Laptop Gaming")
                .description("Laptop spek tinggi")
                .price(BigDecimal.valueOf(15000000))
                .stock(5)
                .status(ProductStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("getActiveProducts should return page of ProductResponse with seller store names")
    void getActiveProducts_ReturnsPageWithStoreNames() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product), pageable, 1);

        when(productRepository.findByStatus(ProductStatus.ACTIVE, pageable)).thenReturn(productPage);
        when(sellerProfileRepository.findAllById(List.of(sellerId))).thenReturn(List.of(sellerProfile));

        Page<ProductResponse> result = productService.getActiveProducts(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Laptop Gaming", result.getContent().get(0).getName());
        assertEquals("Toko Berkah", result.getContent().get(0).getSellerStoreName());

        verify(productRepository).findByStatus(ProductStatus.ACTIVE, pageable);
        verify(sellerProfileRepository).findAllById(List.of(sellerId));
    }

    @Test
    @DisplayName("createProduct should create and return product when seller is approved")
    void createProduct_Success() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Mouse Wireless");
        request.setPrice(BigDecimal.valueOf(150000));
        request.setStock(20);

        when(sellerProfileRepository.findById(sellerId)).thenReturn(Optional.of(sellerProfile));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        ProductResponse response = productService.createProduct(sellerId, request);

        assertNotNull(response);
        assertEquals("Mouse Wireless", response.getName());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("deleteProduct should set soft delete timestamp and INACTIVE status")
    void deleteProduct_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        productService.deleteProduct(sellerId, productId);

        assertNotNull(product.getDeletedAt());
        assertEquals(ProductStatus.INACTIVE, product.getStatus());
        verify(productRepository).save(product);
    }
}
