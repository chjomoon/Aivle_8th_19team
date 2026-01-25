package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.Anomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnomalyRepository extends JpaRepository<Anomaly, Long> {
    List<Anomaly> findByType(String type);
}
