package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.VehicleModelCreateForm;
import com.example.automobile_risk.controller.dto.VehicleModelUpdateForm;
import com.example.automobile_risk.entity.VehicleModel;
import com.example.automobile_risk.exception.VehicleModelNotFoundException;
import com.example.automobile_risk.repository.VehicleModelRepository;
import com.example.automobile_risk.service.dto.VehicleModelDetailResponse;
import com.example.automobile_risk.service.dto.VehicleModelListResponse;
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
public class VehicleModelService {

    private final VehicleModelRepository vehicleModelRepository;

    /**
     *  1. 차량 등록
     */
    @Transactional
    public Long createVehicleModel(VehicleModelCreateForm vehicleModelCreateForm) {

        VehicleModel vehicleModel = vehicleModelCreateForm.toEntity();

        VehicleModel savedVehicleModel = vehicleModelRepository.save(vehicleModel);

        return savedVehicleModel.getId();
    }

    /**
     *  2. 차량 수정
     */
    @Transactional
    public Long updateVehicleModel(Long id, VehicleModelUpdateForm vehicleModelUpdateForm) {

        VehicleModel vehicleModel = vehicleModelRepository.findById(id)
                .orElseThrow(() -> new VehicleModelNotFoundException(id));

        // 수정 (변경 감지)
        vehicleModel.update(
                vehicleModelUpdateForm.getModelName(),
                vehicleModelUpdateForm.getSegment(),
                vehicleModelUpdateForm.getFuel(),
                vehicleModelUpdateForm.getDescription(),
                vehicleModelUpdateForm.isActive()
        );

        return vehicleModel.getId();
    }

    /**
     *  3. 차량 삭제
     */
    @Transactional
    public Long deleteVehicleModel(Long vehicleModelId) {

        VehicleModel vehicleModel = vehicleModelRepository.findById(vehicleModelId)
                .orElseThrow(() -> new VehicleModelNotFoundException(vehicleModelId));

        vehicleModelRepository.deleteById(vehicleModel.getId());

        return vehicleModel.getId();
    }

    /**
     *  4. 차량 단건 조회
     */
    public VehicleModelDetailResponse getVehicleModel(Long vehicleModelId) {

        return vehicleModelRepository.findById(vehicleModelId)
                .map(VehicleModelDetailResponse::from)
                .orElseThrow(() -> new VehicleModelNotFoundException(vehicleModelId));
    }

    /**
     *  5. 차량 목록 조회
     */
    public List<VehicleModelListResponse> getVehicleModelList() {

        List<VehicleModel> vehicleModelList = vehicleModelRepository.findAll();

        return vehicleModelList.stream()
                .map(VehicleModelListResponse::from)
                .collect(Collectors.toList());
    }
}
