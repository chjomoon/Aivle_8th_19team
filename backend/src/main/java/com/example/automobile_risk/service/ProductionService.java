package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.ProductionCreateForm;
import com.example.automobile_risk.controller.dto.ProductionUpdateForm;
import com.example.automobile_risk.entity.Production;
import com.example.automobile_risk.exception.ProductionNotFoundException;
import com.example.automobile_risk.repository.ProcessExecutionRepository;
import com.example.automobile_risk.repository.ProductionRepository;
import com.example.automobile_risk.repository.ProductionVehicleRepository;
import com.example.automobile_risk.service.dto.ProductionDetailResponse;
import com.example.automobile_risk.service.dto.ProductionListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class ProductionService {

    private final ProductionRepository productionRepository;
    private final ProcessExecutionRepository processExecutionRepository;

    /**
     *  1. 생산 생성
     */
    @Transactional
    public Long createProduction(ProductionCreateForm form) {

        Production production = Production.createProduction(form.getStartDate());

        Production savedProduction = productionRepository.save(production);

        return savedProduction.getId();
    }

    /**
     *  2. 생산시작일 수정
     */
    @Transactional
    public Long rescheduleStartDate(Long id, ProductionUpdateForm form) {

        Production production = productionRepository.findById(id)
                .orElseThrow(() -> new ProductionNotFoundException(id));

        production.rescheduleStartDate(form.getStartDate());

        return production.getId();
    }

    /**
     *  3. 생산 취소
     */
    @Transactional
    public Long cancelProduction(Long productionId) {

        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        production.cancel();

        return production.getId();
    }

    /**
     *  4. 생산 시작
     */
    @Transactional
    public Long startProduction(Long productionId) {

        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        production.start();

        return production.getId();
    }

    /**
     *  5. 생산 완료
     */
    @Transactional
    public Long completeProduction(Long productionId, LocalDateTime endDate, List<String> serialNumbers) {

        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        // 모든 공정이 완료되었는지 검증
        long remaining =
                processExecutionRepository.countNotCompletedByProductionId(productionId);

        if (remaining > 0) {
            throw new IllegalStateException(
                    "완료되지 않은 공정이 존재하여 생산을 완료할 수 없습니다."
            );
        }

        production.complete(endDate);

        return production.getId();
    }

    /**
     *  6. 생산 중지
     */
    @Transactional
    public Long stopProduction(Long productionId) {

        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        production.stop();

        return production.getId();
    }

    /**
     *  7. 생산 재시작
     */
    @Transactional
    public Long restartProduction(Long productionId) {

        Production production = productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));

        production.restart();

        return production.getId();
    }

    /**
     *  8. 생산 단건 조회
     */
    public ProductionDetailResponse getProduction(Long productionId) {

        return productionRepository.findById(productionId)
                .map(ProductionDetailResponse::from)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));
    }

    /**
     *  9. 생산 목록 조회
     */
    public List<ProductionListResponse> getProductionList() {

        return productionRepository.findAll().stream()
                .map(ProductionListResponse::from)
                .toList();
    }

    /**
     *  10. 엔티티 조회
     */
    public Production getEntity(Long productionId) {
        return productionRepository.findById(productionId)
                .orElseThrow(() -> new ProductionNotFoundException(productionId));
    }
}
