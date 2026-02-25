package com.khuoo.gradmanager.course.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// 수강 내역 등록 시 전공/교양 확인용 Dao
@Repository
@RequiredArgsConstructor
public class CourseMasterLookupDao {

    private final JdbcTemplate jdbcTemplate;

    // course_master의 과목 존재여부, category/subcategory분류를 위한 값 찾기
    public Optional<CourseMasterSnapshot> findSnapshotById(long courseMasterId) {

        String sql = """
                SELECT
                    course_category,
                    course_subcategory
                FROM course_master
                WHERE course_master_id = ?
                """;

        return jdbcTemplate.query(
                        sql,
                        (rs, rowNum) -> new CourseMasterSnapshot(
                                rs.getString("course_category"),
                                rs.getString("course_subcategory")
                        ),
                        courseMasterId
                )
                .stream()
                .findFirst(); // 없는 과목이면 Optional.empty() 반환
    }

    public record CourseMasterSnapshot(
            String courseCategory,
            String courseSubcategory
    ) {}
}