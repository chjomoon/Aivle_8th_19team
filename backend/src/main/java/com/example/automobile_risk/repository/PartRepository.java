package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartRepository extends JpaRepository<Part, Long> {
}
