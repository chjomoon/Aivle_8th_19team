package com.example.automobile_risk.entity.enumclass;

public enum ProcessExecutionStatus {

    READY("공정 준비"),
    IN_PROGRESS("공정 진행 중"),
    COMPLETED("공정 수행 완료"),
    STOPPED("공정 수행 중지");

    private final String label;

    ProcessExecutionStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
