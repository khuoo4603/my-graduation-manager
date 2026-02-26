package com.khuoo.gradmanager.error;

import com.khuoo.gradmanager.error.dto.ApiErrorResponse;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// 전역 예외를 상태코드/포맷으로 변환
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 서비스에서 던진 ApiException 처리
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        ErrorCode code = ex.getErrorCode();
        return buildResponse(code, code.getDefaultMessage(), request, ex);
    }

    // @Valid 검증 실패 처리 (templateId null/음수/0 등)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        // 상세 메시지를 내려줄 계획이 없으면 defaultMessage로 통일
        return buildResponse(ErrorCode.INVALID_REQUEST, ErrorCode.INVALID_REQUEST.getDefaultMessage(), request, ex);
    }

    // JSON 바디 누락/파싱 실패 처리
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleBodyMissingOrInvalid(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return buildResponse(ErrorCode.INVALID_REQUEST, ErrorCode.INVALID_REQUEST.getDefaultMessage(), request, ex);
    }

    // 그 외 예외는 500으로 통일
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        return buildResponse(ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.getDefaultMessage(), request, ex);
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            ErrorCode code,
            String message,
            HttpServletRequest request,
            Throwable ex
    ) {
        HttpStatus status = code.getStatus();
        String path = request.getRequestURI();

        // 5xx는 스택트레이스 출력
        if (status.is5xxServerError()) {
            log.error("Server error. status={} code={} path={} exception={} message={}",
                    status.value(),
                    code.name(),
                    path,
                    ex.getClass().getSimpleName(),
                    ex.getMessage(),
                    ex
            );
        } else {
            // 4xx는 스택트레이스 없이 출력
            log.warn("Client error. status={} code={} path={} exception={} message={}",
                    status.value(),
                    code.name(),
                    path,
                    ex.getClass().getSimpleName(),
                    ex.getMessage()
            );
        }

        ApiErrorResponse body = ApiErrorResponse.of(
                status.value(),
                status.getReasonPhrase(),
                code.name(),
                message,
                path
        );

        return ResponseEntity.status(status).body(body);
    }
}