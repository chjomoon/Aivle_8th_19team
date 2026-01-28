package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.EquipmentCreateForm;
import com.example.automobile_risk.controller.dto.EquipmentUpdateForm;
import com.example.automobile_risk.entity.Equipment;
import com.example.automobile_risk.entity.ProcessType;
import com.example.automobile_risk.entity.enumclass.EquipmentStatus;
import com.example.automobile_risk.exception.EquipmentNotFoundException;
import com.example.automobile_risk.exception.ProcessTypeNotFoundException;
import com.example.automobile_risk.repository.EquipmentRepository;
import com.example.automobile_risk.repository.ProcessTypeRepository;
import com.example.automobile_risk.service.dto.EquipmentDetailResponse;
import com.example.automobile_risk.service.dto.EquipmentListResponse;
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
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final ProcessTypeRepository processTypeRepository;

    /**
     *  1. 설비 생성
     */
    @Transactional
    public Long createEquipment(EquipmentCreateForm form) {

        Long processTypeId = form.getProcessTypeId();
        ProcessType processType = processTypeRepository.findById(processTypeId)
                .orElseThrow(() -> new ProcessTypeNotFoundException(processTypeId));

        Equipment equipment = Equipment.createEquipment(form.getEquipmentName(), processType);

        Equipment savedEquipment = equipmentRepository.save(equipment);

        return savedEquipment.getId();
    }

    /**
     *  2. 설비 수정
     */
    @Transactional
    public Long updateEquipment(Long id, EquipmentUpdateForm form) {

        Long processTypeId = form.getProcessTypeId();
        ProcessType processType = processTypeRepository.findById(processTypeId)
                .orElseThrow(() -> new ProcessTypeNotFoundException(processTypeId));

        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new EquipmentNotFoundException(id));

        equipment.update(form.getEquipmentName(), processType);

        return equipment.getId();
    }

    /**
     *  3. 설비 삭제
     */
    @Transactional
    public Long deleteEquipment(Long equipmentId) {

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        equipmentRepository.deleteById(equipmentId);

        return equipment.getId();
    }

    /**
     *  4. 설비 중지
     */
    @Transactional
    public Long stopEquipment(Long equipmentId) {

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        equipment.stop();

        return equipment.getId();
    }

    /**
     *  5. 설비 정상화
     */
    @Transactional
    public Long normalizeEquipment(Long equipmentId) {

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        equipment.normalize();

        return equipment.getId();
    }

    /**
     *  6. 공정 타입 id와 설비 상태로 조회
     */
    public List<EquipmentListResponse> findByProcessTypeAndStatus(Long processTypeId, EquipmentStatus status) {
        return equipmentRepository.findByProcessTypeAndStatus(processTypeId, status)
                .stream()
                .map(EquipmentListResponse::from)
                .toList();
    }

    /**
     *  7. 설비 단건 조회
     */
    public EquipmentDetailResponse getEquipment(Long equipmentId) {

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        return EquipmentDetailResponse.builder()
                .equipmentId(equipment.getId())
                .equipmentName(equipment.getEquipmentName())
                .status(equipment.getStatus())
                .processTypeId(equipment.getProcessType().getId())
                .processTypeName(equipment.getProcessType().getProcessName())
                .build();
    }

    /**
     *  8. 설비 목록 조회
     */
    public List<EquipmentListResponse> getEquipmentList() {

        List<Equipment> equipmentList = equipmentRepository.findAll();

        return equipmentList.stream()
                .map(equipment -> {
                    return EquipmentListResponse.builder()
                            .equipmentId(equipment.getId())
                            .equipmentName(equipment.getEquipmentName())
                            .processTypeId(equipment.getProcessType().getId())
                            .processTypeName(equipment.getProcessType().getProcessName())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
