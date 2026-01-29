package com.example.automobile_risk.dto.openai;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenAiFunctionCall {
    private String name;
    private String arguments;
}
