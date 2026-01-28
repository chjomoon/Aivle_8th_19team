package com.example.automobile_risk.entity.enumclass;

public enum EquipmentStatus {

    NORMAL("정상"),
    WARNING("이상 감지"),
    STOP("설비 중지");

    private final String label;

    EquipmentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
