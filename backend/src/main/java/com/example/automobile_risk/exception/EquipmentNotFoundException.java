package com.example.automobile_risk.exception;

public class EquipmentNotFoundException extends EntityNotFoundException {

    public EquipmentNotFoundException() {
        super();
    }

    public EquipmentNotFoundException(Long id) {
        super("Equipment not found. id=" + id);
    }

    public EquipmentNotFoundException(String message) {
        super(message);
    }


    public EquipmentNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public EquipmentNotFoundException(Throwable cause) {
        super(cause);
    }

    protected EquipmentNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
