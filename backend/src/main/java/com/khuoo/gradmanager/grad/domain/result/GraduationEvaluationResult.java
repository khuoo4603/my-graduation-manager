package com.khuoo.gradmanager.grad.domain.result;


// 판정결과 모음 DTO
public record GraduationEvaluationResult(
        long templateId,                    // 적용 템플릿 PK
        String templateName,                // 템플릿명
        int templateYear,                   // 적용연도
        int totalRequired,                  // 총필요학점
        int totalEarned,                    // 총취득학점(F/NP 제외)
        CultureEvaluation culture,          // 교양 판정 결과
        SeedEvaluation seed,                // SEED 판정 결과
        MajorEvaluation major,              // 전공 판정 결과
        MajorExplorationEvaluation majorExploration, // 전공탐색 판정 결과
        boolean overallSatisfied            // 최종 졸업 충족 여부
) {
    public int totalShortage() { return Math.max(0, totalRequired - totalEarned); } // 부족 학점 계산 (음수가 나오면 0적용)
}