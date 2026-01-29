package com.example.automobile_risk.entity;

import com.example.automobile_risk.entity.enumclass.RiskLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Table(name = "prediction_snapshots")
@Entity
public class PredictionSnapshot extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_snapshot_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private double predictedDelayHours;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    private int eventCount;

    private String topContributorCode;

    @Column(columnDefinition = "TEXT")
    private String explanationJson;

    private LocalDateTime calculatedAt;

    private boolean isStale;

    /**
     *  예측 스냅샷 생성
     */
    public static PredictionSnapshot create(
            Order order,
            double predictedDelayHours,
            RiskLevel riskLevel,
            int eventCount,
            String topContributorCode,
            String explanationJson,
            LocalDateTime calculatedAt
    ) {
        return PredictionSnapshot.builder()
                .order(order)
                .predictedDelayHours(predictedDelayHours)
                .riskLevel(riskLevel)
                .eventCount(eventCount)
                .topContributorCode(topContributorCode)
                .explanationJson(explanationJson)
                .calculatedAt(calculatedAt)
                .isStale(false)
                .build();
    }

    /**
     *  스냅샷 만료 처리
     */
    public void markStale() {
        this.isStale = true;
    }
}
