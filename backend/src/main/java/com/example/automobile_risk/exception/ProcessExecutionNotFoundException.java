package com.example.automobile_risk.exception;

public class ProcessExecutionNotFoundException extends EntityNotFoundException {

    public ProcessExecutionNotFoundException() {
        super();
    }

    public ProcessExecutionNotFoundException(Long id) {
        super("ProcessExecution not found. id=" + id);
    }

    public ProcessExecutionNotFoundException(String message) {
        super(message);
    }


    public ProcessExecutionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public ProcessExecutionNotFoundException(Throwable cause) {
        super(cause);
    }

    protected ProcessExecutionNotFoundException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
