package com.khuoo.gradmanager.reference.department.repository;

import com.khuoo.gradmanager.reference.department.dto.DepartmentItem;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
@RequiredArgsConstructor
public class ReferenceDepartmentDao implements ReferenceDepartmentRepository {
    private final JdbcTemplate jdbcTemplate;

    // 전체 학부 목록 조회
    @Override
    public List<DepartmentItem> findAll() {
        String sql = """
                SELECT department_id, department_name
                FROM department
                ORDER BY department_name ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new DepartmentItem(
                        rs.getLong("department_id"),
                        rs.getString("department_name")
                )
        );
    }

    // 학부 존재 여부 확인
    @Override
    public boolean existsById(long departmentId) {
        String sql = """
                SELECT COUNT(*)
                FROM department
                WHERE department_id = ?
                """;

        // count 결과를 조회
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, departmentId);

        // 1건 이상이면 true
        return count != null && count > 0;
    }
}