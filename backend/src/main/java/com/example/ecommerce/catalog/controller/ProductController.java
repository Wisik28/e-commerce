package com.example.ecommerce.catalog.controller;

import com.example.ecommerce.catalog.dto.ProductResponse;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.common.response.PagedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getProducts(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<ProductResponse> page;
        if (keyword != null && !keyword.isBlank()) {
            page = productService.searchProducts(keyword, pageable);
        } else {
            page = productService.getActiveProducts(pageable);
        }

        PagedResponse<ProductResponse> response = PagedResponse.of(
                page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable UUID productId) {
        ProductResponse response = productService.getProductById(productId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
