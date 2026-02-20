package com.khuoo.gradmanager.profile.repository;

public interface TemplateRepository {

    // 템플릿이 적용받고 있는 학부 조회
    Long findDepartmentIdByTemplateId(Long templateId);

}