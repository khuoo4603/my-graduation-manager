package com.khuoo.gradmanager.reference.course.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CourseMasterDao implements CourseMasterRepository {

    private final NamedParameterJdbcTemplate namedJdbcTemplate;

    // 강의목록 검색 SQL
    private static final String BASE_SELECT = """
            SELECT
                cm.course_master_id,
                cm.course_code,
                cm.course_name,
                cm.default_credits,
                cm.course_category,
                cm.course_subcategory,
                cm.seed_area,
                cm.opened_year,
                cm.opened_term,
                d.department_id AS opened_department_id,
                d.department_name AS opened_department_name
            FROM course_master cm
            JOIN course_master_department_access cmda
              ON cmda.course_master_id = cm.course_master_id
            JOIN department d
              ON d.department_id = cmda.department_id
            WHERE cm.opened_year = :year
              AND cm.opened_term = :term
            """;

    @Override
    public List<CourseMasterSearchRow> searchRows(
            int openedYear,
            String openedTerm,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    ) {
        StringBuilder sql = new StringBuilder(BASE_SELECT);

        // 기본 개설년도, 개설학기는 넣고 시작
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("year", openedYear)
                .addValue("term", openedTerm);

        // 선택 키워드가 있다면 SQL에 추가
        if (courseCode != null) {
            sql.append(" AND cm.course_code ILIKE :code ");
            params.addValue("code", "%" + courseCode + "%");
        }

        if (courseName != null) {
            sql.append(" AND cm.course_name ILIKE :name ");
            params.addValue("name", "%" + courseName + "%");
        }

        if (courseCategory != null) {
            sql.append(" AND cm.course_category = :category ");
            params.addValue("category", courseCategory);
        }

        if (courseSubcategory != null) {
            sql.append(" AND cm.course_subcategory = :subcategory ");
            params.addValue("subcategory", courseSubcategory);
        }

        if (departmentName != null) {
            sql.append(" AND d.department_name ILIKE :deptName ");
            params.addValue("deptName", "%" + departmentName + "%");
        }

        sql.append(" ORDER BY cm.course_code ASC");

        return namedJdbcTemplate.query(sql.toString(), params, new CourseMasterRowMapper());
    }
}