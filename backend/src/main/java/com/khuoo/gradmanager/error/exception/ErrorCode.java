package com.khuoo.gradmanager.error.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 에러 상태코드/기본 메시지를 코드로 통일
@RequiredArgsConstructor
@Getter
public enum ErrorCode {
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Invalid request"), // 요청 형식/입력값이 잘못된 경우, (Validation 실패, JSON 파싱 오류 등)
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found"), // 사용자가 존재하지 않는 경우
    TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "Template not found"), // 요청한 졸업 템플릿이 존재하지 않는 경우
    TEMPLATE_DEPT_MISMATCH(HttpStatus.BAD_REQUEST, "Template does not belong to user's department"), // 사용자의 학부와 템플릿 학부가 일치하지 않는 경우
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error"); // 처리 중 예상하지 못한 서버 내부 오류

    private final HttpStatus status;
    private final String defaultMessage;
}