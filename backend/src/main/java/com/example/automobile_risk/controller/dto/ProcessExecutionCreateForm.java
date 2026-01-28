package com.example.automobile_risk.controller.dto;

import com.example.automobile_risk.entity.enumclass.ProcessExecutionStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessExecutionCreateForm {

    @NotNull
    private LocalDateTime startDate;
    @NotNull
    private Integer executionOrder;
    @NotNull
    private ProcessExecutionStatus status;
    @NotNull @Positive
    private Long productionId;
    @NotNull @Positive
    private Long processTypeId;
    @NotNull @Positive
    private Long equipmentId;
}
