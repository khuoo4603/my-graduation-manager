package com.khuoo.gradmanager.reference.major.dto;

// 전공 row DTO
public record MajorItem(
        long id,
        String name,
        long departmentId
) {}