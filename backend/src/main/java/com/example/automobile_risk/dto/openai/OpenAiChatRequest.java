package com.example.automobile_risk.dto.openai;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OpenAiChatRequest {
    private String model;
    private List<OpenAiMessage> messages;
    private List<OpenAiTool> tools;
}
