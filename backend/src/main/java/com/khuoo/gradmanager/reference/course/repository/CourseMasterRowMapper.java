package com.khuoo.gradmanager.reference.course.repository;

import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class CourseMasterRowMapper implements RowMapper<CourseMasterSearchRow> {

    // course_master 검색 조인 결과 한 행을 DTO row로 변환
    @Override
    public CourseMasterSearchRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        // default 메타데이터와 개설 정보까지 함께 매핑
        return new CourseMasterSearchRow(
                rs.getLong("course_master_id"),
                rs.getString("course_code"),
                rs.getString("course_name"),
                rs.getInt("default_credits"),
                rs.getString("course_category"),
                rs.getString("course_subcategory"),
                rs.getString("seed_area"),
                rs.getBoolean("is_default"),
                rs.getObject("valid_from_year", Integer.class),
                rs.getObject("valid_to_year", Integer.class),
                rs.getObject("opened_year", Integer.class),
                rs.getString("opened_term"),
                rs.getObject("opened_department_id", Long.class),
                rs.getString("opened_department_name")
        );
    }
}