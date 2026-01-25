package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.ProcessEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProcessRepository extends JpaRepository<ProcessEntity, Long> {
    Optional<ProcessEntity> findByName(String name);
}
