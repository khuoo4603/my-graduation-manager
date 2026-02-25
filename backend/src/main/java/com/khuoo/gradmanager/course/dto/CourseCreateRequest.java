package com.khuoo.gradmanager.course.dto;

// 수강 내역 등록 요청
public record CourseCreateRequest(
        long courseMasterId,
        Integer earnedCredits,
        String grade,
        Integer takenYear,
        String takenTerm,
        Long majorId,
        Long attributedDepartmentId
) {
}