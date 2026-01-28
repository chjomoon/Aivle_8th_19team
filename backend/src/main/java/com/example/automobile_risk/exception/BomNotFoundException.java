package com.example.automobile_risk.exception;

public class BomNotFoundException extends EntityNotFoundException {

    public BomNotFoundException() {
        super();
    }

    public BomNotFoundException(Long id) {
        super("BOM not found. id=" + id);
    }

    public BomNotFoundException(String message) {
        super(message);
    }


    public BomNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public BomNotFoundException(Throwable cause) {
        super(cause);
    }

    protected BomNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
