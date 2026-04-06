package com.khuoo.gradmanager.micromajor.loadmodel;

// micro_major_requirement_course 조회 Row
public record RequirementCourseRow(
        long requirementCourseId,       // 인정 과목 행 PK
        long requirementGroupId,        // 소속 요구 그룹 PK
        String recognizedCourseCode,    // 인정 과목 코드(NULL 가능)
        String recognizedCourseName,    // 인정 과목명
        String requirementSlotKey,      // 동일 슬롯 묶음 키
        int displayOrder,               // 슬롯 내 대표 과목 표시 순서
        Integer validFromYearOverride,  // 과목별 적용 시작 연도 override / NULL 가능
        String validFromTermOverride    // 과목별 적용 시작 학기 override / NULL 가능
) {}
