package com.example.automobile_risk.controller.dto;

import com.example.automobile_risk.entity.VehicleModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleModelCreateForm {

    @NotBlank
    private String modelName;
    @NotNull
    private String segment;
    @NotNull
    private String fuel;
    @NotNull
    private String description;
    @NotNull
    private boolean isActive;

    // VehicleModel은 연관 관계 없음
    public VehicleModel toEntity() {
        return VehicleModel.builder()
                .modelName(this.modelName)
                .segment(this.segment)
                .fuel(this.fuel)
                .description(this.description)
                .isActive(this.isActive)
                .build();
    }
}
