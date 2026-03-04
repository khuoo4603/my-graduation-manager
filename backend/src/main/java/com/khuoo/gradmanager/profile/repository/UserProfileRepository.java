package com.khuoo.gradmanager.profile.repository;

public interface UserProfileRepository {

    // 유저가 어떤 학부 소속인지 확인
    Long findDepartmentIdByUserId(Long userId);

    // user의 템플릿 update
    int updateTemplateId(Long userId, Long templateId);

    // user의 학부 update (+ 학부 변경 시 template_id는 null로 초기화)
    int updateDepartmentId(Long userId, Long departmentId);
}