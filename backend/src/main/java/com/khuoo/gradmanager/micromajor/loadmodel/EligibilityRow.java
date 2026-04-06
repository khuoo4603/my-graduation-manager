package com.khuoo.gradmanager.micromajor.loadmodel;

// micro_major_eligibility 조회 Row
public record EligibilityRow(
        long microMajorId,        // 소속 마이크로전공 PK
        int eligibilityGroupNo,   // 인정소속 그룹 번호
        String eligibilityType,   // 조건 유형(DEPARTMENT / MAJOR)
        Long departmentId,        // 학부 조건 PK / NULL 가능
        Long majorId              // 전공 조건 PK / NULL 가능
) {}
