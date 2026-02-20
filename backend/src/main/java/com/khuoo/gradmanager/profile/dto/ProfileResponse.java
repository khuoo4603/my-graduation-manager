package com.khuoo.gradmanager.profile.dto;

import java.util.List;

/**
 * @param user       사용자 기본 정보
 * @param department 소속 학부
 * @param template   적용 템플릿 (nullable)
 * @param majors     전공 목록
 */
public record ProfileResponse(
        UserDto user,
        DepartmentDto department,
        TemplateDto template,
        List<MajorDto> majors
) {
    // 사용자 DTO
    public record UserDto(
            Long id,
            String email,
            String name
    ) {}

    // 학부 DTO
    public record DepartmentDto(
            Long id,
            String name
    ) {}

    // 템플릿 DTO
    public record TemplateDto(
            Long id,
            String name,
            Integer applicableYear
    ) {}

    // 전공 DTO
    public record MajorDto(
            Long id,
            String name,
            String majorType
    ) {}
}