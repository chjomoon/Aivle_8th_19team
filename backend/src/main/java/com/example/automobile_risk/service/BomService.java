package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.BomCreateForm;
import com.example.automobile_risk.controller.dto.BomUpdateForm;
import com.example.automobile_risk.entity.Bom;
import com.example.automobile_risk.entity.Part;
import com.example.automobile_risk.entity.VehicleModel;
import com.example.automobile_risk.exception.BomNotFoundException;
import com.example.automobile_risk.exception.DuplicateBomException;
import com.example.automobile_risk.exception.PartNotFoundException;
import com.example.automobile_risk.exception.VehicleModelNotFoundException;
import com.example.automobile_risk.repository.BomRepository;
import com.example.automobile_risk.repository.PartRepository;
import com.example.automobile_risk.repository.VehicleModelRepository;
import com.example.automobile_risk.service.dto.BomDetailResponse;
import com.example.automobile_risk.service.dto.BomListResponse;
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
public class BomService {

    private final BomRepository bomRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final PartRepository partRepository;

    /**
     *  1. BOM 등록
     */
    @Transactional
    public Long createBom(BomCreateForm bomCreateForm) {

        VehicleModel vehicleModel = vehicleModelRepository.findById(bomCreateForm.getVehicleModelId())
                .orElseThrow(() -> new VehicleModelNotFoundException(bomCreateForm.getVehicleModelId()));

        Part part = partRepository.findById(bomCreateForm.getPartId())
                .orElseThrow(() -> new PartNotFoundException(bomCreateForm.getPartId()));

        // 중복 BOM 검사
        if (bomRepository.existsByVehicleModelAndPart(vehicleModel, part)) {
            throw new DuplicateBomException(vehicleModel.getId(), part.getId());
        }

        Bom bom = Bom.builder()
                .requiredQty(bomCreateForm.getRequiredQty())
                .vehicleModel(vehicleModel)
                .part(part)
                .build();

        Bom savedBom = bomRepository.save(bom);

        return savedBom.getId();
    }

    /**
     *  2. BOM 수정
     */
    @Transactional
    public Long updateBom(Long id, BomUpdateForm bomUpdateForm) {

        Bom bom = bomRepository.findById(id)
                .orElseThrow(() -> new BomNotFoundException(id));

        VehicleModel vehicleModel = vehicleModelRepository.findById(bomUpdateForm.getVehicleModelId())
                .orElseThrow(() -> new VehicleModelNotFoundException(bomUpdateForm.getVehicleModelId()));

        Part part = partRepository.findById(bomUpdateForm.getPartId())
                .orElseThrow(() -> new PartNotFoundException(bomUpdateForm.getPartId()));

        // 수정 (변경 감지)
        bom.update(
                bomUpdateForm.getRequiredQty(),
                vehicleModel,
                part
        );

        return bom.getId();
    }

    /**
     *  3. BOM 삭제
     */
    @Transactional
    public Long deleteBom(Long bomId) {

        Bom bom = bomRepository.findById(bomId)
                .orElseThrow(() -> new BomNotFoundException(bomId));

        bomRepository.deleteById(bom.getId());

        return bom.getId();
    }

    /**
     *  4. BOM 단건 조회
     */
    public BomDetailResponse getBom(Long bomId) {

        return bomRepository.findById(bomId)
                .map(BomDetailResponse::from)
                .orElseThrow(() -> new BomNotFoundException(bomId));
    }

    /**
     *  5. BOM 목록 조회
     */
    public List<BomListResponse> getBomList() {

        List<Bom> bomList = bomRepository.findAll();

        return bomList.stream()
                .map(BomListResponse::from)
                .collect(Collectors.toList());
    }
}
