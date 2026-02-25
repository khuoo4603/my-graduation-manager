package com.khuoo.gradmanager.reference.course.repository;

// Ddo Select 결과 (1개 row 저장)
public record CourseMasterSearchRow(
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