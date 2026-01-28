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
public class SensorDataListResponse {

    private Long sensorDataId;
    private Double value;
    private LocalDateTime measuredAt;
    private Long sensorId;
    private String sensorType;

    // Entity -> Dto
    public static SensorDataListResponse from(SensorData sensorData) {
        return SensorDataListResponse.builder()
                .sensorDataId(sensorData.getId())
                .value(sensorData.getValue())
                .measuredAt(sensorData.getMeasuredAt())
                .sensorId(sensorData.getSensor().getId())
                .sensorType(sensorData.getSensor().getSensorType())
                .build();
    }
}
