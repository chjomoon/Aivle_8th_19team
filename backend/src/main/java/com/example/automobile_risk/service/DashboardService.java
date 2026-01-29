package com.example.automobile_risk.service;

import com.example.automobile_risk.dto.DashboardResponse;
import com.example.automobile_risk.entity.Anomaly;
import com.example.automobile_risk.entity.DashboardHistory;
import com.example.automobile_risk.entity.ProcessEntity;
import com.example.automobile_risk.entity.ProcessEvent;
import com.example.automobile_risk.entity.enumclass.RiskLevel;
import com.example.automobile_risk.repository.AnomalyRepository;
import com.example.automobile_risk.repository.DashboardHistoryRepository;
import com.example.automobile_risk.repository.ProcessEventRepository;
import com.example.automobile_risk.repository.ProcessRepository;
import com.example.automobile_risk.service.dto.DelayPredictionOverviewResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final double BASE_OVERALL_EFFICIENCY = 95.0;
    private static final double BASE_PRODUCTION_EFFICIENCY = 98.0;
    private static final double LINE_HOLD_PENALTY = 3.0;        // 라인 홀드 1건당 가동률 -3%
    private static final double UNRESOLVED_EVENT_PENALTY = 1.5;  // 미해결 이벤트 1건당 가동률 -1.5%
    private static final double SEVERITY_HIGH_PENALTY = 1.0;     // 고심각도(2+) 이벤트당 생산효율 -1%
    private static final double DELAY_EFFICIENCY_FACTOR = 0.5;   // 지연시간 1h당 생산효율 -0.5%

    private final ProcessRepository processRepository;
    private final AnomalyRepository anomalyRepository;
    private final DashboardHistoryRepository historyRepository;
    private final ProcessEventRepository processEventRepository;
    private final DelayPredictionService delayPredictionService;

    public DashboardResponse getMainDashboardData() {
        List<ProcessEntity> processes = processRepository.findAll();
        List<Anomaly> anomalies = anomalyRepository.findByType("anomaly");
        List<Anomaly> warnings = anomalyRepository.findByType("warning");
        List<DashboardHistory> history = historyRepository.findAllByOrderByIdAsc();

        // 기존 이상/경고 건수 (레거시)
        int legacyAnomalies = anomalies.stream().mapToInt(Anomaly::getCount).sum();
        int legacyWarnings = warnings.stream().mapToInt(Anomaly::getCount).sum();

        double legacyDelayHours = anomalies.stream().mapToDouble(a -> a.getCount() * a.getAvgDelay()).sum() +
                warnings.stream().mapToDouble(w -> w.getCount() * w.getAvgDelay()).sum();

        // === 예측 엔진 기반 실시간 KPI 계산 ===
        double totalDelayHours;
        String overallRiskLevel = null;
        int totalAnomalies = legacyAnomalies;
        int totalWarnings = legacyWarnings;
        double overallEfficiency = BASE_OVERALL_EFFICIENCY;
        double productionEfficiency = BASE_PRODUCTION_EFFICIENCY;

        try {
            // ProcessEvent 기반 이상/경고 집계
            List<ProcessEvent> allEvents = processEventRepository.findAll();
            if (!allEvents.isEmpty()) {
                // severity >= 2 → 이상, severity < 2 → 경고
                int eventAnomalies = (int) allEvents.stream()
                        .filter(e -> e.getSeverity() != null && e.getSeverity() >= 2)
                        .count();
                int eventWarnings = (int) allEvents.stream()
                        .filter(e -> e.getSeverity() == null || e.getSeverity() < 2)
                        .count();

                totalAnomalies = legacyAnomalies + eventAnomalies;
                totalWarnings = legacyWarnings + eventWarnings;

                // 가동률: 라인홀드 + 미해결 이벤트에 의한 감소
                long lineHoldCount = allEvents.stream().filter(ProcessEvent::isLineHold).count();
                long unresolvedCount = allEvents.stream().filter(e -> e.getResolvedAt() == null).count();
                overallEfficiency = BASE_OVERALL_EFFICIENCY
                        - (lineHoldCount * LINE_HOLD_PENALTY)
                        - (unresolvedCount * UNRESOLVED_EVENT_PENALTY);
                overallEfficiency = Math.max(0, Math.round(overallEfficiency * 10.0) / 10.0);

                // 생산효율: 고심각도 이벤트 수에 의한 감소
                long highSeverityCount = allEvents.stream()
                        .filter(e -> e.getSeverity() != null && e.getSeverity() >= 2)
                        .count();
                productionEfficiency = BASE_PRODUCTION_EFFICIENCY
                        - (highSeverityCount * SEVERITY_HIGH_PENALTY);
            }

            // 지연 시간 (예측 엔진)
            DelayPredictionOverviewResponse overview = delayPredictionService.getOverview();
            double predictedDelay = overview.getOrders().stream()
                    .mapToDouble(DelayPredictionOverviewResponse.OrderPredictionSummary::getPredictedDelayHours)
                    .sum();

            if (predictedDelay > 0) {
                totalDelayHours = predictedDelay;

                // 지연 시간에 의한 생산효율 추가 감소
                productionEfficiency -= (predictedDelay * DELAY_EFFICIENCY_FACTOR);

                // 리스크 레벨
                if (predictedDelay < 4) overallRiskLevel = RiskLevel.LOW.name();
                else if (predictedDelay < 12) overallRiskLevel = RiskLevel.MEDIUM.name();
                else if (predictedDelay < 48) overallRiskLevel = RiskLevel.HIGH.name();
                else overallRiskLevel = RiskLevel.CRITICAL.name();
            } else {
                totalDelayHours = legacyDelayHours;
            }

            productionEfficiency = Math.max(0, Math.round(productionEfficiency * 10.0) / 10.0);

        } catch (Exception e) {
            log.warn("Failed to calculate prediction-based KPIs, falling back to legacy", e);
            totalDelayHours = legacyDelayHours;
            overallEfficiency = BASE_OVERALL_EFFICIENCY;
            productionEfficiency = BASE_PRODUCTION_EFFICIENCY;
        }

        List<DashboardResponse.AnomalyData> anomalyData = anomalies.stream()
                .map(a -> DashboardResponse.AnomalyData.builder()
                        .process(a.getProcessName())
                        .count(a.getCount())
                        .avgDelayPerIssue(a.getAvgDelay())
                        .build())
                .collect(Collectors.toList());

        List<DashboardResponse.AnomalyData> warningData = warnings.stream()
                .map(w -> DashboardResponse.AnomalyData.builder()
                        .process(w.getProcessName())
                        .count(w.getCount())
                        .avgDelayPerIssue(w.getAvgDelay())
                        .build())
                .collect(Collectors.toList());

        List<DashboardResponse.HistoryData> historyData = history.stream()
                .map(h -> DashboardResponse.HistoryData.builder()
                        .날짜(h.getDate())
                        .지연시간(h.getTotalDelay())
                        .build())
                .collect(Collectors.toList());

        historyData.add(DashboardResponse.HistoryData.builder()
                .날짜("1/9")
                .지연시간(Math.round(totalDelayHours * 10.0) / 10.0)
                .build());

        List<DashboardResponse.ProcessStat> processStats = processes.stream()
                .map(p -> DashboardResponse.ProcessStat.builder()
                        .name(p.getName())
                        .정상(p.getNormalCount())
                        .경고(p.getWarningCount())
                        .이상(p.getAnomalyCount())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .anomalyData(anomalyData)
                .warningData(warningData)
                .totalAnomalies(totalAnomalies)
                .totalWarnings(totalWarnings)
                .totalDelayHours(totalDelayHours)
                .originalDeadline("2026-01-20T18:00:00")
                .overallEfficiency(overallEfficiency)
                .productionEfficiency(productionEfficiency)
                .historyData(historyData)
                .processStats(processStats)
                .overallRiskLevel(overallRiskLevel)
                .build();
    }
}
