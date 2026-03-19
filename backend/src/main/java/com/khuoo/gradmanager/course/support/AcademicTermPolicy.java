package com.khuoo.gradmanager.course.support;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import lombok.NoArgsConstructor;

import java.util.Locale;
import java.util.Set;

@NoArgsConstructor
public final class AcademicTermPolicy {

    // DB/API에서 허용하는 학기 표준값
    private static final Set<String> ALLOWED_TERMS = Set.of("1", "SUMMER", "2", "WINTER");

    // 입력값을 표준 학기값으로 정규화하고 허용값 여부를 검증
    public static String normalize(String term) {
        if (term == null) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        String trimmed = term.trim();
        if (trimmed.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        String canonical = trimmed.toUpperCase(Locale.ROOT);

        if (!ALLOWED_TERMS.contains(canonical)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        return canonical;
    }
}