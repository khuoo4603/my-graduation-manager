package com.khuoo.gradmanager.profile.repository;

public interface ProfileRepository {

    // 사용자 기본정보(id, email, name, 학부, 학번 등 조회)
    ProfileBase findProfileBaseByUserId(Long userId);

    record ProfileBase(
            Long userId,
            String email,
            String userName,
            Long departmentId,
            String departmentName,
            Long templateId,
            String templateName,
            Integer applicableYear
    ) {}
}