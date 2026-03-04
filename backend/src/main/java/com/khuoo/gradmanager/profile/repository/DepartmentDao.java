package com.khuoo.gradmanager.profile.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DepartmentDao implements DepartmentRepository {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean existsByDepartmentId(Long departmentId) {
        String sql = "select exists(select 1 from department where department_id = ?)";

        return jdbcTemplate.queryForObject(sql, Boolean.class, departmentId);
    }
}