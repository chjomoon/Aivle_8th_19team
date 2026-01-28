package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.Equipment;
import com.example.automobile_risk.entity.enumclass.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    @Query("""
        select e
        from Equipment e
        where e.processType.id = :processTypeId
          and e.status = :status
    """)
    List<Equipment> findByProcessTypeAndStatus(
            @Param("processTypeId") Long processTypeId,
            @Param("status") EquipmentStatus status
    );

}
