package com.khuoo.gradmanager.reference.course.dto;

import java.util.List;

// course_master 검색 결과 단일 항목 DTO(학부 리스트 포함).
public record CourseMasterSearchItem(
        long courseMasterId,        // 과목 마스터 ID
        String courseCode,          // 과목 코드
        String courseName,          // 과목명
        int defaultCredits,         // 학점
        String courseCategory,      // 전공/교양
        String courseSubcategory,   // 세부 카테고리(전공필수, 전공탐색, SEED, 채플 등)
        String seedArea,            // SEED과목 귀속 항목
        Integer openedYear,         // 개설연도, default 과목이면 NULL 가능
        String openedTerm,          // 개설학기, default 과목이면 NULL 가능
        boolean isDefault,          // default 과목 여부
        Integer validFromYear,      // default 과목 적용 시작연도
        Integer validToYear,        // default 과목 적용 종료연도
        List<CourseMasterOpenedDepartment> openedDepartments // 귀속 학부 목록
) {}