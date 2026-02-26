package com.khuoo.gradmanager.grad.domain.result;

import java.util.List;


// 교양 판정 결과.
public record CultureEvaluation(
        int required,                   // 교양총필요학점
        int earned,                     // 교양총취득학점
        boolean isSatisfied,            // 교양총학점 + rules 모두 만족 여부
        List<CultureRuleEvaluation> rules // 이수구분(필요학점 있는 이수구분) 별 만족 현황
) {
    public int shortage() { return Math.max(0, required - earned); } // 부족 학점 계산

    public record CultureRuleEvaluation(
            String category,     // 이수구분 (교양필수/채플/SEED 등)
            int required,        // 필요학점
            int earned           // 취득학점
    ) {

        public int shortage() { return Math.max(0, required - earned); } // 부족 학점 계산 (음수가 나오면 0적용)
        public boolean isSatisfied() { return earned >= required; } // 졸업요건 충족 기준 (필요학점보다 취득학점이 높거나 같으면 true)
    }
}