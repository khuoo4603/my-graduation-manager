package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserProfileRepositoryDao implements UserProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    // 유저가 어떤 학부 소속인지 확인
    @Override
    public Long findDepartmentIdByUserId(Long userId) {
        String sql = "select department_id from users where user_id = ?";

        return jdbcTemplate.query(sql, rs -> rs.next() ? rs.getLong("department_id") : null, userId);
    }

    // user의 템플릿 update
    @Override
    public int updateTemplateId(Long userId, Long templateId) {
        String sql = "update users set template_id = ?, updated_at = now() where user_id = ?";

        return jdbcTemplate.update(sql, templateId, userId);
    }
}