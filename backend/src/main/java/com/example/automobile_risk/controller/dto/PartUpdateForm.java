package com.example.automobile_risk.controller.dto;

import com.example.automobile_risk.entity.Part;
import com.example.automobile_risk.entity.enumclass.Unit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartUpdateForm {

    @NotBlank
    private String partName;
    @NotNull
    private String partType;
    @NotNull
    private Unit unit;

    // Part는 연관 관계 없음
    public Part toEntity() {
        return Part.builder()
                .partName(this.partName)
                .partType(this.partType)
                .unit(this.unit)
                .build();
    }
}
