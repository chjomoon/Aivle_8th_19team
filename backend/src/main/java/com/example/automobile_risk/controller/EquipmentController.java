package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.EquipmentCreateForm;
import com.example.automobile_risk.controller.dto.EquipmentUpdateForm;
import com.example.automobile_risk.entity.enumclass.EquipmentStatus;
import com.example.automobile_risk.service.EquipmentService;
import com.example.automobile_risk.service.dto.EquipmentDetailResponse;
import com.example.automobile_risk.service.dto.EquipmentListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/equipment")
@RestController
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     *  1. 설비 생성
     */
    @PostMapping
    public ApiResponse<Long> createEquipment(@Valid @RequestBody EquipmentCreateForm form) {

        Long equipmentId = equipmentService.createEquipment(form);

        return ApiResponse.of(equipmentId);
    }

    /**
     *  2. 설비 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> updateEquipment(@PathVariable(name = "id") Long id,
                                        @Valid @RequestBody EquipmentUpdateForm form) {

        Long equipmentId = equipmentService.updateEquipment(id, form);

        return ApiResponse.of(equipmentId);
    }

    /**
     *  3. 설비 삭제
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Long> deleteEquipment(@PathVariable(name = "id") Long id) {

        Long equipmentId = equipmentService.deleteEquipment(id);

        return ApiResponse.of(equipmentId);
    }

    /**
     *  4. 설비 중지
     */
    @PatchMapping("/{id}/stop")
    public ApiResponse<Long> stopEquipment(@PathVariable(name = "id") Long id) {

        Long equipmentId = equipmentService.stopEquipment(id);

        return ApiResponse.of(equipmentId);
    }

    /**
     *  5. 설비 정상화
     */
    @PatchMapping("/{id}/normalize")
    public ApiResponse<Long> normalizeEquipment(@PathVariable(name = "id") Long id) {

        Long equipmentId = equipmentService.normalizeEquipment(id);

        return ApiResponse.of(equipmentId);
    }

    /**
     *  6. 설비 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<EquipmentDetailResponse> getEquipment(@PathVariable(name = "id") Long id) {

        EquipmentDetailResponse equipmentDetailResponse = equipmentService.getEquipment(id);

        return ApiResponse.of(equipmentDetailResponse);
    }

    /**
     *  7. 설비 목록 조회
     */
    @GetMapping
    public ApiResponse<List<EquipmentListResponse>> getEquipmentList(
            @RequestParam(required = false) Long processTypeId,
            @RequestParam(required = false) EquipmentStatus status
    ) {

        List<EquipmentListResponse> byProcessTypeAndStatus
                = equipmentService.findByProcessTypeAndStatus(processTypeId, status);

        return ApiResponse.of(byProcessTypeAndStatus);
    }
}
