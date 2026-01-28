package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.SensorDataCreateForm;
import com.example.automobile_risk.service.SensorDataService;
import com.example.automobile_risk.service.dto.SensorDataDetailResponse;
import com.example.automobile_risk.service.dto.SensorDataListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/sensor-data")
@RestController
public class SensorDataController {

    private final SensorDataService sensorDataService;

    /**
     *  1. 생성
     */
    @PostMapping
    public ApiResponse<Long> create(@Valid @RequestBody SensorDataCreateForm form) {

        Long sensorDataId = sensorDataService.create(form);

        return ApiResponse.of(sensorDataId);
    }

//    /**
//     *  2. 수정
//     */
//    @PatchMapping("/{id}")
//    public ApiResponse<Long> update(@PathVariable(name = "id") Long id,
//                                    @Valid @RequestBody SensorDataUpdateForm form) {
//
//        Long sensorDataId = sensorDataService.update(id, form);
//
//        return ApiResponse.of(sensorDataId);
//    }
//
//    /**
//     *  3. 삭제
//     */
//    @DeleteMapping("/{id}")
//    public ApiResponse<Long> delete(@PathVariable(name = "id") Long id) {
//
//        Long sensorDataId = sensorDataService.delete(id);
//
//        return ApiResponse.of(sensorDataId);
//    }

    /**
     *  4. 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<SensorDataDetailResponse> getDetail(@PathVariable(name = "id") Long id) {

        SensorDataDetailResponse detail = sensorDataService.getDetail(id);

        return ApiResponse.of(detail);
    }

//    /**
//     *  5. 목록 조회
//     */
//    @GetMapping
//    public ApiResponse<List<SensorDataListResponse>> getList() {
//
//        List<SensorDataListResponse> list = sensorDataService.getList();
//
//        return ApiResponse.of(list);
//    }

    /**
     *  1. 센서별 + 기간 조회
     *
     *  GET /api/v1/sensor-data/by-sensor
     */
    @GetMapping("/by-sensor")
    public ApiResponse<List<SensorDataListResponse>> getBySensorAndPeriod(
            @RequestParam Long sensorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {

        List<SensorDataListResponse> list =
                sensorDataService.getBySensorAndPeriod(sensorId, from, to);

        return ApiResponse.of(list);
    }

    /**
     *  2. 설비별 + 기간 조회
     *
     *  GET /api/v1/sensor-data/by-equipment
     */
    @GetMapping("/by-equipment")
    public ApiResponse<List<SensorDataListResponse>> getByEquipmentAndPeriod(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {

        List<SensorDataListResponse> list =
                sensorDataService.getByEquipmentAndPeriod(equipmentId, from, to);

        return ApiResponse.of(list);
    }
}
