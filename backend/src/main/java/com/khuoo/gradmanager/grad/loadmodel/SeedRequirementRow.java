package com.khuoo.gradmanager.grad.loadmodel;


// culture_credit_rule_seed 테이블 조회 Row
public record SeedRequirementRow(
        long cultureCreditRuleId,   // 교양규칙ID
        String requiredArea         // 필요영역명 (ex. Science, Economy)
) {}