package com.khuoo.gradmanager.reference.course.dto;

import java.util.List;

// course_master 검색 응답 DTO(리스트 래핑).
public record CourseMasterSearchResponse(
        List<CourseMasterSearchItem> items
) { }