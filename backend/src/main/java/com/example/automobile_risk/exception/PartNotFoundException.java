package com.example.automobile_risk.exception;

public class PartNotFoundException extends EntityNotFoundException {

    public PartNotFoundException() {
        super();
    }

    public PartNotFoundException(Long id) {
        super("Part not found. id=" + id);
    }

    public PartNotFoundException(String message) {
        super(message);
    }


    public PartNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public PartNotFoundException(Throwable cause) {
        super(cause);
    }

    protected PartNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
