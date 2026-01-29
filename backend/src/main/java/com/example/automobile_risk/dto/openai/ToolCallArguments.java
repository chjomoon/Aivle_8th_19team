package com.example.automobile_risk.dto.openai;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolCallArguments {
    private String method;
    private String path;
    private Map<String, String> queryParams;
}
