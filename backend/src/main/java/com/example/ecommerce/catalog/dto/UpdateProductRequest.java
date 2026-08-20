package com.example.ecommerce.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateProductRequest {

    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;

    private String description;

    @DecimalMin(value = "0", message = "Price must be >= 0")
    private BigDecimal price;

    @Min(value = 0, message = "Stock must be >= 0")
    private Integer stock;

    @Min(value = 1, message = "Weight must be > 0")
    private Integer weightGram;

    private String status;
}
