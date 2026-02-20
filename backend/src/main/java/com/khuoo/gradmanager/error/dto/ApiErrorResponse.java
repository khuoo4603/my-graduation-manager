package com.khuoo.gradmanager.error.dto;

import java.time.Instant;

// 모든 에러 응답을 동일한 JSON 구조로 통일
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path
) {
    public static ApiErrorResponse of(
            int status,
            String error,
            String code,
            String message,
            String path
    ) {
        return new ApiErrorResponse(Instant.now(), status, error, code, message, path);
    }

}