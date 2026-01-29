package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.ProductionVehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductionVehicleRepository extends JpaRepository<ProductionVehicle, Long> {
    boolean existsBySerialNumber(String serialNumber);
}
