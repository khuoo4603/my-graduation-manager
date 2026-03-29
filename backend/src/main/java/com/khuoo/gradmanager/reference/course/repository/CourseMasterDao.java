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
                cm.is_default,
                cm.valid_from_year,
                cm.valid_to_year,
                cm.opened_year,
                cm.opened_term,
                d.department_id AS opened_department_id,
                d.department_name AS opened_department_name
            FROM course_master cm
            LEFT JOIN course_master_department_access cmda
              ON cmda.course_master_id = cm.course_master_id
            LEFT JOIN department d
              ON d.department_id = cmda.department_id
            WHERE 1 = 1
            """;

    // 사용자가 검색한 년도/학기에 오픈한 과목 검색
    @Override
    public List<CourseMasterSearchRow> searchOpenedRows(
            int openedYear,
            String openedTerm,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    ) {
        // 실제 개설 과목만 검색
        StringBuilder sql = new StringBuilder(BASE_SELECT)
                .append(" AND cm.is_default = FALSE ")
                .append(" AND cm.opened_year = :year ")
                .append(" AND cm.opened_term = :term ");

        // 기본 개설년도, 개설학기를 넣고 시작
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("year", openedYear)
                .addValue("term", openedTerm);

        appendFilters(sql, params, courseCode, courseName, courseCategory, courseSubcategory, departmentName);
        sql.append(" ORDER BY cm.course_code ASC, cm.course_master_id ASC");

        return namedJdbcTemplate.query(sql.toString(), params, new CourseMasterRowMapper());
    }

    // 요청한 개설년도/학기에 실제 개설 과목 존재 여부 확인
    @Override
    public boolean existsOpenedRows(int openedYear, String openedTerm) {
        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM course_master cm
                    WHERE cm.is_default = FALSE
                      AND cm.opened_year = :year
                      AND cm.opened_term = :term
                )
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("year", openedYear)
                .addValue("term", openedTerm);

        return Boolean.TRUE.equals(
                namedJdbcTemplate.queryForObject(sql, params, Boolean.class)
        );
    }

    // 디폴트 과목 검색
    @Override
    public List<CourseMasterSearchRow> searchDefaultRows(
            int openedYear,
            String openedTerm,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    ) {

        // 요청 연도에 fallback 가능한 default 과목만 검색
        StringBuilder sql = new StringBuilder(BASE_SELECT)
                .append(" AND cm.is_default = TRUE ")
                .append(" AND (cm.valid_from_year IS NULL OR cm.valid_from_year <= :year) ")
                .append(" AND (cm.valid_to_year IS NULL OR cm.valid_to_year >= :year) ");
        // valid year 범위 비교를 위해 요청 연도를 넣고 시작
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("year", openedYear);

        appendFilters(sql, params, courseCode, courseName, courseCategory, courseSubcategory, departmentName);
        sql.append(" ORDER BY cm.course_code ASC, cm.course_master_id ASC");

        return namedJdbcTemplate.query(sql.toString(), params, new CourseMasterRowMapper());
    }

    private void appendFilters(
            StringBuilder sql,
            MapSqlParameterSource params,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    ) {
        // 선택 키워드가 있다면 SQL에 추가
        if (courseCode != null) {
            sql.append(" AND cm.course_code ILIKE :code ");
            params.addValue("code", "%" + courseCode + "%"); // 부분 일치 검색
        }

        if (courseName != null) {
            sql.append(" AND cm.course_name ILIKE :name ");
            params.addValue("name", "%" + courseName + "%"); // 부분 일치 검색
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
            params.addValue("deptName", "%" + departmentName + "%"); // 부분 일치 검색
        }
    }
}
