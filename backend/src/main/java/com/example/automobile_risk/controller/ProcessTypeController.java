package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.ProcessTypeCreateForm;
import com.example.automobile_risk.controller.dto.ProcessTypeUpdateForm;
import com.example.automobile_risk.service.ProcessTypeService;
import com.example.automobile_risk.service.dto.ProcessTypeDetailResponse;
import com.example.automobile_risk.service.dto.ProcessTypeListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/process-type")
@RestController
public class ProcessTypeController {

    private final ProcessTypeService processTypeService;

    /**
     *  1. 공정타입 생성
     */
    @PostMapping
    public ApiResponse<Long> createProcessType(@Valid @RequestBody ProcessTypeCreateForm form) {

        Long processTypeId = processTypeService.createProcessType(form);

        return ApiResponse.of(processTypeId);
    }

    /**
     *  2. 공정타입 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> updateProcessType(@PathVariable(name = "id") Long id,
                                        @Valid @RequestBody ProcessTypeUpdateForm form) {

        Long processTypeId = processTypeService.updateProcessType(id, form);

        return ApiResponse.of(processTypeId);
    }

    /**
     *  3. 공정타입 비활성화
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Long> deactivateProcessType(@PathVariable(name = "id") Long id) {

        Long processTypeId = processTypeService.deactivateProcessType(id);

        return ApiResponse.of(processTypeId);
    }

    /**
     *  4. 공정타입 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<ProcessTypeDetailResponse> getProcessType(@PathVariable(name = "id") Long id) {

        ProcessTypeDetailResponse processTypeDetailResponse = processTypeService.getProcessType(id);

        return ApiResponse.of(processTypeDetailResponse);
    }

    /**
     *  5. 공정타입 목록 조회 (활성, 비활성 모두)
     */
    @GetMapping
    public ApiResponse<List<ProcessTypeListResponse>> getProcessTypeList() {

        List<ProcessTypeListResponse> processTypeList = processTypeService.getProcessTypeList();

        return ApiResponse.of(processTypeList);
    }

    /**
     *  6. 공정타입 목록 조회 (활성만 조회)
     */
    @GetMapping("/is-active")
    public ApiResponse<List<ProcessTypeListResponse>> getActiveProcessTypes() {

        List<ProcessTypeListResponse> processTypeList = processTypeService.getActiveProcessTypes();

        return ApiResponse.of(processTypeList);
    }
}
