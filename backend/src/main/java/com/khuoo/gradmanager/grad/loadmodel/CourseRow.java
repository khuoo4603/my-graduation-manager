package com.khuoo.gradmanager.grad.loadmodel;

// course 테이블 조회 Row
public record CourseRow(
        long courseId,
        Long courseMasterId,
        String courseCodeSnapshot,
        String courseNameSnapshot,
        String courseCategory,
        String courseSubcategory,
        String seedArea,
        int earnedCredits,
        String grade,
        int takenYear,
        String takenTerm,
        Long retakeCourseId,
        String recognitionType,
        Long majorId,
        Long attributedDepartmentId
) {}