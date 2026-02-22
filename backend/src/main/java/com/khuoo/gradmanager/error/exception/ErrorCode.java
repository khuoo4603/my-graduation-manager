package com.khuoo.gradmanager.error.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 에러 상태코드/기본 메시지를 코드로 통일
@RequiredArgsConstructor
@Getter
public enum ErrorCode {
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Invalid request"), // 400, 요청 형식/입력값이 잘못된 경우 (Validation 실패, JSON 파싱 오류 등)
    TEMPLATE_DEPT_MISMATCH(HttpStatus.BAD_REQUEST, "Template does not belong to user's department"), // 400, 사용자의 학부와 템플릿 학부가 일치하지 않는 경우
    STORAGE_QUOTA_EXCEEDED(HttpStatus.BAD_REQUEST, "Storage quota exceeded"), // 400, 사용자 용량 제한을 초과한 업로드 요청인 경우

    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Unauthorized"), // 401, 인증 정보가 없거나 유효하지 않은 경우 (JWT 누락/만료 등)
    FORBIDDEN(HttpStatus.FORBIDDEN, "Forbidden"), // 403, 인증은 됐지만 권한이 없거나 리소스 소유자가 아닌 경우

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found"), // 404, 사용자가 존재하지 않는 경우
    TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "Template not found"), // 404, 요청한 졸업 템플릿이 존재하지 않는 경우
    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "Course not found"), // 404, 수강 내역이 존재하지 않는 경우 (삭제 row=0, 내 수강이 아님 포함)
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "File not found"), // 404, 파일 메타 또는 실제 파일이 존재하지 않는 경우

    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "Duplicate resource"), // 409, UNIQUE 제약 위반 등 중복 생성 요청인 경우 (email 중복 등)

    DEPENDENCY_FAILURE(HttpStatus.BAD_GATEWAY, "Dependency failure"), // 502, 외부/의존 시스템 오류 (OAuth, NAS, 외부 API 장애 등)

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error"); // 500, 처리 중 예상하지 못한 서버 내부 오류


    private final HttpStatus status;
    private final String defaultMessage;
}