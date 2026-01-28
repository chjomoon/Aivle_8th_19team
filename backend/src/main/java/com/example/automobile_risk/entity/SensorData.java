package com.example.automobile_risk.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(access = AccessLevel.PRIVATE)
@Table(indexes = {
        @Index(name = "idx_sensor_data_sensor", columnList = "sensor_id"),
        @Index(name = "idx_sensor_data_measured_at", columnList = "measuredAt")
})
@Entity
public class SensorData extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sensor_data_id")
    private Long id;

    private Double value;
    private LocalDateTime measuredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id")
    private Sensor sensor;

    /**
     *  ========================================
     *  비즈니스 로직
     *  ========================================
     */

    /**
     *  생성
     */
    public static SensorData create(
            Double value,
            LocalDateTime measuredAt,
            Sensor sensor
    ) {

        return SensorData.builder()
                .value(value)
                .measuredAt(measuredAt)
                .sensor(sensor)
                .build();
    }

    /**
     *  수정
     */
//    public void update(Double value, LocalDateTime measuredAt, Sensor sensor) {
//        this.value = value;
//        this.measuredAt = measuredAt;
//        this.sensor = sensor;
//    }
}
