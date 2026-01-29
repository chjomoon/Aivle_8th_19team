package com.example.automobile_risk.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Table(name = "delay_rules")
@Entity
public class DelayRule extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delay_rule_id")
    private Long id;

    @Column(unique = true)
    private String eventCode;

    private String process;

    private double baseDelayHours;

    private double delayRangeMin;

    private double delayRangeMax;

    @Column(columnDefinition = "TEXT")
    private String severityWeights;

    private double lineHoldMultiplier;

    private double unresolvedMultiplier;

    private int qtyThreshold;

    private double qtyMultiplier;

    private boolean isActive;

    /**
     *  지연 규칙 생성
     */
    public static DelayRule create(
            String eventCode,
            String process,
            double baseDelayHours,
            double delayRangeMin,
            double delayRangeMax,
            String severityWeights,
            double lineHoldMultiplier,
            double unresolvedMultiplier,
            int qtyThreshold,
            double qtyMultiplier,
            boolean isActive
    ) {
        return DelayRule.builder()
                .eventCode(eventCode)
                .process(process)
                .baseDelayHours(baseDelayHours)
                .delayRangeMin(delayRangeMin)
                .delayRangeMax(delayRangeMax)
                .severityWeights(severityWeights)
                .lineHoldMultiplier(lineHoldMultiplier)
                .unresolvedMultiplier(unresolvedMultiplier)
                .qtyThreshold(qtyThreshold)
                .qtyMultiplier(qtyMultiplier)
                .isActive(isActive)
                .build();
    }
}
