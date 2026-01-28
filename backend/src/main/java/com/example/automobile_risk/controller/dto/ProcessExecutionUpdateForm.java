package com.example.automobile_risk.controller.dto;

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
public class ProcessExecutionUpdateForm {

    @NotNull
    private LocalDateTime startDate;
    @NotNull
    private LocalDateTime endDate;
    @NotNull
    private Integer executionOrder;
    @NotNull @Positive
    private Long productionId;
    @NotNull @Positive
    private Long processTypeId;
    @NotNull @Positive
    private Long equipmentId;
}
