package com.ncwu.stylehub.exception;

/** API error carrying an HTTP status and a FastAPI-style {"detail": "..."} body. */
public class ApiException extends RuntimeException {

    private final int status;

    public ApiException(int status, String detail) {
        super(detail);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
