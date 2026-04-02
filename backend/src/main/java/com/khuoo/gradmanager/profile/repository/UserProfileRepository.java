package com.khuoo.gradmanager.profile.repository;

public interface UserProfileRepository {
    // user의 이름 update
    int updateUserName(Long userId, String userName);

    // user의 템플릿 update
    int updateTemplateId(Long userId, Long templateId);

    // user의 학부 update
    int updateDepartmentId(Long userId, Long departmentId);
}