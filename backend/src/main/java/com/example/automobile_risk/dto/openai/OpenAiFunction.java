package com.example.automobile_risk.dto.openai;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenAiFunction {
    private String name;
    private String description;
    private Map<String, Object> parameters;
}
