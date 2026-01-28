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
public class VehicleModelListResponse {

    private Long vehicleModelId;
    private String modelName;
    private String segment;
    private String fuel;

    // Entity -> Dto
    public static VehicleModelListResponse from(VehicleModel vehicleModel) {
        return VehicleModelListResponse.builder()
                .vehicleModelId(vehicleModel.getId())
                .modelName(vehicleModel.getModelName())
                .segment(vehicleModel.getSegment())
                .fuel(vehicleModel.getFuel())
                .build();
    }
}
