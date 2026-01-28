package com.example.automobile_risk.controller.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessTypeUpdateForm {

    @NotNull
    private String processName;
    @NotNull
    private int processOrder;
    @NotNull
    private boolean isActive;
}
