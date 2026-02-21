package com.khuoo.gradmanager.reference.course.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchItem;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchResponse;
import com.khuoo.gradmanager.reference.course.repository.CourseMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;


@Service
@RequiredArgsConstructor
public class CourseMasterService {

    private final CourseMasterRepository courseMasterRepository;

    // 강의목록 조회 (개설년도, 개설학기 필수)
    public CourseMasterSearchResponse search(
            int openedYear,
            String openedTerm,
            String code,        // 과목 코드
            String name,        // 과목 이름
            String category,    // 전공/교양
            String subcategory, // 전공필수/교양필수/전공선택/소양
            String deptName     // 학부이름
    ) {
        // term 필수, trim 후 blank면 에러
        String term = normalizeRequired(openedTerm);

        // 선택 파라미터들은 blank면 null로 정리
        String nCode = normalizeOptional(code);
        String nName = normalizeOptional(name);
        String nCategory = normalizeOptional(category);
        String nSubcategory = normalizeOptional(subcategory);
        String nDeptName = normalizeOptional(deptName);

        // SQL수행 후 각 결과값 List로 저장
        List<CourseMasterSearchItem> items = courseMasterRepository.search(
                openedYear,
                term,
                nCode,
                nName,
                nCategory,
                nSubcategory,
                nDeptName
        );

        // items 배열로 감싸 반환
        return new CourseMasterSearchResponse(items);
    }

    // term 필수, trim 후 blank면 에러
    private String normalizeOptional(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isBlank() ? null : t;
    }

    // 선택 파라미터들은 blank면 null로 정리
    private String normalizeRequired(String v) {
        if (v == null) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        String t = v.trim();
        if (t.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return t;
    }
}