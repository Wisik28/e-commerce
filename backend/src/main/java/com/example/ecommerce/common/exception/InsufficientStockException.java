package com.example.ecommerce.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InsufficientStockException extends BusinessRuleException {

    public InsufficientStockException(String productName, int requested, int available) {
        super(String.format("Insufficient stock for '%s': requested %d, available %d",
                productName, requested, available));
    }

    public InsufficientStockException(String message) {
        super(message);
    }
}
