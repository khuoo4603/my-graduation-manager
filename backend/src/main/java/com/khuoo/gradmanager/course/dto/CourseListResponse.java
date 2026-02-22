package com.khuoo.gradmanager.course.dto;

import java.util.List;

// 수강 내역 조회 응답
public record CourseListResponse(
        List<CourseItem> items
) { }