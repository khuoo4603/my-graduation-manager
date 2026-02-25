package com.khuoo.gradmanager.reference.course.dto;

// course_master 검색 결과의 학부 접근 정보 DTO.
public record CourseMasterOpenedDepartment(
        long openedDepartmentId,
        String openedDepartmentName
) {
}