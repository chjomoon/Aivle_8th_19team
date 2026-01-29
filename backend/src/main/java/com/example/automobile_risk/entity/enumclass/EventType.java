package com.example.automobile_risk.entity.enumclass;

public enum EventType {

    BREAKDOWN("고장"),
    DEFECT("결함");

    private final String label;

    EventType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
