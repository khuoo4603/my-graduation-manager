package com.khuoo.gradmanager.grad.domain;

import com.khuoo.gradmanager.grad.domain.result.*;
import com.khuoo.gradmanager.grad.dto.GraduationStatusResponse;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

// 졸업요건 미충족 항목 Dto 생성
@Component
public class MissingItemsBuilder {

    public List<GraduationStatusResponse.MissingItem> build(
            GradLoadData data,          // 로딩된 판정 입력 데이터
            int totalEarned,            // 총취득학점
            CultureEvaluation culture,  // 교양 판정 결과
            SeedEvaluation seed,        // SEED 판정 결과
            MajorEvaluation major,      // 전공 판정 결과
            MajorExplorationEvaluation majorExploration // 전공탐색 판정 결과
    ) {
        List<GraduationStatusResponse.MissingItem> missing = new ArrayList<>();

        int totalRequired = data.template().totalRequiredCredits();
        if (totalEarned < totalRequired) {
            missing.add(new GraduationStatusResponse.MissingItem(
                    "총학점",
                    "총취득학점이 부족합니다.",
                    totalRequired,
                    totalEarned,
                    totalRequired - totalEarned
            ));
        }

        if (!culture.isSatisfied()) {
            missing.add(new GraduationStatusResponse.MissingItem(
                    "교양",
                    "교양 요건이 부족합니다.",
                    culture.required(),
                    culture.earned(),
                    culture.shortage()
            ));
        }

        // SEED - 총요건/영역요건 분리
        if (!seed.isSatisfied()) {
            if (!seed.isTotalSatisfied()) {
                missing.add(new GraduationStatusResponse.MissingItem(
                        "SEED",
                        "SEED 총학점이 부족합니다.",
                        seed.required(),
                        seed.earned(),
                        seed.shortage()
                ));
            }
            if (!seed.isAreaSatisfied()) {
                missing.add(new GraduationStatusResponse.MissingItem(
                        "SEED",
                        "SEED 필요영역에서 3학점 이상을 이수해야 합니다.",
                        seed.minAreaCredits(),
                        0,
                        seed.minAreaCredits()
                ));
            }
        }

        // 전공 - 전공별 분리
        if (major.hasMajors() && !major.isSatisfied()) {
            for (MajorEvaluation.MajorItemEvaluation m : major.majors()) {
                if (m.isSatisfied()) { continue; }

                // domain: "(전공명)전공과정"
                String domain = "(" + m.majorName() + ")전공과정";

                if (m.earnedCore() < m.requiredCore()) {
                    missing.add(new GraduationStatusResponse.MissingItem(
                            domain,
                            "전공필수 학점이 부족합니다.",
                            m.requiredCore(),
                            m.earnedCore(),
                            m.requiredCore() - m.earnedCore()
                    ));
                }

                if (m.earnedTotal() < m.requiredTotal()) {
                    missing.add(new GraduationStatusResponse.MissingItem(
                            domain,
                            "전공총학점이 부족합니다.",
                            m.requiredTotal(),
                            m.earnedTotal(),
                            m.requiredTotal() - m.earnedTotal()
                    ));
                }
            }
        }

        // 전공 - 총학점/본인학부 요건 분리
        if (!majorExploration.isSatisfied()) {
            if (majorExploration.earnedTotal() < majorExploration.required()) {
                missing.add(new GraduationStatusResponse.MissingItem(
                        "전공탐색",
                        "전공탐색 총학점이 부족합니다.",
                        majorExploration.required(),
                        majorExploration.earnedTotal(),
                        majorExploration.shortageTotal()
                ));
            }
            if (majorExploration.earnedMyDept() < majorExploration.requiredMyDept()) {
                missing.add(new GraduationStatusResponse.MissingItem(
                        "전공탐색",
                        "본인 학부 전공탐색 3학점을 이수해야 합니다.",
                        majorExploration.requiredMyDept(),
                        majorExploration.earnedMyDept(),
                        majorExploration.shortageMyDept()
                ));
            }
        }

        return missing;
    }
}