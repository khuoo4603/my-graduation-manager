package com.khuoo.gradmanager.micromajor.repository;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.micromajor.loadmodel.EligibilityRow;
import com.khuoo.gradmanager.micromajor.loadmodel.MicroMajorRow;
import com.khuoo.gradmanager.micromajor.loadmodel.MicromajorLoadData;
import com.khuoo.gradmanager.micromajor.loadmodel.RequirementCourseRow;
import com.khuoo.gradmanager.micromajor.loadmodel.RequirementGroupRow;
import com.khuoo.gradmanager.micromajor.loadmodel.UserCourseRow;
import com.khuoo.gradmanager.micromajor.loadmodel.UserMajorRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class MicromajorQueryDao implements MicromajorQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    // 마이크로전공 상태 판정에 필요한 기준/사용자 데이터를 로드
    @Override
    public MicromajorLoadData load(long userId) {
        return new MicromajorLoadData(
                loadUserDepartmentId(userId),
                loadMicroMajors(),
                loadRequirementGroups(),
                loadRequirementCourses(),
                loadEligibilityRows(),
                loadUserMajors(userId),
                loadUserCourses(userId)
        );
    }

    // 사용자 소속 학부 조회
    private Long loadUserDepartmentId(long userId) {
        String sql = """
                SELECT
                    department_id
                FROM users
                WHERE user_id = ?
                """;

        List<Long> rows = jdbcTemplate.query(sql,
                (rs, rowNum) -> rs.getObject("department_id", Long.class),
                userId);

        if (rows.isEmpty()) {
            throw new ApiException(ErrorCode.USER_NOT_FOUND);
        }

        return rows.get(0);
    }

    // 활성화된 마이크로전공 기준 데이터 조회
    private List<MicroMajorRow> loadMicroMajors() {
        String sql = """
                SELECT
                    micro_major_id,
                    micro_major_name,
                    micro_major_category,
                    operating_unit_names,
                    required_course_count,
                    required_credits,
                    valid_from_year,
                    valid_from_term
                FROM micro_major
                WHERE active = TRUE
                ORDER BY micro_major_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new MicroMajorRow(
                        rs.getLong("micro_major_id"),
                        rs.getString("micro_major_name"),
                        rs.getString("micro_major_category"),
                        rs.getString("operating_unit_names"),
                        rs.getInt("required_course_count"),
                        rs.getInt("required_credits"),
                        rs.getInt("valid_from_year"),
                        rs.getString("valid_from_term")
                ));
    }

    // 마이크로전공 요구 그룹 조회
    private List<RequirementGroupRow> loadRequirementGroups() {
        String sql = """
                SELECT
                    requirement_group_id,
                    micro_major_id,
                    group_no,
                    group_name,
                    required_course_count
                FROM micro_major_requirement_group
                ORDER BY micro_major_id, group_no, requirement_group_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new RequirementGroupRow(
                        rs.getLong("requirement_group_id"),
                        rs.getLong("micro_major_id"),
                        rs.getInt("group_no"),
                        rs.getString("group_name"),
                        rs.getInt("required_course_count")
                ));
    }

    // 그룹별 인정 과목/슬롯 기준 조회
    private List<RequirementCourseRow> loadRequirementCourses() {
        String sql = """
                SELECT
                    requirement_course_id,
                    requirement_group_id,
                    recognized_course_code,
                    recognized_course_name,
                    requirement_slot_key,
                    display_order,
                    valid_from_year_override,
                    valid_from_term_override
                FROM micro_major_requirement_course
                ORDER BY requirement_group_id, display_order, requirement_course_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new RequirementCourseRow(
                        rs.getLong("requirement_course_id"),
                        rs.getLong("requirement_group_id"),
                        rs.getString("recognized_course_code"),
                        rs.getString("recognized_course_name"),
                        rs.getString("requirement_slot_key"),
                        rs.getInt("display_order"),
                        rs.getObject("valid_from_year_override", Integer.class),
                        rs.getString("valid_from_term_override")
                ));
    }

    // 마이크로전공 eligibility 조건 조회
    private List<EligibilityRow> loadEligibilityRows() {
        String sql = """
                SELECT
                    micro_major_id,
                    eligibility_group_no,
                    eligibility_type,
                    department_id,
                    major_id
                FROM micro_major_eligibility
                ORDER BY micro_major_id, eligibility_group_no, micro_major_eligibility_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new EligibilityRow(
                        rs.getLong("micro_major_id"),
                        rs.getInt("eligibility_group_no"),
                        rs.getString("eligibility_type"),
                        rs.getObject("department_id", Long.class),
                        rs.getObject("major_id", Long.class)
                ));
    }

    // 사용자가 등록한 전공 ID 목록 조회
    private List<UserMajorRow> loadUserMajors(long userId) {
        String sql = """
                SELECT
                    major_id
                FROM user_major
                WHERE user_id = ?
                ORDER BY user_major_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new UserMajorRow(rs.getLong("major_id")), userId);
    }

    // 사용자의 원본 수강 내역 조회
    private List<UserCourseRow> loadUserCourses(long userId) {
        String sql = """
                SELECT
                    course_id,
                    course_code_snapshot,
                    course_name_snapshot,
                    earned_credits,
                    grade,
                    taken_year,
                    taken_term,
                    retake_course_id
                FROM course
                WHERE user_id = ?
                ORDER BY taken_year, course_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new UserCourseRow(
                        rs.getLong("course_id"),
                        rs.getString("course_code_snapshot"),
                        rs.getString("course_name_snapshot"),
                        rs.getInt("earned_credits"),
                        rs.getString("grade"),
                        rs.getInt("taken_year"),
                        rs.getString("taken_term"),
                        rs.getObject("retake_course_id", Long.class)
                ), userId);
    }
}
