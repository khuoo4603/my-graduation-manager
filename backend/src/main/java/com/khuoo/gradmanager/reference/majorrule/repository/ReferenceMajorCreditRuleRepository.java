package com.khuoo.gradmanager.reference.majorrule.repository;


public interface ReferenceMajorCreditRuleRepository {

    // 전공/전공타입 조합규칙 존재 여부 확인 (전공을 기준으로 전공타입이 있는지 확인)
    boolean existsByMajorIdAndMajorType(long majorId, String majorType);
}