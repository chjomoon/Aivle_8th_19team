package com.example.automobile_risk.service;

import com.example.automobile_risk.entity.MLAnalysisResult;
import com.example.automobile_risk.repository.MLAnalysisResultRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLProxyService {

    private final RestTemplate restTemplate;
    private final MLAnalysisResultRepository mlAnalysisResultRepository;
    private final ObjectMapper objectMapper;

    @Value("${ml-service.base-url:http://localhost:8000}")
    private String mlServiceBaseUrl;

    /**
     * FastAPI 엔드포인트 호출 및 결과 저장
     */
    public JsonNode callMLServiceAndSave(String endpoint, MultiValueMap<String, Object> body, String serviceType) {
        try {
            // 1. FastAPI 호출
            String url = mlServiceBaseUrl + endpoint;
            log.info("Calling ML Service: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            // 2. 응답 파싱
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());

            // 3. DB에 저장
            saveAnalysisResult(jsonResponse, serviceType);

            log.info("ML Service call successful for {}: {}", serviceType, jsonResponse);

            return jsonResponse;

        } catch (Exception e) {
            log.error("Error calling ML service for {}: {}", serviceType, e.getMessage(), e);
            throw new RuntimeException("ML 서비스 호출 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 파일 없이 FastAPI 호출 (프레스 진동 등)
     */
    public JsonNode callMLServiceWithoutFile(String endpoint, String serviceType) {
        return callMLServiceWithoutFile(endpoint, serviceType, 0);
    }

    /**
     * 파일 없이 FastAPI 호출 (offset 지원)
     */
    public JsonNode callMLServiceWithoutFile(String endpoint, String serviceType, int offset) {
        try {
            // offset 파라미터 추가
            String separator = endpoint.contains("?") ? "&" : "?";
            String url = mlServiceBaseUrl + endpoint + separator + "offset=" + offset;
            log.info("Calling ML Service (no file): {} with offset: {}", url, offset);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> requestEntity = new HttpEntity<>("{}", headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            saveAnalysisResult(jsonResponse, serviceType);

            return jsonResponse;

        } catch (Exception e) {
            log.error("Error calling ML service for {}: {}", serviceType, e.getMessage(), e);
            throw new RuntimeException("ML 서비스 호출 실패: " + e.getMessage(), e);
        }
    }

    /**
     * ML 분석 결과를 DB에 저장
     */
    private void saveAnalysisResult(JsonNode jsonResponse, String serviceType) {
        try {
            MLAnalysisResult result = MLAnalysisResult.builder()
                    .serviceType(serviceType)
                    .build();

            // 공통 필드 추출
            if (jsonResponse.has("status")) {
                result.setStatus(jsonResponse.get("status").asText());
            }
            if (jsonResponse.has("judgement")) {
                result.setStatus(jsonResponse.get("judgement").asText());
            }
            if (jsonResponse.has("prediction")) {
                result.setPrediction(jsonResponse.get("prediction").asInt());
            }
            if (jsonResponse.has("confidence")) {
                result.setConfidence(jsonResponse.get("confidence").asDouble());
            }
            if (jsonResponse.has("reconstruction_error")) {
                result.setReconstructionError(jsonResponse.get("reconstruction_error").asDouble());
            }
            if (jsonResponse.has("threshold")) {
                result.setThreshold(jsonResponse.get("threshold").asDouble());
            }
            if (jsonResponse.has("is_anomaly")) {
                result.setIsAnomaly(jsonResponse.get("is_anomaly").asInt());
            }
            if (jsonResponse.has("original_image_url")) {
                result.setOriginalImageUrl(jsonResponse.get("original_image_url").asText());
            }
            if (jsonResponse.has("result_image_url")) {
                result.setResultImageUrl(jsonResponse.get("result_image_url").asText());
            }
            if (jsonResponse.has("message")) {
                result.setMessage(jsonResponse.get("message").asText());
            }

            // 전체 JSON을 additionalInfo에 저장
            result.setAdditionalInfo(jsonResponse.toString());

            mlAnalysisResultRepository.save(result);
            log.info("Saved ML analysis result for {}: ID={}", serviceType, result.getId());

        } catch (Exception e) {
            log.error("Error saving ML analysis result: {}", e.getMessage(), e);
            // DB 저장 실패해도 API 응답은 반환
        }
    }

    /**
     * MultipartFile을 임시 파일로 변환
     */
    public File convertMultipartFileToFile(MultipartFile multipartFile) throws IOException {
        File tempFile = File.createTempFile("upload_", "_" + multipartFile.getOriginalFilename());
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(multipartFile.getBytes());
        }
        return tempFile;
    }

    /**
     * 윈드실드 분석
     */
    public JsonNode analyzeWindshield(String side, MultipartFile file) throws IOException {
        File tempFile = convertMultipartFileToFile(file);
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("side", side);
            body.add("file", new FileSystemResource(tempFile));

            return callMLServiceAndSave("/api/v1/smartfactory/windshield", body, "windshield");
        } finally {
            tempFile.delete();
        }
    }

    /**
     * 엔진 진동 분석
     */
    public JsonNode analyzeEngine(MultipartFile file) throws IOException {
        File tempFile = convertMultipartFileToFile(file);
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(tempFile));

            return callMLServiceAndSave("/api/v1/smartfactory/engine", body, "engine");
        } finally {
            tempFile.delete();
        }
    }

    /**
     * 용접 이미지 분석 (자동)
     */
    public JsonNode analyzeWeldingImageAuto(int offset) {
        return callMLServiceWithoutFile("/api/v1/smartfactory/welding/image/auto", "welding_image", offset);
    }

    /**
     * 도장 품질 분석 (자동)
     */
    public JsonNode analyzePaintAuto(int offset) {
        return callMLServiceWithoutFile("/api/v1/smartfactory/paint/auto", "paint", offset);
    }

    /**
     * 프레스 진동 분석
     */
    public JsonNode analyzePressVibration(int offset) {
        return callMLServiceWithoutFile("/api/v1/smartfactory/press/vibration", "press_vibration", offset);
    }

    /**
     * 프레스 이미지 분석
     */
    public JsonNode analyzePressImage(int offset) {
        return callMLServiceWithoutFile("/api/v1/smartfactory/press/image", "press_image", offset);
    }

    /**
     * 차체 조립 분석 (자동 배치)
     */
    public JsonNode analyzeBodyAssemblyBatchAuto(Double confidence, int offset) {
        try {
            String url = mlServiceBaseUrl + "/api/v1/smartfactory/body/inspect/batch/auto?offset=" + offset;
            log.info("Calling ML Service (body batch auto): {} with offset: {}", url, offset);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("conf", confidence != null ? confidence : 0.5);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            saveAnalysisResult(jsonResponse, "body_assembly");

            return jsonResponse;

        } catch (Exception e) {
            log.error("Error calling ML service for body assembly: {}", e.getMessage(), e);
            throw new RuntimeException("ML 서비스 호출 실패: " + e.getMessage(), e);
        }
    }
}
