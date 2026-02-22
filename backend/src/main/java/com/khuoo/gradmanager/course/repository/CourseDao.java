package com.khuoo.gradmanager.course.repository;

import com.khuoo.gradmanager.course.dto.CourseItem;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CourseDao implements CourseRepository {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public long insert(
            long userId,
            long courseMasterId,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            Long majorId
    ) {
        String sql = """
                INSERT INTO course(
                    user_id,
                    course_master_id,
                    major_id,
                    earned_credits,
                    grade,
                    taken_year,
                    taken_term
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING course_id
                """;

        Long courseId = jdbcTemplate.queryForObject(
                sql,
                Long.class,
                userId,
                courseMasterId,
                majorId,
                earnedCredits,
                grade,
                takenYear,
                takenTerm
        );

        // 생성된 PK가 없으면 비정상으로 처리
        if (courseId == null) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR);
        }

        return courseId;
    }

    // course + course_master 조인 기반 기본 조회 쿼리
    private static final String BASE_SELECT = """
            SELECT
                c.course_id,
                c.course_master_id,
                c.major_id,
                c.earned_credits,
                c.grade,
                c.taken_year,
                c.taken_term,
                cm.course_code,
                cm.course_name,
                cm.course_category,
                cm.course_subcategory,
                cm.seed_area
            FROM course c
            JOIN course_master cm ON cm.course_master_id = c.course_master_id
            WHERE c.user_id = ?
            """;

    // 사용자 수강 내역 조회(전체)
    @Override
    public List<CourseItem> findAllByUser(long userId) {
        String sql = BASE_SELECT + " ORDER BY c.course_id DESC ";
        return jdbcTemplate.query(sql, new CourseRowMapper(), userId);
    }

    // 사용자 수강 내역 조회(특정 년도/학기)
    @Override
    public List<CourseItem> findByUserAndTerm(long userId, int year, String term) {
        String sql = BASE_SELECT
                + " AND c.taken_year = ? AND c.taken_term = ? "
                + " ORDER BY c.course_id DESC ";
        return jdbcTemplate.query(sql, new CourseRowMapper(), userId, year, term);
    }

    // 수강 내역 삭제
    @Override
    public int deleteByIdAndUser(long courseId, long userId) {
        String sql = """
                DELETE FROM course
                WHERE course_id = ?
                  AND user_id = ?
                """;
        return jdbcTemplate.update(sql, courseId, userId);
    }
}