package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.ProcessType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcessTypeRepository extends JpaRepository<ProcessType, Long> {

    // 공정 순서 존재 여부
    boolean existsByProcessOrder(int processOrder);

    // 활성 공정만 조회
    List<ProcessType> findByIsActiveTrueOrderByProcessOrderAsc();
}
