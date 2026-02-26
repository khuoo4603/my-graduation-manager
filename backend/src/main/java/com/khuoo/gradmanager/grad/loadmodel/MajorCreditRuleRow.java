package com.khuoo.gradmanager.grad.loadmodel;


// major_credit_rule 테이블 조회 Row
public record MajorCreditRuleRow(
        long majorId,                        // 전공ID
        String majorType,                    // 전공타입 (ex. 주전공)
        int requiredMajorTotalCredits,       // 전공 총 필요학점
        int requiredMajorCoreCredits         // 전공필수 필요학점
) {}