package com.example.automobile_risk.exception;

public class SensorDataNotFoundException extends EntityNotFoundException {

    public SensorDataNotFoundException() {
        super();
    }

    public SensorDataNotFoundException(Long id) {
        super("SensorData not found. id=" + id);
    }

    public SensorDataNotFoundException(String message) {
        super(message);
    }


    public SensorDataNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public SensorDataNotFoundException(Throwable cause) {
        super(cause);
    }

    protected SensorDataNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
