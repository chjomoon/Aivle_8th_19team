package com.example.automobile_risk.service.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayPredictionOverviewResponse {

    private int totalOrders;
    private double maxDelayHours;
    private double avgDelayHours;
    private Map<String, Integer> riskDistribution;
    private List<OrderPredictionSummary> orders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderPredictionSummary {
        private Long orderId;
        private double predictedDelayHours;
        private String riskLevel;
        private int eventCount;
        private String topContributorCode;
    }
}
