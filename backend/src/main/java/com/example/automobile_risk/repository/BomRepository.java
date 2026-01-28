package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.Bom;
import com.example.automobile_risk.entity.Part;
import com.example.automobile_risk.entity.VehicleModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BomRepository extends JpaRepository<Bom, Long> {

    boolean existsByVehicleModelAndPart(VehicleModel vehicleModel, Part part);
}
