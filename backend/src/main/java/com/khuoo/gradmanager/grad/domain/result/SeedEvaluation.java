package com.khuoo.gradmanager.grad.domain.result;

import java.util.List;
import java.util.Map;

// SEED 판정 결과
public record SeedEvaluation(
        int required,                   // SEED 필요학점
        int earned,                     // SEED 취득학점
        List<String> requiredAreas,     // 필요영역 목록
        int minAreaCredits,             // 필요영역 최소학점(3)
        Map<String, Integer> earnedByArea, // 영역별 취득학점
        boolean isTotalSatisfied,       // 총요건 충족 여부
        boolean isAreaSatisfied,        // 영역요건 충족 여부
        boolean isSatisfied             // 총요건 AND 영역요건
) {
    public int shortage() { return Math.max(0, required - earned); } // 부족 학점 계산 (음수가 나오면 0적용)
}