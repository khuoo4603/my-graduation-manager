package com.khuoo.gradmanager.micromajor.loadmodel;

// micro_major 조회 Row
public record MicroMajorRow(
        long microMajorId,            // 마이크로전공 PK
        String microMajorName,        // 마이크로전공명
        String microMajorCategory,    // 마이크로전공 유형(교양 / 전공 / 융합)
        String operatingUnitNames,    // 운영 주체명
        int requiredCourseCount,      // 전체 필요 과목 수
        int requiredCredits,          // 전체 필요 학점
        int validFromYear,            // 기본 적용 시작 연도
        String validFromTerm          // 기본 적용 시작 학기
) {}
