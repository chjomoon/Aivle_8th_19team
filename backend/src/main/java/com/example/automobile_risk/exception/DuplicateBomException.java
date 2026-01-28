package com.example.automobile_risk.exception;

public class DuplicateBomException extends RuntimeException {

    public DuplicateBomException() {
        super();
    }

    public DuplicateBomException(Long vehicleModelId, Long partId) {
        super("Duplicate Bom. vehicleModelId=" + vehicleModelId + ", partId=" + partId);
    }

    public DuplicateBomException(String message) {
        super(message);
    }


    public DuplicateBomException(String message, Throwable cause) {
        super(message, cause);
    }

    public DuplicateBomException(Throwable cause) {
        super(cause);
    }

    protected DuplicateBomException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
