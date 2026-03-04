package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserProfileDao implements UserProfileRepository {

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

    // user의 학부 update (+ 학부 변경 시 template_id는 null로 초기화)
    @Override
    public int updateDepartmentId(Long userId, Long departmentId) {
        // 기존 학부와 템플릿이 꼬일 수 있어 초기화
        String sql = "update users set department_id = ?, template_id = null, updated_at = now() where user_id = ?";

        return jdbcTemplate.update(sql, departmentId, userId);
    }
}