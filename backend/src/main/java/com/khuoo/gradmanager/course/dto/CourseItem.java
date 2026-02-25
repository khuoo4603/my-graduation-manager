package com.khuoo.gradmanager.course.dto;

// 수강 내역 조회 (항목단일 1개 row)
public record CourseItem(
        long courseId,
        long courseMasterId,
        String courseCode,
        String courseName,
        int earnedCredits,
        String grade,
        int takenYear,
        String takenTerm,
        String courseCategory,
        String courseSubcategory,
        String seedArea,
        Long departmentId,
        String departmentName,
        Long majorId,
        String majorName
) {
}