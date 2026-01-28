package com.example.automobile_risk.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Entity
public class ProcessType extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_type_id")
    private Long id;

    private String processName;
    private int processOrder;
    private boolean isActive;

    /**
     *  ========================================
     *  비즈니스 로직
     *  ========================================
     */

    /**
     *  공정타입 생성
     */
    public static ProcessType createProcessType(
            String processName,
            int processOrder,
            boolean isActive
    ) {

        if (processName == null || processName.isBlank()) {
            throw new IllegalArgumentException("공정명은 필수입니다.");
        }

        if (processOrder <= 0) {
            throw new IllegalArgumentException("공정 순서는 1 이상이어야 합니다.");
        }

        return ProcessType.builder()
                .processName(processName)
                .processOrder(processOrder)
                .isActive(isActive)
                .build();
    }

    /**
     *  수정
     */
    public void update(String processName, int processOrder, boolean isActive) {
       this.processName = processName;
       this.processOrder = processOrder;
       this.isActive = isActive;
    }

    /**
     *  비활성화
     */
    public void deactivate() {
        this.isActive = false;
    }
}
