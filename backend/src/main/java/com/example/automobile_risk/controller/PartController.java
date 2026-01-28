package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.PartCreateForm;
import com.example.automobile_risk.controller.dto.PartUpdateForm;
import com.example.automobile_risk.service.PartService;
import com.example.automobile_risk.service.dto.PartDetailResponse;
import com.example.automobile_risk.service.dto.PartListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/part")
@RestController
public class PartController {

    private final PartService partService;

    /**
     *  1. 부품 등록
     */
    @PostMapping
    public ApiResponse<Long> createPart(@Valid @RequestBody PartCreateForm partCreateForm) {

        Long partId = partService.createPart(partCreateForm);

        return ApiResponse.of(partId);
    }

    /**
     *  2. 부품 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> updatePart(@PathVariable(name = "id") Long id,
                                        @Valid @RequestBody PartUpdateForm partUpdateForm) {

        Long partId = partService.updatePart(id, partUpdateForm);

        return ApiResponse.of(partId);
    }

    /**
     *  3. 부품 삭제
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Long> deletePart(@PathVariable(name = "id") Long id) {

        Long partId = partService.deletePart(id);

        return ApiResponse.of(partId);
    }

    /**
     *  4. 부품 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<PartDetailResponse> getVehicleModel(@PathVariable(name = "id") Long id) {

        PartDetailResponse partDetailResponse = partService.getPart(id);

        return ApiResponse.of(partDetailResponse);
    }

    /**
     *  5. 부품 목록 조회
     */
    @GetMapping
    public ApiResponse<List<PartListResponse>> getVehicleModelList() {

        List<PartListResponse> partList = partService.getPartList();

        return ApiResponse.of(partList);
    }

}
