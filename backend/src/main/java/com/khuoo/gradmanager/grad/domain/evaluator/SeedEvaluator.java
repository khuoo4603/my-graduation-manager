package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.SeedEvaluation;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.CultureRuleRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.loadmodel.SeedRequirementRow;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// SEED 졸업요건 충족여부 확인
@Component
public class SeedEvaluator {
    private static final int MIN_AREA_CREDITS = 3; // 필요영역 최소학점 기준(고정 3)

    public SeedEvaluation evaluate(GradLoadData data, List<CourseRow> validCourses) {
        int required = 0; // SEED 필요학점

        // 본인 학부의 SEED 필요학점 탐색
        for (CultureRuleRow rule : data.cultureRules()) {
            if ("SEED".equals(rule.ruleCategory())) {
                required = rule.requiredCredits();
                break;
            }
        }

        int earned = 0; // SEED 총 취득학점
        Map<String, Integer> earnedByArea = new HashMap<>(); // <seed_area, 취득학점> 저장

        for (CourseRow course : validCourses) {
            if (!"교양".equals(course.courseCategory())) { continue; } // 교양과목이 아니면 집계 제외
            if (!"SEED".equals(course.courseSubcategory())) { continue; } // SEED 영역이 아니면 집계 제외
            if (course.seedArea() == null || course.seedArea().isBlank()) { continue; } // seed_area가 없을 경우 집계 제외


            earned += course.earnedCredits(); // SEED 총 취득학점 누적
            earnedByArea.merge(course.seedArea(), course.earnedCredits(), Integer::sum); // seed_area별 취득학점 누적
        }

        // 필요영역 목록(culture_credit_rule_seed 기반)
        List<String> requiredAreas = new ArrayList<>();
        for (SeedRequirementRow row : data.seedRequirements()) {
            requiredAreas.add(row.requiredArea());
        }

        boolean isTotalSatisfied = earned >= required; // SEED 총학점 충족 여부
        boolean isAreaSatisfied = false;
        // SEED 세부 영역 이수 여부
        if (!requiredAreas.isEmpty()) { // 필요 영역은 1개 이상 존재 필수.
            for (String area : requiredAreas) {
                int nowEarned = earnedByArea.getOrDefault(area, 0);
                // 취득학점 >= 필요학점(3학점) 일 경우 바로 종료
                if (nowEarned >= MIN_AREA_CREDITS) {
                    isAreaSatisfied = true;
                    break;
                }
            }
        }

        boolean isSatisfied = isTotalSatisfied && isAreaSatisfied; // 전체 요건 충족 여부

        return new SeedEvaluation(
                required,
                earned,
                requiredAreas,
                MIN_AREA_CREDITS,
                earnedByArea,
                isTotalSatisfied,
                isAreaSatisfied,
                isSatisfied
        );
    }
}