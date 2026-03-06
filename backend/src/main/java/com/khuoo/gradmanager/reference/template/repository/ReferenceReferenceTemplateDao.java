package com.khuoo.gradmanager.reference.template.repository;

import com.khuoo.gradmanager.reference.template.dto.TemplateItem;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
@RequiredArgsConstructor
public class ReferenceReferenceTemplateDao implements ReferenceTemplateRepository {
    private final JdbcTemplate jdbcTemplate;

    // 전체 템플릿 조회
    @Override
    public List<TemplateItem> findAll() {
        String sql = """
                SELECT template_id, template_name, applicable_year, department_id, active
                FROM graduation_template
                ORDER BY applicable_year DESC, template_name ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new TemplateItem(
                        rs.getLong("template_id"),
                        rs.getString("template_name"),
                        rs.getInt("applicable_year"),
                        rs.getLong("department_id"),
                        rs.getBoolean("active")
                )
        );
    }

    // 특정 템플릿 조회
    @Override
    public List<TemplateItem> findByDepartmentId(long departmentId) {
        String sql = """
                SELECT template_id, template_name, applicable_year, department_id, active
                FROM graduation_template
                WHERE department_id = ?
                ORDER BY applicable_year DESC, template_name ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new TemplateItem(
                        rs.getLong("template_id"),
                        rs.getString("template_name"),
                        rs.getInt("applicable_year"),
                        rs.getLong("department_id"),
                        rs.getBoolean("active")
                ),
                departmentId
        );
    }
}