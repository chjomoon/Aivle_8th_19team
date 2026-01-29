package com.example.automobile_risk.service;

import com.example.automobile_risk.dto.DashboardResponse;
import com.example.automobile_risk.entity.Anomaly;
import com.example.automobile_risk.entity.DashboardHistory;
import com.example.automobile_risk.entity.ProcessEntity;
import com.example.automobile_risk.entity.enumclass.RiskLevel;
import com.example.automobile_risk.repository.AnomalyRepository;
import com.example.automobile_risk.repository.DashboardHistoryRepository;
import com.example.automobile_risk.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProcessRepository processRepository;
    private final AnomalyRepository anomalyRepository;
    private final DashboardHistoryRepository historyRepository;
    private final DelayPredictionService delayPredictionService;

    public DashboardResponse getMainDashboardData() {
        List<ProcessEntity> processes = processRepository.findAll();
        List<Anomaly> anomalies = anomalyRepository.findByType("anomaly");
        List<Anomaly> warnings = anomalyRepository.findByType("warning");
        List<DashboardHistory> history = historyRepository.findAllByOrderByIdAsc();

        int totalAnomalies = anomalies.stream().mapToInt(Anomaly::getCount).sum();
        int totalWarnings = warnings.stream().mapToInt(Anomaly::getCount).sum();

        double legacyDelayHours = anomalies.stream().mapToDouble(a -> a.getCount() * a.getAvgDelay()).sum() +
                warnings.stream().mapToDouble(w -> w.getCount() * w.getAvgDelay()).sum();

        double totalDelayHours;
        String overallRiskLevel = null;
        try {
            double predictedDelay = delayPredictionService.getTotalPredictedDelay();
            if (predictedDelay > 0) {
                totalDelayHours = predictedDelay;
                if (predictedDelay < 4) overallRiskLevel = RiskLevel.LOW.name();
                else if (predictedDelay < 12) overallRiskLevel = RiskLevel.MEDIUM.name();
                else if (predictedDelay < 48) overallRiskLevel = RiskLevel.HIGH.name();
                else overallRiskLevel = RiskLevel.CRITICAL.name();
            } else {
                totalDelayHours = legacyDelayHours;
            }
        } catch (Exception e) {
            log.warn("Failed to get predicted delay, falling back to legacy calculation", e);
            totalDelayHours = legacyDelayHours;
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

        // Add current delay to history for charts
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
                .overallEfficiency(86.6)
                .productionEfficiency(94.2)
                .historyData(historyData)
                .processStats(processStats)
                .overallRiskLevel(overallRiskLevel)
                .build();
    }
}
