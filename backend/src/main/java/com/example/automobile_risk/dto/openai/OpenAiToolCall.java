package com.example.automobile_risk.dto.openai;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenAiToolCall {
    private String id;
    private String type;
    private OpenAiFunctionCall function;
}
