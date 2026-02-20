package com.khuoo.gradmanager.profile.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateTemplateRequest {

    // templateId는 null 불가능, 음수/0 불가능 (추가 update 기준)
    @NotNull(message = "templateId is required")
    @Positive(message = "templateId must be positive")
    private Long templateId;
}