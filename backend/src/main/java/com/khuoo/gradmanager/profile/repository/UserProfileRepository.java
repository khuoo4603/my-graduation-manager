package com.khuoo.gradmanager.profile.repository;

public interface UserProfileRepository {

    // 유저가 어떤 학부 소속인지 확인
    Long findDepartmentIdByUserId(Long userId);

    // user의 템플릿 update
    int updateTemplateId(Long userId, Long templateId);
}