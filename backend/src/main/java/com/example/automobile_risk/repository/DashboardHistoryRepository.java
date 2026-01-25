package com.example.automobile_risk.repository;

import com.example.automobile_risk.entity.DashboardHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DashboardHistoryRepository extends JpaRepository<DashboardHistory, Long> {
    List<DashboardHistory> findAllByOrderByIdAsc();
}
