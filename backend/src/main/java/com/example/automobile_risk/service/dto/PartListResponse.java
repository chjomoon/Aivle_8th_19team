package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.Part;
import com.example.automobile_risk.entity.enumclass.Unit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartListResponse {

    private Long partId;
    private String partName;
    private String partType;
    private Unit unit;

    // Entity -> Dto
    public static PartListResponse from(Part part) {
        return PartListResponse.builder()
                .partId(part.getId())
                .partName(part.getPartName())
                .partType(part.getPartType())
                .unit(part.getUnit())
                .build();
    }
}
