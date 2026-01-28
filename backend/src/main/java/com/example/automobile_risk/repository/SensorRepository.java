package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SensorRepository extends JpaRepository<Sensor, Long> {

}
