package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.SensorData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorDataDetailResponse {

    private Long sensorDataId;
    private Double value;
    private LocalDateTime measuredAt;
    private Long sensorId;
    private String sensorType;

    // Entity -> Dto
    public static SensorDataDetailResponse from(SensorData sensorData) {
        return SensorDataDetailResponse.builder()
                .sensorDataId(sensorData.getId())
                .value(sensorData.getValue())
                .measuredAt(sensorData.getMeasuredAt())
                .sensorId(sensorData.getSensor().getId())
                .sensorType(sensorData.getSensor().getSensorType())
                .build();
    }
}
