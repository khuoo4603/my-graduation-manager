package com.khuoo.gradmanager.grad.loadmodel;


// culture_credit_rule 테이블 조회 Row
public record CultureRuleRow(
        long cultureCreditRuleId,   // 교양규칙ID
        String ruleCategory,        // 이수구분 (ex. 교양필수, 채플, SEED)
        int requiredCredits         // 필요학점
) {}