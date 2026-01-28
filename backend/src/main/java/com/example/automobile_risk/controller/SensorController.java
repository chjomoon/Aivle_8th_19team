package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.SensorCreateForm;
import com.example.automobile_risk.controller.dto.SensorUpdateForm;
import com.example.automobile_risk.service.SensorService;
import com.example.automobile_risk.service.dto.SensorDetailResponse;
import com.example.automobile_risk.service.dto.SensorListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/sensor")
@RestController
public class SensorController {

    private final SensorService sensorService;

    /**
     *  1. 센서 생성
     */
    @PostMapping
    public ApiResponse<Long> create(@Valid @RequestBody SensorCreateForm form) {

        Long sensorId = sensorService.create(form);

        return ApiResponse.of(sensorId);
    }

    /**
     *  2. 센서 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> update(@PathVariable(name = "id") Long id,
                                    @Valid @RequestBody SensorUpdateForm form) {

        Long sensorId = sensorService.update(id, form);

        return ApiResponse.of(sensorId);
    }

    /**
     *  3. 센서 삭제
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Long> delete(@PathVariable(name = "id") Long id) {

        Long sensorId = sensorService.delete(id);

        return ApiResponse.of(sensorId);
    }

    /**
     *  4. 센서 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<SensorDetailResponse> getDetail(@PathVariable(name = "id") Long id) {

        SensorDetailResponse detail = sensorService.getDetail(id);

        return ApiResponse.of(detail);
    }

    /**
     *  5. 센서 목록 조회
     */
    @GetMapping
    public ApiResponse<List<SensorListResponse>> getList() {

        List<SensorListResponse> list = sensorService.getList();

        return ApiResponse.of(list);
    }
}
