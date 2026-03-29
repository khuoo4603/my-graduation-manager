package com.khuoo.gradmanager.reference.course.service;

import com.khuoo.gradmanager.course.support.AcademicTermPolicy;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterOpenedDepartment;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchItem;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchResponse;
import com.khuoo.gradmanager.reference.course.repository.CourseMasterRepository;
import com.khuoo.gradmanager.reference.course.repository.CourseMasterSearchRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseMasterService {

    private final CourseMasterRepository courseMasterRepository;

    // 강의목록 조회 (개설년도, 개설학기 필수)
    public CourseMasterSearchResponse search(
            int openedYear,
            String openedTerm,
            String code,
            String name,
            String category,
            String subcategory,
            String deptName
    ) {
        // 개설 학기의 공백/누락 방지, 개설 년도 0이하 방지
        if (openedYear <= 0) { throw new ApiException(ErrorCode.INVALID_REQUEST); }
        String term = AcademicTermPolicy.normalize(openedTerm); // 기존 계절학기 문자열을 포함해 표준값으로 정규화

        String normalizedCode = (code == null || code.trim().isBlank()) ? null : code.trim(); // 과목코드 검색어, 공백이면 미입력 처리
        String normalizedName = (name == null || name.trim().isBlank()) ? null : name.trim(); // 과목명 검색어, 공백이면 미입력 처리
        String normalizedCategory = (category == null || category.trim().isBlank()) ? null : category.trim(); // 카테고리 필터, 공백이면 미입력 처리
        String normalizedSubcategory = (subcategory == null || subcategory.trim().isBlank()) ? null : subcategory.trim(); // 세부구분 필터, 공백이면 미입력 처리
        String normalizedDeptName = (deptName == null || deptName.trim().isBlank()) ? null : deptName.trim(); // 개설 학부명 검색어, 공백이면 미입력 처리

        // 파라미터가 blank면 null로 변환 후 실제 개설 과목 먼저 조회
        List<CourseMasterSearchRow> openedRows = courseMasterRepository.searchOpenedRows(
                openedYear,
                term,
                normalizedCode,
                normalizedName,
                normalizedCategory,
                normalizedSubcategory,
                normalizedDeptName
        );

        List<CourseMasterSearchRow> rows = openedRows;
        // 해당 년도/학기에 실제 개설 과목이 하나도 없을 때만 default fallback 허용
        if (rows.isEmpty()
                && ("1".equals(term) || "2".equals(term))
                && !courseMasterRepository.existsOpenedRows(openedYear, term)) {
            rows = courseMasterRepository.searchDefaultRows(
                    openedYear,
                    term,
                    normalizedCode,
                    normalizedName,
                    normalizedCategory,
                    normalizedSubcategory,
                    normalizedDeptName
            );
        }

        // course_master_id 기준으로 items를 누적 (과목 1개 = items 1개)
        Map<Long, CourseMasterSearchItemBuilder> map = new LinkedHashMap<>();
        for (CourseMasterSearchRow row : rows) {
            CourseMasterSearchItemBuilder item = map.get(row.courseMasterId());
            if (item == null) {
                // 처음 나온 course_master_id일 경우 map에 새로운 row객체를 생성하여 저장
                item = new CourseMasterSearchItemBuilder(
                        row.courseMasterId(),
                        row.courseCode(),
                        row.courseName(),
                        row.defaultCredits(),
                        row.courseCategory(),
                        row.courseSubcategory(),
                        row.seedArea(),
                        row.openedYear(),
                        row.openedTerm(),
                        row.isDefault(),
                        row.validFromYear(),
                        row.validToYear()
                );
                map.put(row.courseMasterId(), item);
            }

            // Department데이터가 있으면 item내부 departments리스트에 추가
            if (row.openedDepartmentId() != null) {
                item.departments.add(new CourseMasterOpenedDepartment(
                        row.openedDepartmentId(),
                        row.openedDepartmentName()
                ));
            }
        }

        // map 누적 결과를 최종 items로 변환
        List<CourseMasterSearchItem> items = new ArrayList<>(map.size());
        for (CourseMasterSearchItemBuilder builder : map.values()) {
            items.add(builder.build());
        }
        // 응답 순서를 기존처럼 과목 코드 기준으로 정렬
        items.sort(Comparator
                .comparing(CourseMasterSearchItem::courseCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparingLong(CourseMasterSearchItem::courseMasterId));

        return new CourseMasterSearchResponse(items);
    }
    // 반환할 item 저장용 클래스 (1개 과목 = 객체 1개)
    @RequiredArgsConstructor
    private static class CourseMasterSearchItemBuilder {
        private final long courseMasterId;
        private final String courseCode;
        private final String courseName;
        private final int defaultCredits;
        private final String courseCategory;
        private final String courseSubcategory;
        private final String seedArea;
        private final Integer openedYear;
        private final String openedTerm;
        private final boolean isDefault;
        private final Integer validFromYear;
        private final Integer validToYear;
        private final List<CourseMasterOpenedDepartment> departments = new ArrayList<>();

        // 누적된 department 목록을 포함해 최종 item 생성
        private CourseMasterSearchItem build() {
            return new CourseMasterSearchItem(
                    courseMasterId,
                    courseCode,
                    courseName,
                    defaultCredits,
                    courseCategory,
                    courseSubcategory,
                    seedArea,
                    openedYear,
                    openedTerm,
                    isDefault,
                    validFromYear,
                    validToYear,
                    departments
            );
        }
    }
}
