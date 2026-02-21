package com.khuoo.gradmanager.reference.course.repository;

import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchItem;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

// course_master 검색 RowMapper
public class CourseMasterRowMapper implements RowMapper<CourseMasterSearchItem> {

    @Override
    public CourseMasterSearchItem mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new CourseMasterSearchItem(
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
                rs.getString("department_name")
        );
    }
}