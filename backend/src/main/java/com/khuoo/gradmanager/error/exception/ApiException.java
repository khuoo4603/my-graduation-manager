package com.khuoo.gradmanager.error.exception;

import lombok.Getter;

// 서비스에서 던지는 표준 예외
@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }
}