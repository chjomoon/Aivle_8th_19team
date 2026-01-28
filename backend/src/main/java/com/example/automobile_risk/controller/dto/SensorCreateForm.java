package com.example.automobile_risk.controller.dto;

import com.example.automobile_risk.entity.enumclass.Unit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorCreateForm {

    @NotBlank
    private String sensorType;
    @NotNull
    private Unit unit;
    @NotNull @Positive
    private Long equipmentId;
}
