package com.example.automobile_risk.controller;

import com.example.automobile_risk.service.MLProxyService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * ML 서비스 프록시 컨트롤러
 * Frontend → Spring Boot → FastAPI → DB 아키텍처 구현
 */
@RestController
@RequestMapping("/api/v1/ml")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MLProxyController {

    private final MLProxyService mlProxyService;

    /**
     * 윈드실드 분석
     * POST /api/v1/ml/windshield
     */
    @PostMapping("/windshield")
    public ResponseEntity<JsonNode> analyzeWindshield(
            @RequestParam("side") String side,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Windshield analysis request - side: {}, file: {}", side, file.getOriginalFilename());
            JsonNode result = mlProxyService.analyzeWindshield(side, file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in windshield analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 엔진 진동 분석
     * POST /api/v1/ml/engine
     */
    @PostMapping("/engine")
    public ResponseEntity<JsonNode> analyzeEngine(
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Engine analysis request - file: {}", file.getOriginalFilename());
            JsonNode result = mlProxyService.analyzeEngine(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in engine analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 용접 이미지 분석 (자동)
     * POST /api/v1/ml/welding/image/auto
     */
    @PostMapping("/welding/image/auto")
    public ResponseEntity<JsonNode> analyzeWeldingImageAuto(
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            log.info("Welding image auto analysis request - offset: {}", offset);
            JsonNode result = mlProxyService.analyzeWeldingImageAuto(offset);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in welding image analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 도장 품질 분석 (자동)
     * POST /api/v1/ml/paint/auto
     */
    @PostMapping("/paint/auto")
    public ResponseEntity<JsonNode> analyzePaintAuto(
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            log.info("Paint auto analysis request - offset: {}", offset);
            JsonNode result = mlProxyService.analyzePaintAuto(offset);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in paint analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 프레스 진동 분석
     * POST /api/v1/ml/press/vibration
     */
    @PostMapping("/press/vibration")
    public ResponseEntity<JsonNode> analyzePressVibration(
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            log.info("Press vibration analysis request - offset: {}", offset);
            JsonNode result = mlProxyService.analyzePressVibration(offset);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in press vibration analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 프레스 이미지 분석
     * POST /api/v1/ml/press/image
     */
    @PostMapping("/press/image")
    public ResponseEntity<JsonNode> analyzePressImage(
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            log.info("Press image analysis request - offset: {}", offset);
            JsonNode result = mlProxyService.analyzePressImage(offset);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in press image analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 차체 조립 분석 (자동 배치)
     * POST /api/v1/ml/body/inspect/batch/auto
     */
    @PostMapping("/body/inspect/batch/auto")
    public ResponseEntity<JsonNode> analyzeBodyAssemblyBatchAuto(
            @RequestParam(value = "conf", required = false, defaultValue = "0.5") Double confidence,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            log.info("Body assembly batch auto analysis request - confidence: {}, offset: {}", confidence, offset);
            JsonNode result = mlProxyService.analyzeBodyAssemblyBatchAuto(confidence, offset);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in body assembly analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 헬스체크
     * GET /api/v1/ml/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("{\"status\":\"ok\",\"message\":\"ML Proxy Service is running\"}");
    }
}
