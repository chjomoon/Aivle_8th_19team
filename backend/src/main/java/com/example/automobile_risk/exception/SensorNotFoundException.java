package com.example.automobile_risk.exception;

public class SensorNotFoundException extends EntityNotFoundException {

    public SensorNotFoundException() {
        super();
    }

    public SensorNotFoundException(Long id) {
        super("Sensor not found. id=" + id);
    }

    public SensorNotFoundException(String message) {
        super(message);
    }


    public SensorNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public SensorNotFoundException(Throwable cause) {
        super(cause);
    }

    protected SensorNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
