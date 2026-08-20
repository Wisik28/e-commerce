package com.example.ecommerce.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CheckoutRequest {

    @NotEmpty(message = "At least one cart item must be selected")
    private List<UUID> cartItemIds;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    private String notes;
}
