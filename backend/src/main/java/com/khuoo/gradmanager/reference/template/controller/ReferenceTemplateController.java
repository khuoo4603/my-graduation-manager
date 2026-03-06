package com.khuoo.gradmanager.reference.template.controller;

import com.khuoo.gradmanager.reference.template.dto.TemplateListResponse;
import com.khuoo.gradmanager.reference.template.service.ReferenceTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reference")
public class ReferenceTemplateController {
    private final ReferenceTemplateService referenceTemplateService;

    // 학번 템플릿 목록 조회, departmentId 선택 -> 특정 학부 조회
    @GetMapping("/templates")
    public TemplateListResponse getTemplates(@RequestParam(required = false) Long departmentId) {
        return referenceTemplateService.getTemplates(departmentId);
    }
}