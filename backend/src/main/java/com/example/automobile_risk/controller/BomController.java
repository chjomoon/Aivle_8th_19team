package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.BomCreateForm;
import com.example.automobile_risk.controller.dto.BomUpdateForm;
import com.example.automobile_risk.service.BomService;
import com.example.automobile_risk.service.dto.BomDetailResponse;
import com.example.automobile_risk.service.dto.BomListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/bom")
@RestController
public class BomController {

    private final BomService bomService;

    /**
     *  1. BOM 등록
     */
    @PostMapping
    public ApiResponse<Long> createBom(@Valid @RequestBody BomCreateForm bomCreateForm) {

        Long bomId = bomService.createBom(bomCreateForm);

        return ApiResponse.of(bomId);
    }

    /**
     *  2. BOM 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> updateBom(@PathVariable(name = "id") Long id,
                                       @Valid @RequestBody BomUpdateForm bomUpdateForm) {

        Long bomId = bomService.updateBom(id, bomUpdateForm);

        return ApiResponse.of(bomId);
    }

    /**
     *  3. BOM 삭제
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Long> deleteBom(@PathVariable(name = "id") Long id) {

        Long bomId = bomService.deleteBom(id);

        return ApiResponse.of(bomId);
    }

    /**
     *  4. BOM 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<BomDetailResponse> getBom(@PathVariable(name = "id") Long id) {

        BomDetailResponse bomDetailResponse = bomService.getBom(id);

        return ApiResponse.of(bomDetailResponse);
    }

    /**
     *  5. BOM 목록 조회
     */
    @GetMapping
    public ApiResponse<List<BomListResponse>> getBomList() {

        List<BomListResponse> bomList = bomService.getBomList();

        return ApiResponse.of(bomList);
    }
}
