package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    // 센서별 + 기간
    @Query("""
        select sd
        from SensorData sd
        where sd.sensor.id = :sensorId
          and sd.measuredAt between :from and :to
        order by sd.measuredAt
    """)
    List<SensorData> findBySensorAndPeriod(
            @Param("sensorId") Long sensorId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    // 설비별 + 기간
    @Query("""
        select sd
        from SensorData sd
        join sd.sensor s
        join s.equipment e
        where e.id = :equipmentId
          and sd.measuredAt between :from and :to
        order by sd.measuredAt
    """)
    List<SensorData> findByEquipmentAndPeriod(
            @Param("equipmentId") Long equipmentId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
