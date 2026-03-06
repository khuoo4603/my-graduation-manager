package com.khuoo.gradmanager.reference.template.repository;

import com.khuoo.gradmanager.reference.template.dto.TemplateItem;

import java.util.List;


public interface ReferenceTemplateRepository {

    // 전체 템플릿 조회
    List<TemplateItem> findAll();

    // 특정 템플릿 조회
    List<TemplateItem> findByDepartmentId(long departmentId);
}