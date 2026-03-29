package com.khuoo.gradmanager.course.repository;

import com.khuoo.gradmanager.course.dto.CourseItem;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class CourseRowMapper implements RowMapper<CourseItem> {

    // CourseItem으로 변환
    @Override
    public CourseItem mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new CourseItem(
                rs.getLong("course_id"),
                rs.getObject("course_master_id", Long.class),
                rs.getString("course_code_snapshot"),
                rs.getString("course_name_snapshot"),
                rs.getInt("earned_credits"),
                rs.getString("grade"),
                rs.getInt("taken_year"),
                rs.getString("taken_term"),
                rs.getString("course_category"),
                rs.getString("course_subcategory"),
                rs.getString("seed_area"),
                rs.getObject("department_id", Long.class),
                rs.getString("department_name"),
                rs.getObject("major_id", Long.class),
                rs.getString("major_name"),
                rs.getObject("retake_course_id", Long.class),
                rs.getTimestamp("updated_at").toInstant()
        );
    }
}