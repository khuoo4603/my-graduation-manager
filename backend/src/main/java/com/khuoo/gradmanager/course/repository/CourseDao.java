package com.khuoo.gradmanager.course.repository;

import com.khuoo.gradmanager.course.dto.CourseItem;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CourseDao implements CourseRepository {

    private final JdbcTemplate jdbcTemplate;

    // 수강 내역 등록
    @Override
    public long insert(
            long userId,
            long courseMasterId,
            String courseCodeSnapshot,
            String courseNameSnapshot,
            String courseCategory,
            String courseSubcategory,
            String seedArea,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId,
            Long retakeCourseId
    ) {
        String sql = """
            INSERT INTO course(
                user_id,
                course_master_id,
                course_code_snapshot,
                course_name_snapshot,
                course_category,
                course_subcategory,
                seed_area,
                recognition_type,
                major_id,
                attributed_department_id,
                earned_credits,
                grade,
                taken_year,
                taken_term,
                retake_course_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING course_id
            """;

        // 단일 행 INSERT 후 생성된 PK(course_id) 반환
        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                userId,
                courseMasterId,
                courseCodeSnapshot,
                courseNameSnapshot,
                courseCategory,
                courseSubcategory,
                seedArea,
                recognitionType,
                majorId,
                attributedDepartmentId,
                earnedCredits,
                grade,
                takenYear,
                takenTerm,
                retakeCourseId
        );
    }

    // 수강 내역 수정
    @Override
    public int update(
            long courseId,
            long userId,
            String courseSubcategory,
            String seedArea,
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            Long retakeCourseId
    ) {
        String sql = """
                UPDATE course
                SET course_subcategory = ?,
                    seed_area = ?,
                    recognition_type = ?,
                    major_id = ?,
                    attributed_department_id = ?,
                    earned_credits = ?,
                    grade = ?,
                    taken_year = ?,
                    taken_term = ?,
                    retake_course_id = ?,
                    updated_at = NOW()
                WHERE course_id = ?
                  AND user_id = ?
                """;

        return jdbcTemplate.update(
                sql,
                courseSubcategory,
                seedArea,
                recognitionType,
                majorId,
                attributedDepartmentId,
                earnedCredits,
                grade,
                takenYear,
                takenTerm,
                retakeCourseId,
                courseId,
                userId
        );
    }

    // course + major + department 조인 쿼리
    private static final String BASE_SELECT = """
        SELECT
            c.course_id,
            c.course_master_id,
            c.major_id,
            m.major_name,
            c.attributed_department_id AS department_id,
            d.department_name,
            c.earned_credits,
            c.grade,
            c.taken_year,
            c.taken_term,
            c.retake_course_id,
            c.updated_at,
            c.course_code_snapshot,
            c.course_name_snapshot,
            c.course_category,
            c.course_subcategory,
            c.seed_area
        FROM course c
        LEFT JOIN major m ON m.major_id = c.major_id
        LEFT JOIN department d ON d.department_id = c.attributed_department_id
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

    // 등록/수정 검증용 수강 내역 단건 조회
    @Override
    public Optional<CourseWriteRow> findWriteRowById(long courseId) {
        String sql = """
                SELECT
                    c.course_id,
                    c.user_id,
                    c.course_master_id,
                    c.earned_credits,
                    c.grade,
                    c.taken_year,
                    c.taken_term,
                    c.major_id,
                    c.attributed_department_id,
                    c.retake_course_id,
                    c.course_code_snapshot,
                    c.course_name_snapshot,
                    c.course_category,
                    c.course_subcategory,
                    c.seed_area
                FROM course c
                WHERE c.course_id = ?
                """;

        return jdbcTemplate.query(
                        sql,
                        (rs, rowNum) -> new CourseWriteRow(
                                rs.getLong("course_id"),
                                rs.getLong("user_id"),
                                rs.getObject("course_master_id", Long.class),
                                rs.getObject("earned_credits", Integer.class),
                                rs.getString("grade"),
                                rs.getObject("taken_year", Integer.class),
                                rs.getString("taken_term"),
                                rs.getObject("major_id", Long.class),
                                rs.getObject("attributed_department_id", Long.class),
                                rs.getObject("retake_course_id", Long.class),
                                rs.getString("course_code_snapshot"),
                                rs.getString("course_name_snapshot"),
                                rs.getString("course_category"),
                                rs.getString("course_subcategory"),
                                rs.getString("seed_area")
                        ),
                        courseId
                )
                .stream()
                .findFirst();
    }

    // 동일 사용자/과목/연도/학기 중복 여부 확인
    @Override
    public boolean existsDuplicate(long userId, long courseMasterId, int takenYear, String takenTerm, Long excludeCourseId) {
        if (excludeCourseId == null) {
            String sql = """
                    SELECT EXISTS (
                        SELECT 1
                        FROM course
                        WHERE user_id = ?
                          AND course_master_id = ?
                          AND taken_year = ?
                          AND taken_term = ?
                    )
                    """;

            return jdbcTemplate.queryForObject(
                    sql,
                    Boolean.class,
                    userId,
                    courseMasterId,
                    takenYear,
                    takenTerm
            );
        }

        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM course
                    WHERE user_id = ?
                      AND course_master_id = ?
                      AND taken_year = ?
                      AND taken_term = ?
                      AND course_id <> ?
                )
                """;

        return jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                userId,
                courseMasterId,
                takenYear,
                takenTerm,
                excludeCourseId
        );
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

    // 사용자 수강 내역 전체 삭제
    @Override
    public void deleteByUserId(long userId) {
        String sql = """
                DELETE FROM course
                WHERE user_id = ?
                """;
        jdbcTemplate.update(sql, userId);
    }
}
