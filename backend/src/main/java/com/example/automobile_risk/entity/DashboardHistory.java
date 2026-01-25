package com.example.automobile_risk.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dashboard_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String date; // e.g., '1/5'
    private Double totalDelay;
}
