package com.example.automobile_risk.entity;

import com.example.automobile_risk.entity.enumclass.ProcessExecutionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDateTime;

import static com.example.automobile_risk.entity.enumclass.ProcessExecutionStatus.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Entity
public class ProcessExecution extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_execution_id")
    private Long id;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private int executionOrder;

    @Enumerated(EnumType.STRING)
    private ProcessExecutionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_id")
    private Production production;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_type_id")
    private ProcessType processType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    /**
     *  ========================================
     *  비즈니스 로직
     *  ========================================
     */

    /**
     *  공정수행 생성
     */
    public static ProcessExecution createEntity(
            LocalDateTime startDate,
            int executionOrder,
            Production production,
            ProcessType processType,
            Equipment equipment
    ) {

        return ProcessExecution.builder()
                .startDate(startDate)
                .executionOrder(executionOrder)
                .status(READY)
                .production(production)
                .processType(processType)
                .equipment(equipment)
                .build();
    }

    /**
     *  공정수행 수정
     */
    public void update(LocalDateTime startDate, LocalDateTime endDate, int executionOrder, Production production, ProcessType processType, Equipment equipment) {

        if (status != READY) {
            throw new IllegalStateException("준비 상태에서만 수정할 수 있습니다.");
        }

        this.startDate = startDate;
        this.endDate = endDate;
        this.executionOrder = executionOrder;
        this.production = production;
        this.processType = processType;
        this.equipment = equipment;
    }

    /**
     *  공정수행 가동
     */
    public void operate() {

        if (this.status != READY && this.status != STOPPED) {
            throw new IllegalStateException("준비 또는 중지 상태에서만 가동할 수 있습니다.");
        }

        this.status = IN_PROGRESS;
    }

    /**
     *  공정수행 완료
     */
    public void complete(LocalDateTime endDate) {

        if (this.status != IN_PROGRESS) {
            throw new IllegalStateException("진행 중 상태에서만 완료할 수 있습니다.");
        }

        this.endDate = endDate;
        this.status = COMPLETED;
    }

    /**
     *  공정수행 중지
     */
    public void stop() {

        if (this.status != IN_PROGRESS) {
            throw new IllegalStateException("진행 중 상태에서만 중지할 수 있습니다.");
        }

        this.status = STOPPED;
    }

    /**
     *  소요 시간 계산
     */
    public long getDurationMinutes() {
        if (startDate == null || endDate == null) return 0;
        return Duration.between(startDate, endDate).toMinutes();
    }
}
