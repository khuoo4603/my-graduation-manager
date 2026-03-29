package com.khuoo.gradmanager.grad.repository;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.CultureRuleRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.loadmodel.GraduationTemplateRow;
import com.khuoo.gradmanager.grad.loadmodel.MajorCreditRuleRow;
import com.khuoo.gradmanager.grad.loadmodel.SeedRequirementRow;
import com.khuoo.gradmanager.grad.loadmodel.UserMajorRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@RequiredArgsConstructor
@Repository
public class GradQueryDao implements GradQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    // 졸업판정에 필요한 사용자/규칙/수강 이력을 한 번에 로드
    @Override
    public GradLoadData load(long userId) {
        UserBaseRow userBase = loadUserBase(userId); // 사용자 기본 정보(유저ID/학부/템플릿) 저장
        GraduationTemplateRow template = loadTemplate(userBase.templateId()); // 템플릿데이터(템플릿ID, 학부ID, 템플릿이름, 적용년도, 총학점, 교양총학점, 전탐총학점) 저장
        List<UserMajorRow> userMajors = loadUserMajors(userId); // 사용자 선택 전공 목록(전공ID, 전공명, 전공타입(주전공, 복수전공 등)) 저장
        List<MajorCreditRuleRow> majorCreditRules = loadMajorCreditRules(userMajors); // 전공의 타입별 학점 데이터(전공ID, 전공타입, 전필, 전공 총 필요학점) 저장
        List<CourseRow> courses = loadCourses(userId); // 사용자 수강 이력(course snapshot 포함) 저장
        List<CultureRuleRow> cultureRules = template == null ? List.of() : loadCultureRules(template.templateId()); // 템플릿이 없으면 빈 리스트 반환
        List<SeedRequirementRow> seedRequirements = template == null ? List.of() : loadSeedRequirements(template.templateId()); // 템플릿이 없으면 빈 리스트 반환

        return new GradLoadData(
                userId,
                userBase.departmentId(),
                template,
                cultureRules,
                seedRequirements,
                userMajors,
                majorCreditRules,
                courses
        );
    }

    // 사용자 기본 정보(학부/템플릿 포함) 조회
    private UserBaseRow loadUserBase(long userId) {
        String sql = """
                SELECT user_id, department_id, template_id
                FROM users
                WHERE user_id = ?
                """;

        List<UserBaseRow> rows = jdbcTemplate.query(sql, (rs, rowNum) ->
                new UserBaseRow(
                        rs.getLong("user_id"),
                        rs.getObject("department_id", Long.class),
                        rs.getObject("template_id", Long.class)
                ), userId);

        // 사용자가 존재하지 않음
        // 사용자 존재 여부 검증
        if (rows.isEmpty()) { throw new ApiException(ErrorCode.USER_NOT_FOUND); }

        return rows.get(0);
    }

    // 사용자 템플릿 ID로 졸업 템플릿 조회
    private GraduationTemplateRow loadTemplate(Long templateId) {
        // 템플릿이 없는 유저는 NULL 반환 후 서비스 단계에서 판정 가능 여부 처리
        // 템플릿 미설정 여부 검증
        if (templateId == null) { return null; }

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

        // 사용자의 템플릿 ID가 존재하지 않으면 NULL 반환
        if (rows.isEmpty()) { return null; }

        return rows.get(0);
    }

    // 템플릿에 연결된 교양 규칙 목록 조회
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

    // 템플릿에 연결된 SEED 필요영역 목록 조회
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

    // 사용자 전공 목록 조회
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

    // 사용자 전공 목록에 해당하는 전공 학점 규칙 조회
    private List<MajorCreditRuleRow> loadMajorCreditRules(List<UserMajorRow> userMajors) {
        // 전공이 없으면 전공 규칙 조회X -> 빈 리스트 반환
        // 사용자 전공 목록 비어 있음 검증
        if (userMajors.isEmpty()) { return List.of(); }

        // 전공의 갯수에 따른 가변 인자
        String inClause = "?";
        for (int i = 0; i < (userMajors.size() - 1); i++) {
            inClause += ",?";
        }

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

    // 사용자 수강 이력 조회(course snapshot 포함)
    private List<CourseRow> loadCourses(long userId) {
        String sql = """
                SELECT
                    course_id,
                    course_master_id,
                    course_code_snapshot,
                    course_name_snapshot,
                    course_category,
                    course_subcategory,
                    seed_area,
                    earned_credits,
                    grade,
                    taken_year,
                    taken_term,
                    retake_course_id,
                    recognition_type,
                    major_id,
                    attributed_department_id
                FROM course
                WHERE user_id = ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new CourseRow(
                        rs.getLong("course_id"),
                        rs.getObject("course_master_id", Long.class),
                        rs.getString("course_code_snapshot"),
                        rs.getString("course_name_snapshot"),
                        rs.getString("course_category"),
                        rs.getString("course_subcategory"),
                        rs.getString("seed_area"),
                        rs.getInt("earned_credits"),
                        rs.getString("grade"),
                        rs.getInt("taken_year"),
                        rs.getString("taken_term"),
                        rs.getObject("retake_course_id", Long.class),
                        rs.getString("recognition_type"),
                        rs.getObject("major_id", Long.class),
                        rs.getObject("attributed_department_id", Long.class)
                ), userId);
    }

    private record UserBaseRow(
            long userId,
            Long departmentId,
            Long templateId
    ) {}
}
