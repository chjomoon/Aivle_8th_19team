package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.PredictionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PredictionSnapshotRepository extends JpaRepository<PredictionSnapshot, Long> {

    Optional<PredictionSnapshot> findTopByOrderIdOrderByCalculatedAtDesc(Long orderId);

    List<PredictionSnapshot> findByIsStale(boolean isStale);
}
