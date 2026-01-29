package com.example.automobile_risk.dto.openai;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OpenAiMessage {
    private String role;
    private String content;

    @JsonProperty("tool_calls")
    private List<OpenAiToolCall> toolCalls;

    @JsonProperty("tool_call_id")
    private String toolCallId;

    public static OpenAiMessage system(String content) {
        return OpenAiMessage.builder().role("system").content(content).build();
    }

    public static OpenAiMessage user(String content) {
        return OpenAiMessage.builder().role("user").content(content).build();
    }

    public static OpenAiMessage tool(String toolCallId, String content) {
        return OpenAiMessage.builder().role("tool").toolCallId(toolCallId).content(content).build();
    }
}
