package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.*;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import org.springframework.stereotype.Component;

// 최종 졸업요건 충족여부 확인
@Component
public class OverallEvaluator {

    public boolean evaluate(
            GradLoadData data,                   // 로딩된 판정 입력 데이터
            int totalEarned,                     // 총취득학점
            CultureEvaluation culture,            // 교양 판정 결과
            SeedEvaluation seed,                  // SEED 판정 결과
            MajorEvaluation major,                // 전공 판정 결과
            MajorExplorationEvaluation majorExploration // 전공탐색 판정 결과
    ) {
        int totalRequired = data.template().totalRequiredCredits(); // 총 필요학점
        boolean totalSatisfied = totalEarned >= totalRequired; // 총 필요학점 충족 여부

        return totalSatisfied
                && culture.isSatisfied()
                && seed.isSatisfied()
                && major.isSatisfied()
                && majorExploration.isSatisfied();
    }
}