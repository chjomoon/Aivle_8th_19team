package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.ProcessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessTypeListResponse {

    private Long processTypeId;
    private String processName;
    private int processOrder;
    private boolean isActive;

    // Entity -> Dto
    public static ProcessTypeListResponse from(ProcessType processType) {
        return ProcessTypeListResponse.builder()
                .processTypeId(processType.getId())
                .processName(processType.getProcessName())
                .processOrder(processType.getProcessOrder())
                .isActive(processType.isActive())
                .build();
    }
}
