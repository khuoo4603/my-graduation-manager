package com.khuoo.gradmanager.course.dto;

// 수강 내역 조회 (항목단일)
public record CourseItem(
        long courseId,
        long courseMasterId,
        String courseCode,
        String courseName,
        int earnedCredits,
        String grade,
        int takenYear,
        String takenTerm,
        Long majorId,
        String courseCategory,
        String courseSubcategory,
        String seedArea
) {
}