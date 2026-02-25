package com.khuoo.gradmanager.reference.course.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterOpenedDepartment;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchItem;
import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchResponse;
import com.khuoo.gradmanager.reference.course.repository.CourseMasterSearchRow;
import com.khuoo.gradmanager.reference.course.repository.CourseMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
        if (openedTerm == null || openedYear <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        String term = openedTerm.trim();
        if (term.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }


        // 파라미터가 blank면 null로 변환
        List<CourseMasterSearchRow> rows = courseMasterRepository.searchRows(
                openedYear,
                term,
                normalizeOptional(code),
                normalizeOptional(name),
                normalizeOptional(category),
                normalizeOptional(subcategory),
                normalizeOptional(deptName)
        );

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
                        row.openedTerm()
                );
                map.put(row.courseMasterId(), item);
            }

            // Department데이터를 item내부 departments리스트에 추가
            item.departments.add(new CourseMasterOpenedDepartment(
                    row.openedDepartmentId(),
                    row.openedDepartmentName()
            ));
        }

        // map 누적 결과를 최종 items로 변환
        List<CourseMasterSearchItem> items = new ArrayList<>(map.size());
        for (CourseMasterSearchItemBuilder b : map.values()) {
            items.add(b.build());
        }

        return new CourseMasterSearchResponse(items);
    }

    // trim 후 blank면 null 처리
    private String normalizeOptional(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isBlank() ? null : t;
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
        private final int openedYear;
        private final String openedTerm;

        private final List<CourseMasterOpenedDepartment> departments = new ArrayList<>();

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
                    departments
            );
        }
    }
}