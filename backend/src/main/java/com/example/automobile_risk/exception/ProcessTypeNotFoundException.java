package com.example.automobile_risk.exception;

public class ProcessTypeNotFoundException extends EntityNotFoundException {

    public ProcessTypeNotFoundException() {
        super();
    }

    public ProcessTypeNotFoundException(Long id) {
        super("ProcessType not found. id=" + id);
    }

    public ProcessTypeNotFoundException(String message) {
        super(message);
    }


    public ProcessTypeNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public ProcessTypeNotFoundException(Throwable cause) {
        super(cause);
    }

    protected ProcessTypeNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
