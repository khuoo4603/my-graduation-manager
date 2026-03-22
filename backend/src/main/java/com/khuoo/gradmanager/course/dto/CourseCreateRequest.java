package com.khuoo.gradmanager.course.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// 수강 내역 등록 요청
@JsonIgnoreProperties(ignoreUnknown = true)
public record CourseCreateRequest(
        long courseMasterId,
        Integer takenYear,
        String takenTerm,
        Long majorId,
        Long retakeCourseId
) {}