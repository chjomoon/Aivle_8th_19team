package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.ProcessExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProcessExecutionRepository extends JpaRepository<ProcessExecution, Long> {

    @Query("""
        select count(pe)
        from ProcessExecution pe
        where pe.production.id = :productionId
          and pe.status <> com.example.automobile_risk.entity.enumclass.ProcessExecutionStatus.COMPLETED
    """)
    long countNotCompletedByProductionId(@Param("productionId") Long productionId);
}
