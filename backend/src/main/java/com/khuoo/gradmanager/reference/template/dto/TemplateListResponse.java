package com.khuoo.gradmanager.reference.template.dto;

import java.util.List;

// 학번 템플릿 목록 응답 DTO
public record TemplateListResponse(
        List<TemplateItem> templates
) { }