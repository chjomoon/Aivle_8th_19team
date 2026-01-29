package com.example.automobile_risk.service.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayPredictionResponse {

    private Long orderId;
    private double predictedDelayHours;
    private String riskLevel;
    private int eventCount;
    private String topContributorCode;
    private LocalDateTime calculatedAt;

    private List<ProcessDelayDetail> processBreakdown;
    private List<EventScoreDetail> eventDetails;
    private String explanationSummary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessDelayDetail {
        private String process;
        private double totalDelayHours;
        private int eventCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventScoreDetail {
        private String eventCode;
        private String process;
        private double scoredDelayHours;
        private Integer severity;
        private boolean lineHold;
        private boolean unresolved;
        private int qtyAffected;
        private Map<String, Double> appliedMultipliers;
    }
}
