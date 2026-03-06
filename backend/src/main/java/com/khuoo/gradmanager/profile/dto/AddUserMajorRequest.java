package com.khuoo.gradmanager.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// 전공 추가 요청 DTO
public record AddUserMajorRequest(
        @NotNull
        Long majorId,

        @NotBlank
        String majorType
) {}