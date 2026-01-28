package com.example.automobile_risk.entity.enumclass;

public enum Unit {

    EA("개"),
    SET("세트"),
    CELSIUS("℃"),
    HZ("Hz"),
    BAR("bar"),
    AMPERE("A"),
    MS("ms"),
    NONE("");

    private final String label;

    Unit(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
