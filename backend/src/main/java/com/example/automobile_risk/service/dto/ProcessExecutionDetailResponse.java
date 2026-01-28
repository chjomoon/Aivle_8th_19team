package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.ProcessExecution;
import com.example.automobile_risk.entity.enumclass.ProcessExecutionStatus;
import com.example.automobile_risk.entity.enumclass.ProductionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessExecutionDetailResponse {

    private Long processExecutionId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long executionOrder;
    private ProcessExecutionStatus status;
    private Long productionId;
    private ProductionStatus productionStatus;
    private Long processTypeId;
    private String processTypeName;
    private Long equipmentId;
    private String equipmentName;

    // Entity -> Dto
    public static ProcessExecutionDetailResponse from(ProcessExecution processExecution) {
        return ProcessExecutionDetailResponse.builder()
                .processExecutionId(processExecution.getId())
                .startDate(processExecution.getStartDate())
                .endDate(processExecution.getEndDate())
                .executionOrder((long) processExecution.getExecutionOrder())
                .status(processExecution.getStatus())
                .productionId(processExecution.getProduction().getId())
                .productionStatus(processExecution.getProduction().getProductionStatus())
                .processTypeId(processExecution.getProcessType().getId())
                .processTypeName(processExecution.getProcessType().getProcessName())
                .equipmentId(processExecution.getEquipment().getId())
                .equipmentName(processExecution.getEquipment().getEquipmentName())
                .build();
    }
}
