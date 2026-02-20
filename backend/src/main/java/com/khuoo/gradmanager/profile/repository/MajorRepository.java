package com.khuoo.gradmanager.profile.repository;

import java.util.List;

public interface MajorRepository {

    // 특정 사용자(user_id)의 전공 목록 조회
    List<UserMajorRow> findMajorsByUserId(Long userId);

    record UserMajorRow(
            Long majorId,
            String majorName,
            String majorType
    ) {}
}