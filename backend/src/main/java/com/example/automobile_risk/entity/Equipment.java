package com.example.automobile_risk.entity;

import com.example.automobile_risk.entity.enumclass.EquipmentStatus;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Entity
public class Equipment extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "equipment_id")
    private Long id;

    private String equipmentName;

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_type_id")
    private ProcessType processType;

    /**
     *  ========================================
     *  비즈니스 로직
     *  ========================================
     */

    /**
     *  설비 생성
     */
    public static Equipment createEquipment(
            String equipmentName,
            ProcessType processType
    ) {

        return Equipment.builder()
                .equipmentName(equipmentName)
                .status(EquipmentStatus.NORMAL)
                .processType(processType)
                .build();
    }

    /**
     *  수정
     */
    public void update(String equipmentName, ProcessType processType) {
        this.equipmentName = equipmentName;
        this.processType = processType;
    }

    /**
     *  normalize
     */
    public void normalize() {
        this.status = EquipmentStatus.NORMAL;
    }

    /**
     *  경고
     */
    public void warn() {
        this.status = EquipmentStatus.WARNING;
    }

    /**
     *  중지
     */
    public void stop() {
        this.status = EquipmentStatus.STOP;
    }
}
