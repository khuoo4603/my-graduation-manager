package com.khuoo.gradmanager.micromajor.loadmodel;

import java.util.List;

// 마이크로전공 상태 판정에 필요한 전체 로드 데이터
public record MicromajorLoadData(
        Long userDepartmentId,                       // 사용자 소속 학부 PK(users.department_id) / NULL 가능
        List<MicroMajorRow> microMajors,            // 활성화된 마이크로전공 기준 목록(micro_major)
        List<RequirementGroupRow> requirementGroups, // 마이크로전공 요구 그룹 목록(micro_major_requirement_group)
        List<RequirementCourseRow> requirementCourses, // 그룹별 인정 과목/슬롯 기준 목록(micro_major_requirement_course)
        List<EligibilityRow> eligibilityRows,       // 마이크로전공 eligibility 조건 목록(micro_major_eligibility)
        List<UserMajorRow> userMajors,              // 사용자가 등록한 전공 ID 목록(user_major)
        List<UserCourseRow> userCourses             // 사용자의 원본 수강 내역 목록(course)
) {}
