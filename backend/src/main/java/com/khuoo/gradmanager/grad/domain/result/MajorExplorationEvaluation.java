package com.khuoo.gradmanager.grad.domain.result;


// 전공탐색 판정 결과
public record MajorExplorationEvaluation(
        int required,        // 전공탐색 필요학점
        int earnedTotal,     // 전공탐색 총취득학점
        int requiredMyDept,  // 본인학부 전공탐색 필요학점(3)
        int earnedMyDept,    // 본인학부 전공탐색 취득학점
        boolean isSatisfied  // 총요건 AND 본인학부 요건
) {
    public int shortageTotal() { return Math.max(0, required - earnedTotal); } // 전체 부족 학점 계산 (음수가 나오면 0적용)
    public int shortageMyDept() { return Math.max(0, requiredMyDept - earnedMyDept); } // 본인학부 부족 학점 계산 (음수가 나오면 0적용)
}