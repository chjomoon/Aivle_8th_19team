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
public class SensorDetailResponse {

    private Long sensorId;
    private String sensorType;
    private Unit unit;
    private Long equipmentId;
    private String equipmentName;

    // Entity -> Dto
    public static SensorDetailResponse from(Sensor sensor) {
        return SensorDetailResponse.builder()
                .sensorId(sensor.getId())
                .sensorType(sensor.getSensorType())
                .unit(sensor.getUnit())
                .equipmentId(sensor.getEquipment().getId())
                .equipmentName(sensor.getEquipment().getEquipmentName())
                .build();
    }
}
