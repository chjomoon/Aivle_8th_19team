package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.VehicleModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleModelRepository extends JpaRepository<VehicleModel, Long> {
}