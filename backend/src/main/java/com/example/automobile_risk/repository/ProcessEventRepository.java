package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.ProcessEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProcessEventRepository extends JpaRepository<ProcessEvent, Long> {

    List<ProcessEvent> findByOrderId(Long orderId);

    @Query("""
        select pe
        from ProcessEvent pe
        where pe.order.id = :orderId
          and pe.resolvedAt is null
    """)
    List<ProcessEvent> findUnresolvedByOrderId(@Param("orderId") Long orderId);
}
