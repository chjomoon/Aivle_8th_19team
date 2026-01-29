package com.example.automobile_risk.entity.enumclass;

public enum RiskLevel {

    LOW("낮음"),
    MEDIUM("보통"),
    HIGH("높음"),
    CRITICAL("심각");

    private final String label;

    RiskLevel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
