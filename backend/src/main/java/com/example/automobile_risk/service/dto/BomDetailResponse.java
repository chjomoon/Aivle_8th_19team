package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.Bom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomDetailResponse {

    private int requiredQty;
    private Long vehicleModelId;
    private String vehicleModelName;
    private Long partId;
    private String partName;

    // Entity -> Dto
    public static BomDetailResponse from(Bom bom) {
        return BomDetailResponse.builder()
                .requiredQty(bom.getRequiredQty())
                .vehicleModelId(bom.getVehicleModel().getId())
                .vehicleModelName(bom.getVehicleModel().getModelName())
                .partId(bom.getPart().getId())
                .partName(bom.getPart().getPartName())
                .build();
    }
}
