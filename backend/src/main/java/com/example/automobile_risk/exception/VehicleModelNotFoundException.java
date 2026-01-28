package com.example.automobile_risk.exception;

public class VehicleModelNotFoundException extends EntityNotFoundException {

    public VehicleModelNotFoundException() {
        super();
    }

    public VehicleModelNotFoundException(Long id) {
        super("VehicleModel not found. id=" + id);
    }

    public VehicleModelNotFoundException(String message) {
        super(message);
    }


    public VehicleModelNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public VehicleModelNotFoundException(Throwable cause) {
        super(cause);
    }

    protected VehicleModelNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
