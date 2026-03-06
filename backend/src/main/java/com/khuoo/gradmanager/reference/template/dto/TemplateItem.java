package com.khuoo.gradmanager.reference.template.dto;

// 학번 템플릿 row DTO
public record TemplateItem(
        long id,
        String name,
        int year,
        long departmentId,
        boolean active
) {}