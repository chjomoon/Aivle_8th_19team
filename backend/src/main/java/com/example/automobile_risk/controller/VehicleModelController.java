package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.VehicleModelCreateForm;
import com.example.automobile_risk.controller.dto.VehicleModelUpdateForm;
import com.example.automobile_risk.service.VehicleModelService;
import com.example.automobile_risk.service.dto.VehicleModelDetailResponse;
import com.example.automobile_risk.service.dto.VehicleModelListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/vehicle-model")
@RestController
public class VehicleModelController {

    private final VehicleModelService vehicleModelService;

    /**
     *  1. 차량 등록
     */
    @PostMapping
    public ApiResponse<Long> createVehicleModel(@Valid @RequestBody VehicleModelCreateForm vehicleModelCreateForm) {

        Long vehicleModelId = vehicleModelService.createVehicleModel(vehicleModelCreateForm);

        return ApiResponse.of(vehicleModelId);
    }

    /**
     *  2. 차량 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> updateVehicleModel(@PathVariable(name = "id") Long id,
                                                @Valid @RequestBody VehicleModelUpdateForm vehicleModelUpdateForm) {

        Long vehicleModelId = vehicleModelService.updateVehicleModel(id, vehicleModelUpdateForm);

        return ApiResponse.of(vehicleModelId);
    }

    /**
     *  3. 차량 삭제
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Long> deleteVehicleModel(@PathVariable(name = "id") Long id) {

        Long vehicleModelId = vehicleModelService.deleteVehicleModel(id);

        return ApiResponse.of(vehicleModelId);
    }

    /**
     *  4. 차량 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<VehicleModelDetailResponse> getVehicleModel(@PathVariable(name = "id") Long id) {

        VehicleModelDetailResponse vehicleModelDetailResponse = vehicleModelService.getVehicleModel(id);

        return ApiResponse.of(vehicleModelDetailResponse);
    }

    /**
     *  5. 차량 목록 조회
     */
    @GetMapping
    public ApiResponse<List<VehicleModelListResponse>> getVehicleModelList() {

        List<VehicleModelListResponse> vehicleModelList = vehicleModelService.getVehicleModelList();

        return ApiResponse.of(vehicleModelList);
    }

}
