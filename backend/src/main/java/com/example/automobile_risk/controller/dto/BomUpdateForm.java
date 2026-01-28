package com.example.automobile_risk.controller.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomUpdateForm {

    @PositiveOrZero
    private int requiredQty;
    @NotNull
    private Long vehicleModelId;
    @NotNull
    private Long partId;
}
