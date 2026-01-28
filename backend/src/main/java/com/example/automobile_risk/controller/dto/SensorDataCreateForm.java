package com.example.automobile_risk.controller.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorDataCreateForm {

    @NotNull
    private Double value;
    @NotNull
    private LocalDateTime measuredAt;
    @NotNull @Positive
    private Long sensorId;
}
