package com.example.automobile_risk.entity;

import com.example.automobile_risk.entity.enumclass.EventSource;
import com.example.automobile_risk.entity.enumclass.EventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Table(name = "process_events")
@Entity
public class ProcessEvent extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_event_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private String process;

    @Enumerated(EnumType.STRING)
    private EventType eventType;

    private String eventCode;

    private Integer severity;

    private LocalDateTime detectedAt;

    private LocalDateTime resolvedAt;

    private int qtyAffected;

    private boolean lineHold;

    @Enumerated(EnumType.STRING)
    private EventSource source;

    /**
     *  공정 이벤트 생성
     */
    public static ProcessEvent create(
            Order order,
            String process,
            EventType eventType,
            String eventCode,
            Integer severity,
            LocalDateTime detectedAt,
            LocalDateTime resolvedAt,
            int qtyAffected,
            boolean lineHold,
            EventSource source
    ) {
        return ProcessEvent.builder()
                .order(order)
                .process(process)
                .eventType(eventType)
                .eventCode(eventCode)
                .severity(severity)
                .detectedAt(detectedAt)
                .resolvedAt(resolvedAt)
                .qtyAffected(qtyAffected)
                .lineHold(lineHold)
                .source(source)
                .build();
    }
}
