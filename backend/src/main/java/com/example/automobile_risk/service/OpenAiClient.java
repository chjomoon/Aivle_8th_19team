package com.example.automobile_risk.service;

import com.example.automobile_risk.dto.openai.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OpenAiClient {

    private final RestClient restClient;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    public OpenAiClient(@Qualifier("openAiRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public OpenAiChatResponse chat(List<OpenAiMessage> messages, List<OpenAiTool> tools) {
        OpenAiChatRequest request = OpenAiChatRequest.builder()
                .model(model)
                .messages(messages)
                .tools(tools != null && !tools.isEmpty() ? tools : null)
                .build();

        log.debug("Sending OpenAI request with {} messages", messages.size());

        return restClient.post()
                .uri("/chat/completions")
                .body(request)
                .retrieve()
                .body(OpenAiChatResponse.class);
    }

    public static OpenAiTool buildCallSpringApiTool() {
        Map<String, Object> parameters = Map.of(
                "type", "object",
                "properties", Map.of(
                        "method", Map.of(
                                "type", "string",
                                "enum", List.of("GET"),
                                "description", "HTTP method (only GET allowed)"
                        ),
                        "path", Map.of(
                                "type", "string",
                                "description", "API path to call (e.g. /api/v1/dashboard/main)"
                        ),
                        "queryParams", Map.of(
                                "type", "object",
                                "description", "Optional query parameters",
                                "additionalProperties", Map.of("type", "string")
                        )
                ),
                "required", List.of("method", "path")
        );

        return OpenAiTool.builder()
                .type("function")
                .function(OpenAiFunction.builder()
                        .name("call_spring_api")
                        .description("Call an internal Spring Boot API to retrieve real-time data. " +
                                "Available paths: " +
                                "/api/v1/dashboard/main (dashboard with anomaly/warning/process stats/efficiency), " +
                                "/api/paint-analysis/history (paint analysis history), " +
                                "/api/paint-analysis/statistics/today (today's paint statistics), " +
                                "/api/v1/vehicle-model (vehicle models), " +
                                "/api/v1/part (parts), " +
                                "/api/v1/bom (bill of materials), " +
                                "/api/v1/board (bulletin board)")
                        .parameters(parameters)
                        .build())
                .build();
    }
}
