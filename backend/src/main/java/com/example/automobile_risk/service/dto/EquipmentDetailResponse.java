package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.Equipment;
import com.example.automobile_risk.entity.enumclass.EquipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDetailResponse {

    private Long equipmentId;
    private String equipmentName;
    private EquipmentStatus status;
    private Long processTypeId;
    private String processTypeName;

    // Entity -> Dto
    public static EquipmentDetailResponse from(Equipment equipment) {
        return EquipmentDetailResponse.builder()
                .equipmentId(equipment.getId())
                .equipmentName(equipment.getEquipmentName())
                .status(equipment.getStatus())
                .processTypeId(equipment.getProcessType().getId())
                .processTypeName(equipment.getProcessType().getProcessName())
                .build();
    }
}
