package com.example.automobile_risk.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class InternalApiClient {

    private static final List<String> WHITELIST_PATHS = List.of(
            "/api/v1/dashboard/main",
            "/api/paint-analysis/history",
            "/api/paint-analysis/statistics/today",
            "/api/v1/vehicle-model",
            "/api/v1/part",
            "/api/v1/bom",
            "/api/v1/board"
    );

    private static final int MAX_RESPONSE_LENGTH = 8000;

    private final RestClient restClient;

    public InternalApiClient(@Qualifier("internalRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public String call(String method, String path, Map<String, String> queryParams) {
        if (!"GET".equalsIgnoreCase(method)) {
            return "{\"error\": \"Only GET method is allowed\"}";
        }

        if (!isAllowed(path)) {
            return "{\"error\": \"Path not allowed: " + path + "\"}";
        }

        try {
            String uri = buildUri(path, queryParams);
            log.info("Calling internal API: GET {}", uri);

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            if (response != null && response.length() > MAX_RESPONSE_LENGTH) {
                response = response.substring(0, MAX_RESPONSE_LENGTH) + "...(truncated)";
            }

            return response != null ? response : "{\"error\": \"Empty response\"}";
        } catch (Exception e) {
            log.error("Internal API call failed: {} {}", method, path, e);
            return "{\"error\": \"API call failed: " + e.getMessage() + "\"}";
        }
    }

    private boolean isAllowed(String path) {
        return WHITELIST_PATHS.stream().anyMatch(path::startsWith);
    }

    private String buildUri(String path, Map<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty()) {
            return path;
        }

        StringBuilder sb = new StringBuilder(path);
        sb.append("?");
        queryParams.forEach((key, value) ->
                sb.append(key).append("=").append(value).append("&"));
        sb.setLength(sb.length() - 1);
        return sb.toString();
    }
}
