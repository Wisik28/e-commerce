package com.example.ecommerce.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private long totalBuyers;
    private long totalSellers;
    private long pendingSellers;
    private long totalActiveProducts;
    private long totalOrders;
    private Map<String, Long> ordersByStatus;
    private Map<String, Long> paymentsByStatus;
    private long pendingManualPayments;
}
