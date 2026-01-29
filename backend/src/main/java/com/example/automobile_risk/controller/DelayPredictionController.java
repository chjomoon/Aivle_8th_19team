package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.ApiResponse;
import com.example.automobile_risk.service.DelayPredictionService;
import com.example.automobile_risk.service.dto.DelayPredictionOverviewResponse;
import com.example.automobile_risk.service.dto.DelayPredictionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/delay-prediction")
@RequiredArgsConstructor
public class DelayPredictionController {

    private final DelayPredictionService delayPredictionService;

    /**
     *  1. 주문별 지연 예측
     */
    @GetMapping("/orders/{orderId}")
    public ApiResponse<DelayPredictionResponse> predictForOrder(@PathVariable(name = "orderId") Long orderId) {
        DelayPredictionResponse response = delayPredictionService.predictForOrder(orderId);
        return ApiResponse.of(response);
    }

    /**
     *  2. 전체 지연 예측 개요
     */
    @GetMapping("/overview")
    public ApiResponse<DelayPredictionOverviewResponse> getOverview() {
        DelayPredictionOverviewResponse response = delayPredictionService.getOverview();
        return ApiResponse.of(response);
    }
}
