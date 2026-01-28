package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.PartCreateForm;
import com.example.automobile_risk.controller.dto.PartUpdateForm;
import com.example.automobile_risk.entity.Part;
import com.example.automobile_risk.exception.PartNotFoundException;
import com.example.automobile_risk.repository.PartRepository;
import com.example.automobile_risk.service.dto.PartDetailResponse;
import com.example.automobile_risk.service.dto.PartListResponse;
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
public class PartService {

    private final PartRepository partRepository;

    /**
     *  1. 부품 등록
     */
    @Transactional
    public Long createPart(PartCreateForm partCreateForm) {

        Part part = partCreateForm.toEntity();

        Part savedPart = partRepository.save(part);

        return savedPart.getId();
    }

    /**
     *  2. 부품 수정
     */
    @Transactional
    public Long updatePart(Long id, PartUpdateForm partUpdateForm) {

        Part part = partRepository.findById(id)
                .orElseThrow(() -> new PartNotFoundException(id));

        // 수정 (변경 감지)
        part.update(
                partUpdateForm.getPartName(),
                partUpdateForm.getPartType(),
                partUpdateForm.getUnit()
        );

        return part.getId();
    }

    /**
     *  3. 부품 삭제
     */
    @Transactional
    public Long deletePart(Long partId) {

        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new PartNotFoundException(partId));

        partRepository.deleteById(part.getId());

        return part.getId();
    }

    /**
     *  4. 부품 단건 조회
     */
    public PartDetailResponse getPart(Long partId) {

        return partRepository.findById(partId)
                .map(PartDetailResponse::from)
                .orElseThrow(() -> new PartNotFoundException(partId));
    }

    /**
     *  5. 부품 목록 조회
     */
    public List<PartListResponse> getPartList() {

        List<Part> partList = partRepository.findAll();

        return partList.stream()
                .map(PartListResponse::from)
                .collect(Collectors.toList());
    }
}
