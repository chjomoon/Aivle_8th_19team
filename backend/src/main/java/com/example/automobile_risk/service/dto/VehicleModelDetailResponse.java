package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.VehicleModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleModelDetailResponse {

    private Long vehicleModelId;
    private String modelName;
    private String segment;
    private String fuel;
    private String description;
    private boolean isActive;

    // Entity -> Dto
    public static VehicleModelDetailResponse from(VehicleModel vehicleModel) {
        return VehicleModelDetailResponse.builder()
                .vehicleModelId(vehicleModel.getId())
                .modelName(vehicleModel.getModelName())
                .segment(vehicleModel.getSegment())
                .fuel(vehicleModel.getFuel())
                .description(vehicleModel.getDescription())
                .isActive(vehicleModel.isActive())
                .build();
    }
}
