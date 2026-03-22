package com.khuoo.gradmanager.reference.course.repository;

// Dto Select 결과 (1개 row 저장)
public record CourseMasterSearchRow(
        long courseMasterId,      // 과목 마스터 ID
        String courseCode,        // 과목 코드
        String courseName,        // 과목명
        int defaultCredits,       // 기본 학점
        String courseCategory,    // 과목 카테고리
        String courseSubcategory, // 과목 세부 구분
        String seedArea,          // SEED 영역 / NULL 가능
        boolean isDefault,        // default 과목 여부
        Integer validFromYear,    // default 과목 적용 시작 연도 / NULL 가능
        Integer validToYear,      // default 과목 적용 종료 연도 / NULL 가능
        Integer openedYear,       // 실제 개설 연도 / default 과목이면 NULL 가능
        String openedTerm,        // 실제 개설 학기 / default 과목이면 NULL 가능
        Long openedDepartmentId,  // 개설 학부 ID / NULL 가능
        String openedDepartmentName // 개설 학부명 / NULL 가능
) {}