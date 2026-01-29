package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.DelayRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DelayRuleRepository extends JpaRepository<DelayRule, Long> {

    Optional<DelayRule> findByEventCode(String eventCode);

    List<DelayRule> findByIsActiveTrue();
}
