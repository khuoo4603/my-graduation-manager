package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class TemplateRepositoryDao implements TemplateRepository {

    private final JdbcTemplate jdbcTemplate;

    // 템플릿이 적용받고 있는 학부 조회
    @Override
    public Long findDepartmentIdByTemplateId(Long templateId) {
        String sql = "select department_id from graduation_template where template_id = ?";

        return jdbcTemplate.query(sql, rs -> rs.next() ? rs.getLong("department_id") : null, templateId);
    }
}