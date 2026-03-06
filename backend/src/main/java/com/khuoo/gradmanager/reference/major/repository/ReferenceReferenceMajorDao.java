package com.khuoo.gradmanager.reference.major.repository;

import com.khuoo.gradmanager.reference.major.dto.MajorItem;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
@RequiredArgsConstructor
public class ReferenceReferenceMajorDao implements MajorRepository {
    private final JdbcTemplate jdbcTemplate;

    // 전체 전공 목록 조회
    @Override
    public List<MajorItem> findAll() {
        String sql = """
                SELECT major_id, major_name, department_id
                FROM major
                ORDER BY major_name ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new MajorItem(
                        rs.getLong("major_id"),
                        rs.getString("major_name"),
                        rs.getLong("department_id")
                )
        );
    }

    // 특정 학부 전공 목록 조회
    @Override
    public List<MajorItem> findByDepartmentId(long departmentId) {
        String sql = """
                SELECT major_id, major_name, department_id
                FROM major
                WHERE department_id = ?
                ORDER BY major_name ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new MajorItem(
                        rs.getLong("major_id"),
                        rs.getString("major_name"),
                        rs.getLong("department_id")
                ),
                departmentId
        );
    }

    // 전공 존재 여부를 확인한다.
    @Override
    public boolean existsById(long majorId) {
        String sql = """
                SELECT COUNT(*)
                FROM major
                WHERE major_id = ?
                """;

        // count 결과를 조회한다.
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, majorId);

        // 1건 이상이면 true로 판단한다.
        return count != null && count > 0;
    }
}