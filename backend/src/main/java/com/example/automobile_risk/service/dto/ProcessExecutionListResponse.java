package com.example.automobile_risk.service.dto;

import com.example.automobile_risk.entity.ProcessExecution;
import com.example.automobile_risk.entity.enumclass.ProcessExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessExecutionListResponse {

    private Long processExecutionId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long executionOrder;
    private ProcessExecutionStatus status;

    // Entity -> Dto
    public static ProcessExecutionListResponse from(ProcessExecution processExecution) {
        return ProcessExecutionListResponse.builder()
                .processExecutionId(processExecution.getId())
                .startDate(processExecution.getStartDate())
                .endDate(processExecution.getEndDate())
                .executionOrder((long) processExecution.getExecutionOrder())
                .status(processExecution.getStatus())
                .build();
    }
}
