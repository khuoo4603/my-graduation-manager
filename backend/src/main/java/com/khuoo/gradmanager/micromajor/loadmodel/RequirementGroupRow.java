package com.khuoo.gradmanager.micromajor.loadmodel;

// micro_major_requirement_group 조회 Row
public record RequirementGroupRow(
        long requirementGroupId,   // 요구 그룹 PK
        long microMajorId,         // 소속 마이크로전공 PK
        int groupNo,               // 그룹 번호
        String groupName,          // 그룹명
        int requiredCourseCount    // 그룹 필요 과목 수(슬롯 기준)
) {}
