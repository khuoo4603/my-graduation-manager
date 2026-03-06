package com.khuoo.gradmanager.reference.majorrule.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;


@Repository
@RequiredArgsConstructor
public class ReferenceReferenceMajorCreditRuleDao implements ReferenceMajorCreditRuleRepository {
    private final JdbcTemplate jdbcTemplate;

    // 전공/전공타입 조합규칙 존재 여부 확인 (전공을 기준으로 전공타입이 있는지 확인)
    @Override
    public boolean existsByMajorIdAndMajorType(long majorId, String majorType) {
        String sql = """
                SELECT COUNT(*)
                FROM major_credit_rule
                WHERE major_id = ?
                  AND major_type = ?
                """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, majorId, majorType);

        return count != null && count > 0;
    }
}