package com.example.automobile_risk.entity;

import com.example.automobile_risk.entity.enumclass.Unit;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Entity
public class Sensor extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sensor_id")
    private Long id;

    private String sensorType;

    @Enumerated(EnumType.STRING)
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    /**
     *  ========================================
     *  비즈니스 로직
     *  ========================================
     */

    /**
     *  센서 생성
     */
    public static Sensor create(
            String sensorType,
            Unit unit,
            Equipment equipment
    ) {

        return Sensor.builder()
                .sensorType(sensorType)
                .unit(unit)
                .equipment(equipment)
                .build();
    }

    /**
     *  수정
     */
    public void update(String sensorType, Unit unit, Equipment equipment) {
        this.sensorType = sensorType;
        this.unit = unit;
        this.equipment = equipment;
    }
}
