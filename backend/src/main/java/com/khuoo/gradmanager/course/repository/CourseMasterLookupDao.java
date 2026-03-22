package com.khuoo.gradmanager.course.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// 수강 내역 등록 시 전공/교양 확인용 Dao
@Repository
@RequiredArgsConstructor
public class CourseMasterLookupDao {

    private final JdbcTemplate jdbcTemplate;

    // course_master의 과목 존재여부, courseCode/category/subcategory분류를 위한 값 찾기
    public Optional<CourseMasterSnapshot> findSnapshotById(long courseMasterId) {

        String sql = """
                SELECT
                    course_code,
                    default_credits,
                    course_category,
                    course_subcategory
                FROM course_master
                WHERE course_master_id = ?
                """;

        return jdbcTemplate.query(
                        sql,
                        (rs, rowNum) -> new CourseMasterSnapshot(
                                rs.getString("course_code"),
                                rs.getInt("default_credits"),
                                rs.getString("course_category"),
                                rs.getString("course_subcategory")
                        ),
                        courseMasterId
                )
                .stream()
                .findFirst(); // 없는 과목이면 Optional.empty() 반환
    }

    // 전공탐색 과목 등록 시 접근 가능한 학부 목록 조회
    public List<Long> findAccessibleDepartmentIdsByCourseMasterId(long courseMasterId) {

        String sql = """
                SELECT department_id
                FROM course_master_department_access
                WHERE course_master_id = ?
                ORDER BY department_id DESC
                """;

        return jdbcTemplate.queryForList(sql, Long.class, courseMasterId);
    }

    public record CourseMasterSnapshot(
            String courseCode,
            int defaultCredits,
            String courseCategory,
            String courseSubcategory
    ) {}
}