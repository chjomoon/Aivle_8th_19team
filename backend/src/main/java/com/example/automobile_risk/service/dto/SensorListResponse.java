package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.Sensor;
import com.example.automobile_risk.entity.enumclass.Unit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorListResponse {

    private Long sensorId;
    private String sensorType;
    private Unit unit;

    // Entity -> Dto
    public static SensorListResponse from(Sensor sensor) {
        return SensorListResponse.builder()
                .sensorId(sensor.getId())
                .sensorType(sensor.getSensorType())
                .unit(sensor.getUnit())
                .build();
    }
}
