package com.example.automobile_risk.service;

import com.example.automobile_risk.entity.DelayRule;
import com.example.automobile_risk.entity.Order;
import com.example.automobile_risk.entity.PredictionSnapshot;
import com.example.automobile_risk.entity.ProcessEvent;
import com.example.automobile_risk.entity.enumclass.OrderStatus;
import com.example.automobile_risk.entity.enumclass.RiskLevel;
import com.example.automobile_risk.repository.DelayRuleRepository;
import com.example.automobile_risk.repository.OrderRepository;
import com.example.automobile_risk.repository.PredictionSnapshotRepository;
import com.example.automobile_risk.repository.ProcessEventRepository;
import com.example.automobile_risk.service.dto.DelayPredictionOverviewResponse;
import com.example.automobile_risk.service.dto.DelayPredictionResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DelayPredictionService {

    private final ProcessEventRepository processEventRepository;
    private final DelayRuleRepository delayRuleRepository;
    private final PredictionSnapshotRepository predictionSnapshotRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    /**
     *  주문별 지연 예측
     */
    @Transactional
    public DelayPredictionResponse predictForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다: " + orderId));

        List<ProcessEvent> events = processEventRepository.findByOrderId(orderId);
        Map<String, DelayRule> ruleMap = buildActiveRuleMap();

        List<ScoredEvent> scoredEvents = events.stream()
                .map(event -> scoreEvent(event, ruleMap))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(ScoredEvent::scoredDelayHours).reversed())
                .toList();

        double totalDelay = aggregateAcrossProcesses(scoredEvents);
        RiskLevel riskLevel = classifyRisk(totalDelay);

        String topContributorCode = scoredEvents.isEmpty() ? "none" : scoredEvents.get(0).eventCode();
        String explanationJson = buildExplanationJson(scoredEvents, totalDelay);
        String explanationSummary = buildExplanationSummary(scoredEvents, totalDelay);

        LocalDateTime calculatedAt = LocalDateTime.now();

        // 이전 스냅샷 만료 처리
        predictionSnapshotRepository.findTopByOrderIdOrderByCalculatedAtDesc(orderId)
                .ifPresent(PredictionSnapshot::markStale);

        // 새 스냅샷 저장
        PredictionSnapshot snapshot = PredictionSnapshot.create(
                order, totalDelay, riskLevel, scoredEvents.size(),
                topContributorCode, explanationJson, calculatedAt
        );
        predictionSnapshotRepository.save(snapshot);

        // 공정별 집계
        Map<String, List<ScoredEvent>> byProcess = scoredEvents.stream()
                .collect(Collectors.groupingBy(ScoredEvent::process));

        List<DelayPredictionResponse.ProcessDelayDetail> processBreakdown = byProcess.entrySet().stream()
                .map(entry -> DelayPredictionResponse.ProcessDelayDetail.builder()
                        .process(entry.getKey())
                        .totalDelayHours(entry.getValue().stream().mapToDouble(ScoredEvent::scoredDelayHours).sum())
                        .eventCount(entry.getValue().size())
                        .build())
                .sorted(Comparator.comparingDouble(DelayPredictionResponse.ProcessDelayDetail::getTotalDelayHours).reversed())
                .toList();

        List<DelayPredictionResponse.EventScoreDetail> eventDetails = scoredEvents.stream()
                .map(se -> DelayPredictionResponse.EventScoreDetail.builder()
                        .eventCode(se.eventCode())
                        .process(se.process())
                        .scoredDelayHours(se.scoredDelayHours())
                        .severity(se.severity())
                        .lineHold(se.lineHold())
                        .unresolved(se.unresolved())
                        .qtyAffected(se.qtyAffected())
                        .appliedMultipliers(se.appliedMultipliers())
                        .build())
                .toList();

        return DelayPredictionResponse.builder()
                .orderId(orderId)
                .predictedDelayHours(totalDelay)
                .riskLevel(riskLevel.name())
                .eventCount(scoredEvents.size())
                .topContributorCode(topContributorCode)
                .calculatedAt(calculatedAt)
                .processBreakdown(processBreakdown)
                .eventDetails(eventDetails)
                .explanationSummary(explanationSummary)
                .build();
    }

    /**
     *  전체 주문 개요
     */
    @Transactional
    public DelayPredictionOverviewResponse getOverview() {
        List<Order> activeOrders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() != OrderStatus.COMPLETED
                        && o.getOrderStatus() != OrderStatus.CANCELLED)
                .toList();

        List<DelayPredictionOverviewResponse.OrderPredictionSummary> summaries = new ArrayList<>();
        Map<String, Integer> riskDistribution = new LinkedHashMap<>();
        riskDistribution.put("LOW", 0);
        riskDistribution.put("MEDIUM", 0);
        riskDistribution.put("HIGH", 0);
        riskDistribution.put("CRITICAL", 0);

        double maxDelay = 0;
        double totalDelay = 0;

        for (Order order : activeOrders) {
            DelayPredictionResponse prediction = predictForOrder(order.getId());

            summaries.add(DelayPredictionOverviewResponse.OrderPredictionSummary.builder()
                    .orderId(order.getId())
                    .predictedDelayHours(prediction.getPredictedDelayHours())
                    .riskLevel(prediction.getRiskLevel())
                    .eventCount(prediction.getEventCount())
                    .topContributorCode(prediction.getTopContributorCode())
                    .build());

            riskDistribution.merge(prediction.getRiskLevel(), 1, Integer::sum);
            maxDelay = Math.max(maxDelay, prediction.getPredictedDelayHours());
            totalDelay += prediction.getPredictedDelayHours();
        }

        double avgDelay = activeOrders.isEmpty() ? 0 : totalDelay / activeOrders.size();

        return DelayPredictionOverviewResponse.builder()
                .totalOrders(activeOrders.size())
                .maxDelayHours(maxDelay)
                .avgDelayHours(avgDelay)
                .riskDistribution(riskDistribution)
                .orders(summaries)
                .build();
    }

    /**
     *  대시보드용 전체 예측 지연 합계
     */
    @Transactional
    public double getTotalPredictedDelay() {
        List<Order> activeOrders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() != OrderStatus.COMPLETED
                        && o.getOrderStatus() != OrderStatus.CANCELLED)
                .toList();

        double total = 0;
        for (Order order : activeOrders) {
            List<ProcessEvent> events = processEventRepository.findByOrderId(order.getId());
            if (events.isEmpty()) {
                continue;
            }
            Map<String, DelayRule> ruleMap = buildActiveRuleMap();
            List<ScoredEvent> scoredEvents = events.stream()
                    .map(event -> scoreEvent(event, ruleMap))
                    .filter(Objects::nonNull)
                    .toList();
            total += aggregateAcrossProcesses(scoredEvents);
        }
        return total;
    }

    // ========================================
    //  Private Methods
    // ========================================

    private record ScoredEvent(
            String eventCode,
            String process,
            double scoredDelayHours,
            Integer severity,
            boolean lineHold,
            boolean unresolved,
            int qtyAffected,
            Map<String, Double> appliedMultipliers
    ) {}

    private ScoredEvent scoreEvent(ProcessEvent event, Map<String, DelayRule> ruleMap) {
        DelayRule rule = ruleMap.get(event.getEventCode());
        if (rule == null) {
            log.warn("No delay rule found for eventCode: {}", event.getEventCode());
            return null;
        }

        double base = rule.getBaseDelayHours();
        Map<String, Double> multipliers = new LinkedHashMap<>();

        // severity weight
        int severity = event.getSeverity() != null ? event.getSeverity() : 1;
        double severityWeight = parseSeverityWeight(rule.getSeverityWeights(), severity);
        multipliers.put("severityWeight", severityWeight);

        // lineHold factor
        double lineHoldFactor = event.isLineHold() ? rule.getLineHoldMultiplier() : 1.0;
        multipliers.put("lineHoldFactor", lineHoldFactor);

        // unresolved factor
        boolean unresolved = event.getResolvedAt() == null;
        double unresolvedFactor = unresolved ? rule.getUnresolvedMultiplier() : 1.0;
        multipliers.put("unresolvedFactor", unresolvedFactor);

        // qty factor
        double qtyFactor = event.getQtyAffected() >= rule.getQtyThreshold() ? rule.getQtyMultiplier() : 1.0;
        multipliers.put("qtyFactor", qtyFactor);

        double scored = base * severityWeight * lineHoldFactor * unresolvedFactor * qtyFactor;

        return new ScoredEvent(
                event.getEventCode(),
                event.getProcess(),
                scored,
                severity,
                event.isLineHold(),
                unresolved,
                event.getQtyAffected(),
                multipliers
        );
    }

    private double aggregateAcrossProcesses(List<ScoredEvent> scoredEvents) {
        if (scoredEvents.isEmpty()) return 0;

        // 공정별로 그룹화하여 합산
        Map<String, Double> processTotals = scoredEvents.stream()
                .collect(Collectors.groupingBy(
                        ScoredEvent::process,
                        Collectors.summingDouble(ScoredEvent::scoredDelayHours)
                ));

        // 공정별 합산을 내림차순 정렬
        List<Double> sortedTotals = processTotals.values().stream()
                .sorted(Comparator.reverseOrder())
                .toList();

        // 병목(최대) + 나머지는 감소 가중치 적용
        double total = 0;
        for (int i = 0; i < sortedTotals.size(); i++) {
            total += sortedTotals.get(i) * Math.pow(0.3, i);
        }

        return Math.round(total * 100.0) / 100.0;
    }

    private RiskLevel classifyRisk(double totalDelayHours) {
        if (totalDelayHours < 4) return RiskLevel.LOW;
        if (totalDelayHours < 12) return RiskLevel.MEDIUM;
        if (totalDelayHours < 48) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private double parseSeverityWeight(String json, int severity) {
        if (json == null || json.isBlank()) return 1.0;
        try {
            Map<String, Double> weights = objectMapper.readValue(json, new TypeReference<>() {});
            return weights.getOrDefault(String.valueOf(severity), 1.0);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse severityWeights JSON: {}", json, e);
            return 1.0;
        }
    }

    private Map<String, DelayRule> buildActiveRuleMap() {
        return delayRuleRepository.findByIsActiveTrue().stream()
                .collect(Collectors.toMap(DelayRule::getEventCode, r -> r));
    }

    private String buildExplanationJson(List<ScoredEvent> scoredEvents, double total) {
        try {
            Map<String, Object> explanation = new LinkedHashMap<>();
            explanation.put("totalDelayHours", total);
            explanation.put("eventCount", scoredEvents.size());

            List<Map<String, Object>> details = scoredEvents.stream()
                    .map(se -> {
                        Map<String, Object> detail = new LinkedHashMap<>();
                        detail.put("eventCode", se.eventCode());
                        detail.put("process", se.process());
                        detail.put("scoredDelayHours", se.scoredDelayHours());
                        detail.put("multipliers", se.appliedMultipliers());
                        return detail;
                    })
                    .toList();
            explanation.put("details", details);

            return objectMapper.writeValueAsString(explanation);
        } catch (JsonProcessingException e) {
            log.warn("Failed to build explanation JSON", e);
            return "{}";
        }
    }

    private String buildExplanationSummary(List<ScoredEvent> scoredEvents, double total) {
        if (scoredEvents.isEmpty()) {
            return "현재 등록된 공정 이벤트가 없어 지연이 예측되지 않습니다.";
        }

        RiskLevel risk = classifyRisk(total);
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("총 %d건의 이벤트로 인해 약 %.1f시간의 지연이 예측됩니다. ", scoredEvents.size(), total));
        sb.append(String.format("리스크 수준: %s. ", risk.getLabel()));

        // 공정별 요약
        Map<String, Double> processTotals = scoredEvents.stream()
                .collect(Collectors.groupingBy(
                        ScoredEvent::process,
                        Collectors.summingDouble(ScoredEvent::scoredDelayHours)
                ));

        List<Map.Entry<String, Double>> sorted = processTotals.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .toList();

        sb.append("주요 지연 공정: ");
        for (int i = 0; i < Math.min(sorted.size(), 3); i++) {
            Map.Entry<String, Double> entry = sorted.get(i);
            if (i > 0) sb.append(", ");
            sb.append(String.format("%s(%.1fh)", entry.getKey(), entry.getValue()));
        }
        sb.append(".");

        // 미해결 이벤트 경고
        long unresolvedCount = scoredEvents.stream().filter(ScoredEvent::unresolved).count();
        if (unresolvedCount > 0) {
            sb.append(String.format(" 미해결 이벤트 %d건이 지연을 가중시키고 있습니다.", unresolvedCount));
        }

        return sb.toString();
    }
}
