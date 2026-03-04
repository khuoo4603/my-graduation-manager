package com.khuoo.gradmanager.profile.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;


public record UpdateDepartmentRequest(
        // departmentId는 null 불가능, 음수/0 불가능
        @NotNull(message = "departmentId is required")
        @Positive(message = "departmentId must be positive")
        Long departmentId
) {}