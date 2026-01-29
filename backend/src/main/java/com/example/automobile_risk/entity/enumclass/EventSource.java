package com.example.automobile_risk.entity.enumclass;

public enum EventSource {

    SENSOR("센서"),
    VISION("비전"),
    OPERATOR("작업자");

    private final String label;

    EventSource(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
