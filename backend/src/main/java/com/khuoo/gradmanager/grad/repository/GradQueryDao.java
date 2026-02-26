package com.khuoo.gradmanager.grad.repository;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.grad.loadmodel.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Repository
public class GradQueryDao implements GradQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public GradLoadData load(long userId) {
        UserBaseRow userBase = loadUserBase(userId); // 사용자 기본 정보(유저ID/학부/템플릿) 저장
        GraduationTemplateRow template = loadTemplate(userBase.templateId()); // 템플릿데이터(템플릿ID, 학부ID, 템플릿이름, 적용년도, 총학점, 교양총학점, 전탐총학점) 저장
        List<CultureRuleRow> cultureRules = loadCultureRules(template.templateId()); // 사용자가 저장한 템플릿의 교양규칙(교양규칙ID, 이수구분, 필요학점) 저장
        List<SeedRequirementRow> seedRequirements = loadSeedRequirements(template.templateId()); // 사용자가 저장한 템플릿의 SEED 규칙(교양규칙ID, 필요SEED영역) 저장
        List<UserMajorRow> userMajors = loadUserMajors(userId); // 사용자 선택 전공 목록(전공ID, 전공명, 전공타입(주전공, 복수전공 등)) 저장
        List<MajorCreditRuleRow> majorCreditRules = loadMajorCreditRules(userMajors); // 전공의 타입별 학점 데이터(전공ID, 전공타입, 전필, 전공 총 필요학점) 저정
        List<CourseRow> courses = loadCourses(userId); // 사용자 수강 이력(수강ID, 과목마스터ID, 취득학점, 성적, 이수구분, 전공ID, 학부ID) 저장
        Map<Long, CourseMasterRow> courseMastersById = loadCourseMasters(courses); // 빠른 데이터 조회를 위한 과목마스터ID:과목의 세부 데이터(과목마스터ID, 구분, 이수구분, SEED영역) 매핑

        return new GradLoadData(
                userId,
                userBase.departmentId(),
                template,
                cultureRules,
                seedRequirements,
                userMajors,
                majorCreditRules,
                courses,
                courseMastersById
        );
    }

    private UserBaseRow loadUserBase(long userId) {
        String sql = """
                SELECT user_id, department_id, template_id
                FROM users
                WHERE user_id = ?
                """;

        List<UserBaseRow> rows = jdbcTemplate.query(sql, (rs, rowNum) ->
                new UserBaseRow(
                        rs.getLong("user_id"),
                        rs.getLong("department_id"),
                        rs.getObject("template_id", Long.class)
                ), userId);

        // 사용자가 존재하지 않음
        if (rows.isEmpty()) { throw new ApiException(ErrorCode.USER_NOT_FOUND); }

        UserBaseRow row = rows.get(0);
        // 템플릿이 없는 유저 (템플릿이 없으면 판정 불가능)
        if (row.templateId() == null) { throw new ApiException(ErrorCode.INVALID_REQUEST); }

        return row;
    }

    private GraduationTemplateRow loadTemplate(long templateId) {
        String sql = """
                SELECT template_id, department_id, template_name, applicable_year,
                       total_required_credits, total_culture_credits, total_major_exploration_credits
                FROM graduation_template
                WHERE template_id = ?
                """;

        List<GraduationTemplateRow> rows = jdbcTemplate.query(sql, (rs, rowNum) ->
                new GraduationTemplateRow(
                        rs.getLong("template_id"),
                        rs.getLong("department_id"),
                        rs.getString("template_name"),
                        rs.getInt("applicable_year"),
                        rs.getInt("total_required_credits"),
                        rs.getInt("total_culture_credits"),
                        rs.getInt("total_major_exploration_credits")
                ), templateId);

        // 사용자의 템플릿 ID가 존재하지 않음
        if (rows.isEmpty()) { throw new ApiException(ErrorCode.TEMPLATE_NOT_FOUND); }

        return rows.get(0);
    }

    private List<CultureRuleRow> loadCultureRules(long templateId) {
        String sql = """
                SELECT culture_credit_rule_id, rule_category, required_credits
                FROM culture_credit_rule
                WHERE template_id = ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new CultureRuleRow(
                        rs.getLong("culture_credit_rule_id"),
                        rs.getString("rule_category"),
                        rs.getInt("required_credits")
                ), templateId);
    }

    private List<SeedRequirementRow> loadSeedRequirements(long templateId) {
        String sql = """
            SELECT
                s.culture_credit_rule_id,
                s.seed_name AS required_area
            FROM culture_credit_rule_seed s
            JOIN culture_credit_rule r
              ON r.culture_credit_rule_id = s.culture_credit_rule_id
            WHERE r.template_id = ?
              AND r.rule_category = 'SEED'
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new SeedRequirementRow(
                        rs.getLong("culture_credit_rule_id"),
                        rs.getString("required_area")
                ), templateId);
    }

    private List<UserMajorRow> loadUserMajors(long userId) {
        String sql = """
                SELECT m.major_id, m.major_name, um.major_type
                FROM user_major um
                JOIN major m ON m.major_id = um.major_id
                WHERE um.user_id = ?
                ORDER BY um.user_major_id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new UserMajorRow(
                        rs.getLong("major_id"),
                        rs.getString("major_name"),
                        rs.getString("major_type")
                ), userId);
    }

    private List<MajorCreditRuleRow> loadMajorCreditRules(List<UserMajorRow> userMajors) {
        // 전공이 없으면 전공 규칙 조회X -> 빈 리스트 반환
        if (userMajors.isEmpty()) { return List.of(); }

        // 전공의 갯수에 따른 가변 인자
        String inClause = "?";
        for (int i = 0; i < (userMajors.size()-1); i++) { inClause += ",?"; }

        String sql = """
                SELECT major_id, major_type, required_major_total_credits, required_major_core_credits
                FROM major_credit_rule
                WHERE major_id IN (%s)
                """.formatted(inClause);

        // majorId값으로 Object 배열 생성 (ex. [1041,1042])
        Object[] args = userMajors.stream().map(UserMajorRow::majorId).toArray();

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new MajorCreditRuleRow(
                        rs.getLong("major_id"),
                        rs.getString("major_type"),
                        rs.getInt("required_major_total_credits"),
                        rs.getInt("required_major_core_credits")
                ), args);
    }

    private List<CourseRow> loadCourses(long userId) {
        String sql = """
                SELECT course_id, course_master_id, earned_credits, grade,
                       recognition_type, major_id, attributed_department_id
                FROM course
                WHERE user_id = ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new CourseRow(
                        rs.getLong("course_id"),
                        rs.getLong("course_master_id"),
                        rs.getInt("earned_credits"),
                        rs.getString("grade"),
                        rs.getString("recognition_type"),
                        (Long) rs.getObject("major_id"),
                        (Long) rs.getObject("attributed_department_id")
                ), userId);
    }

    private Map<Long, CourseMasterRow> loadCourseMasters(List<CourseRow> courses) {
        // 수강 이력이 없으면 빈 Map 반환
        if (courses.isEmpty()) { return Map.of(); }

        // courseMasterId값으로 Object 배열 생성 + 중복 제거
        Object[] args = courses.stream().map(CourseRow::courseMasterId).distinct().toArray();

        // 사용자 수강 이력에 따른 가변인자 (중복제거 된 수강 목록 갯수)
        String inClause = "?";
        for (int i = 0; i < (args.length-1); i++) { inClause += ",?"; }

        String sql = """
                SELECT course_master_id, course_category, course_subcategory, seed_area
                FROM course_master
                WHERE course_master_id IN (%s)
                """.formatted(inClause);


        List<CourseMasterRow> rows = jdbcTemplate.query(sql, (rs, rowNum) ->
                new CourseMasterRow(
                        rs.getLong("course_master_id"),
                        rs.getString("course_category"),
                        rs.getString("course_subcategory"),
                        rs.getString("seed_area")
                ), args);

        // 조회 효율을 위해 map으로 변환
        Map<Long, CourseMasterRow> map = new HashMap<>();
        for (CourseMasterRow row : rows) {
            map.put(row.courseMasterId(), row);
        }
        return map;
    }

    private record UserBaseRow(
            long userId,
            long departmentId,
            Long templateId
    ) {}
}