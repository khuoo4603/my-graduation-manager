package com.khuoo.gradmanager.grad.domain.result;

import java.util.List;


// 전공 판정 결과
public record MajorEvaluation(
        boolean hasMajors,         // 사용자 전공 존재 여부
        boolean isSatisfied,       // 모든 전공이 만족이면 true
        List<MajorItemEvaluation> majors // 전공별 판정 결과
) {
    public record MajorItemEvaluation(
            long majorId,          // 전공 PK
            String majorName,      // 전공명
            String majorType,      // 전공 타입
            int requiredTotal,     // 전공 총 필요학점
            int requiredCore,      // 전공필수 필요학점
            int earnedCore,        // 전공필수 취득학점
            int earnedElective     // 전공선택 취득학점
    ) {
        public int earnedTotal() { return earnedCore + earnedElective; } // 전공 총 취득학점

        // 전공 총 필요학점 충족여부 AND 전공필수 필요학점 충족여부 계산
        public boolean isSatisfied() { return earnedTotal() >= requiredTotal() && earnedCore >= requiredCore; }
    }
}