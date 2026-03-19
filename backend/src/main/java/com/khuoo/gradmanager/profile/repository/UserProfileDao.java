package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserProfileDao implements UserProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    // user의 템플릿 update
    @Override
    public int updateTemplateId(Long userId, Long templateId) {
        String sql = "update users set template_id = ?, updated_at = now() where user_id = ?";

        return jdbcTemplate.update(sql, templateId, userId);
    }

    // user의 학부 update
    @Override
    public int updateDepartmentId(Long userId, Long departmentId) {
        String sql = "update users set department_id = ?, updated_at = now() where user_id = ?";

        return jdbcTemplate.update(sql, departmentId, userId);
    }
}
