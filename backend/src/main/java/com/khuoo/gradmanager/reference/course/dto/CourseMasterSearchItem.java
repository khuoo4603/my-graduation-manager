package com.khuoo.gradmanager.reference.course.dto;


// course_master 검색 결과 단일 항목 DTO.
public record CourseMasterSearchItem(
        long courseMasterId,
        String courseCode,
        String courseName,
        int defaultCredits,
        String courseCategory,
        String courseSubcategory,
        String seedArea,
        int openedYear,
        String openedTerm,
        long openedDepartmentId,
        String openedDepartmentName
) {
}