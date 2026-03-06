package com.khuoo.gradmanager.reference.major.dto;

import java.util.List;

// 전공 목록 응답 DTO
public record MajorListResponse(
        List<MajorItem> majors
) {}