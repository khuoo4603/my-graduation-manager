package com.khuoo.gradmanager.grad.loadmodel;

import java.util.List;
import java.util.Map;


// 졸업판정에 필요한 모든 데이터의 집합
public record GradLoadData(
        long userId,                           // 사용자 PK(users.user_id)
        long userDepartmentId,                 // 사용자 학부 PK(users.department_id)
        GraduationTemplateRow template,         // 적용 템플릿(graduation_template)
        List<CultureRuleRow> cultureRules,      // 교양 규칙(culture_credit_rule)
        List<SeedRequirementRow> seedRequirements, // SEED 필요영역(culture_credit_rule_seed)
        List<UserMajorRow> userMajors,          // 사용자 전공 목록(user_major + major)
        List<MajorCreditRuleRow> majorCreditRules, // 전공 규칙(major_credit_rule)
        List<CourseRow> courses,                // 사용자 수강 이력(course)
        Map<Long, CourseMasterRow> courseMastersById // course_master_id -> 마스터 속성(course_master)
) {}