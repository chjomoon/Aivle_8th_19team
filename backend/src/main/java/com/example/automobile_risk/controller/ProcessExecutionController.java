package com.example.automobile_risk.controller;

import com.example.automobile_risk.controller.dto.*;
import com.example.automobile_risk.service.ProcessExecutionService;
import com.example.automobile_risk.service.dto.ProcessExecutionDetailResponse;
import com.example.automobile_risk.service.dto.ProcessExecutionListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/process-execution")
@RestController
public class ProcessExecutionController {

    private final ProcessExecutionService processExecutionService;

    /**
     *  1. 공정수행 생성
     */
    @PostMapping
    public ApiResponse<Long> create(@Valid @RequestBody ProcessExecutionCreateForm form) {

        Long processExecutionId = processExecutionService.create(form);

        return ApiResponse.of(processExecutionId);
    }

    /**
     *  2. 공정수행 수정
     */
    @PatchMapping("/{id}")
    public ApiResponse<Long> update(@PathVariable(name = "id") Long id,
                                    @Valid @RequestBody ProcessExecutionUpdateForm form) {

        Long processExecutionId = processExecutionService.update(id, form);

        return ApiResponse.of(processExecutionId);
    }

    @PatchMapping("/{id}/operate")
    public ApiResponse<Long> operate(@PathVariable(name = "id") Long id) {

        Long processExecutionId = processExecutionService.operate(id);

        return ApiResponse.of(processExecutionId);
    }

    /**
     *  3. 공정수행 완료
     */
    @PatchMapping("/{id}/complete")
    public ApiResponse<Long> complete(@PathVariable(name = "id") Long id,
                                                   @Valid @RequestBody ProcessExecutionCompleteForm form) {

        Long processExecutionId = processExecutionService.complete(id, form.getEndDate());

        return ApiResponse.of(processExecutionId);
    }

    /**
     *  4. 공정수행 중지
     */
    @PatchMapping("/{id}/stop")
    public ApiResponse<Long> stop(@PathVariable(name = "id") Long id) {

        Long processExecutionId = processExecutionService.stop(id);

        return ApiResponse.of(processExecutionId);
    }

    /**
     *  5. 공정수행 단건 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<ProcessExecutionDetailResponse> getDetail(@PathVariable(name = "id") Long id) {

        ProcessExecutionDetailResponse response = processExecutionService.getDetail(id);

        return ApiResponse.of(response);
    }

    /**
     *  6. 공정수행 목록 조회 (활성, 비활성 모두)
     */
    @GetMapping
    public ApiResponse<List<ProcessExecutionListResponse>> getList() {

        List<ProcessExecutionListResponse> list = processExecutionService.getList();

        return ApiResponse.of(list);
    }
}
