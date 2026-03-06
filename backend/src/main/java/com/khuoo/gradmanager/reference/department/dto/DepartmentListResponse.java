package com.khuoo.gradmanager.reference.department.dto;

import java.util.List;

// 학부 응답 DTO
public record DepartmentListResponse(
        List<DepartmentItem> departments
) {}