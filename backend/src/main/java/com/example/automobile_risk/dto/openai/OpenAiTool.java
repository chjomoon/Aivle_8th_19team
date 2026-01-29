package com.example.automobile_risk.dto.openai;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenAiTool {
    private String type;
    private OpenAiFunction function;
}
