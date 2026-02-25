package com.khuoo.gradmanager.reference.course.repository;

import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class CourseMasterRowMapper implements RowMapper<CourseMasterSearchRow> {

    @Override
    public CourseMasterSearchRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new CourseMasterSearchRow(
                rs.getLong("course_master_id"),
                rs.getString("course_code"),
                rs.getString("course_name"),
                rs.getInt("default_credits"),
                rs.getString("course_category"),
                rs.getString("course_subcategory"),
                rs.getString("seed_area"),
                rs.getInt("opened_year"),
                rs.getString("opened_term"),
                rs.getLong("opened_department_id"),
                rs.getString("opened_department_name")
        );
    }
}