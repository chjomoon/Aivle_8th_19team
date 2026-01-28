package com.example.automobile_risk.controller.dto;

import com.example.automobile_risk.entity.enumclass.EquipmentStatus;
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
public class EquipmentUpdateForm {

    @NotBlank
    private String equipmentName;
    @NotNull
    private EquipmentStatus status;
    @NotNull @Positive
    private Long processTypeId;
}
