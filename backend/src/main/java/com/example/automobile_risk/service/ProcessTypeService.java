package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.ProcessTypeCreateForm;
import com.example.automobile_risk.controller.dto.ProcessTypeUpdateForm;
import com.example.automobile_risk.entity.ProcessType;
import com.example.automobile_risk.exception.ProcessTypeNotFoundException;
import com.example.automobile_risk.repository.ProcessTypeRepository;
import com.example.automobile_risk.service.dto.ProcessTypeDetailResponse;
import com.example.automobile_risk.service.dto.ProcessTypeListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class ProcessTypeService {

    private final ProcessTypeRepository processTypeRepository;

    /**
     *  1. 공정타입 생성
     */
    @Transactional
    public Long createProcessType(ProcessTypeCreateForm form) {

        ProcessType processType = ProcessType.createProcessType(
                form.getProcessName(),
                form.getProcessOrder(),
                form.isActive()
        );

        if (processTypeRepository.existsByProcessOrder(form.getProcessOrder())) {
            throw new IllegalStateException("이미 사용 중인 공정 순서입니다.");
        }

        ProcessType savedProcessType = processTypeRepository.save(processType);

        return savedProcessType.getId();
    }

    /**
     *  2. 공정타입 수정
     */
    @Transactional
    public Long updateProcessType(Long id, ProcessTypeUpdateForm form) {

        ProcessType processType = processTypeRepository.findById(id)
                .orElseThrow(() -> new ProcessTypeNotFoundException(id));

        if (processTypeRepository.existsByProcessOrder(form.getProcessOrder())
            && processType.getProcessOrder() != form.getProcessOrder()
        ) {
            throw new IllegalStateException("이미 사용 중인 공정 순서입니다.");
        }

        // 수정 (변경 감지)
        processType.update(form.getProcessName(), form.getProcessOrder(), form.isActive());

        return processType.getId();
    }

    /**
     *  3. 공정타입 비활성화
     */
    @Transactional
    public Long deactivateProcessType(Long processTypeId) {

        ProcessType processType = processTypeRepository.findById(processTypeId)
                .orElseThrow(() -> new ProcessTypeNotFoundException(processTypeId));

        processType.deactivate();

        return processType.getId();
    }

    /**
     *  4. 공정타입 단건 조회
     */
    public ProcessTypeDetailResponse getProcessType(Long processTypeId) {

        return processTypeRepository.findById(processTypeId)
                .map(ProcessTypeDetailResponse::from)
                .orElseThrow(() -> new ProcessTypeNotFoundException(processTypeId));
    }

    /**
     *  5. 공정타입 목록 조회 (활성, 비활성 모두)
     */
    public List<ProcessTypeListResponse> getProcessTypeList() {

        List<ProcessType> processTypeList = processTypeRepository.findAll();

        return processTypeList.stream()
                .map(ProcessTypeListResponse::from)
                .collect(Collectors.toList());
    }

    /**
     *  6. 공정타입 목록 조회 (활성만 조회)
     */
    public List<ProcessTypeListResponse> getActiveProcessTypes() {

        List<ProcessType> processTypeList = processTypeRepository.findByIsActiveTrueOrderByProcessOrderAsc();

        return processTypeList.stream()
                .map(ProcessTypeListResponse::from)
                .collect(Collectors.toList());
    }

}
