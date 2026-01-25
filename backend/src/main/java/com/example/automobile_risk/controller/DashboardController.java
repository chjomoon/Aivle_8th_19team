package com.example.automobile_risk.controller;

import com.example.automobile_risk.dto.DashboardResponse;
import com.example.automobile_risk.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/main")
    public DashboardResponse getMainDashboard() {
        return dashboardService.getMainDashboardData();
    }
}
