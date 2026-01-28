package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.ProcessExecutionCreateForm;
import com.example.automobile_risk.controller.dto.ProcessExecutionUpdateForm;
import com.example.automobile_risk.entity.Equipment;
import com.example.automobile_risk.entity.ProcessExecution;
import com.example.automobile_risk.entity.ProcessType;
import com.example.automobile_risk.entity.Production;
import com.example.automobile_risk.exception.EquipmentNotFoundException;
import com.example.automobile_risk.exception.ProcessExecutionNotFoundException;
import com.example.automobile_risk.exception.ProcessTypeNotFoundException;
import com.example.automobile_risk.exception.ProductionNotFoundException;
import com.example.automobile_risk.repository.EquipmentRepository;
import com.example.automobile_risk.repository.ProcessExecutionRepository;
import com.example.automobile_risk.repository.ProcessTypeRepository;
import com.example.automobile_risk.repository.ProductionRepository;
import com.example.automobile_risk.service.dto.ProcessExecutionDetailResponse;
import com.example.automobile_risk.service.dto.ProcessExecutionListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class ProcessExecutionService {

    private final ProcessExecutionRepository processExecutionRepository;
    private final ProductionRepository productionRepository;
    private final ProcessTypeRepository processTypeRepository;
    private final EquipmentRepository equipmentRepository;

    /**
     *  1. 공정수행 생성
     */
    @Transactional
    public Long create(ProcessExecutionCreateForm form) {

        Long productionId = form.getProductionId();
        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        Long processTypeId = form.getProcessTypeId();
        ProcessType processType = processTypeRepository.findById(processTypeId)
                .orElseThrow(() -> new ProcessTypeNotFoundException(processTypeId));

        Long equipmentId = form.getEquipmentId();
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        ProcessExecution processExecution = ProcessExecution.createEntity(
                form.getStartDate(),
                form.getExecutionOrder(),
                production,
                processType,
                equipment
        );

        ProcessExecution savedProcessExecution = processExecutionRepository.save(processExecution);

        return savedProcessExecution.getId();
    }

    /**
     *  2. 공정수행 수정
     */
    @Transactional
    public Long update(Long id, ProcessExecutionUpdateForm form) {

        Long productionId = form.getProductionId();
        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        Long processTypeId = form.getProcessTypeId();
        ProcessType processType = processTypeRepository.findById(processTypeId)
                .orElseThrow(() -> new ProcessTypeNotFoundException(processTypeId));

        Long equipmentId = form.getEquipmentId();
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        ProcessExecution processExecution = processExecutionRepository.findById(id)
                .orElseThrow(() -> new ProcessExecutionNotFoundException(id));

        // 수정 (변경 감지)
        processExecution.update(
                form.getStartDate(),
                form.getEndDate(),
                form.getExecutionOrder(),
                production,
                processType,
                equipment
        );

        return processExecution.getId();
    }

    /**
     *  3. 공정수행 가동
     */
    @Transactional
    public Long operate(Long processExecutionId) {

        ProcessExecution processExecution = processExecutionRepository.findById(processExecutionId)
                .orElseThrow(() -> new ProcessExecutionNotFoundException(processExecutionId));

        processExecution.operate();

        return processExecution.getId();
    }

    /**
     *  4. 공정수행 완료
     */
    @Transactional
    public Long complete(Long processExecutionId, LocalDateTime endDate) {

        ProcessExecution processExecution = processExecutionRepository.findById(processExecutionId)
                .orElseThrow(() -> new ProcessExecutionNotFoundException(processExecutionId));

        processExecution.complete(endDate);

        return processExecution.getId();
    }

    /**
     *  5. 공정수행 중지
     */
    @Transactional
    public Long stop(Long processExecutionId) {

        ProcessExecution processExecution = processExecutionRepository.findById(processExecutionId)
                .orElseThrow(() -> new ProcessExecutionNotFoundException(processExecutionId));

        processExecution.stop();

        return processExecution.getId();
    }

    /**
     *  6. 공정수행 단건 조회
     */
    public ProcessExecutionDetailResponse getDetail(Long processExecutionId) {

        return processExecutionRepository.findById(processExecutionId)
                .map(ProcessExecutionDetailResponse::from)
                .orElseThrow(() -> new ProcessExecutionNotFoundException(processExecutionId));
    }

    /**
     *  7. 공정수행 목록 조회
     */
    public List<ProcessExecutionListResponse> getList() {

        List<ProcessExecution> processExecutionList = processExecutionRepository.findAll();

        return processExecutionList.stream()
                .map(ProcessExecutionListResponse::from)
                .collect(Collectors.toList());
    }
}
