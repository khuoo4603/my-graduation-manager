package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.SeedEvaluation;
import com.khuoo.gradmanager.grad.loadmodel.*;
import org.springframework.stereotype.Component;

import java.util.*;

// SEED 졸업요건 충족여부 확인
@Component
public class SeedEvaluator {
    private static final int MIN_AREA_CREDITS = 3; // 필요영역 최소학점 기준(고정 3)

    public SeedEvaluation evaluate(
            GradLoadData data,                    // 템플릿/규칙/사용자 정보 묶음
            List<CourseRow> validCourses,         // F/NP 제외된 수강 목록
            Map<Long, CourseMasterRow> masterById // course_master 빠른 조회용 캐시(강의ID, 교양/전공, 이수구분, SEED)
    ) {
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
            CourseMasterRow master = masterById.get(course.courseMasterId());

            if (master == null) { continue; } // course_master 정보 없을 경우 집계 제외
            if (!"교양".equals(master.courseCategory())) { continue; } // 교양과목이 아니면 집계 제외
            if (!"SEED".equals(master.courseSubcategory())) { continue; } // SEED 영역이 아니면 집계 제외
            if (master.seedArea() == null || master.seedArea().isBlank()) { continue; } // seed_area가 없을 경우 집계 제외

            earned += course.earnedCredits(); // SEED 총 취득학점 누적
            earnedByArea.merge(master.seedArea(), course.earnedCredits(), Integer::sum); // seed_area별 취득학점 누적
        }

        // 필요영역 목록(culture_credit_rule_seed 기반)
        List<String> requiredAreas = new ArrayList<>();
        for (SeedRequirementRow row : data.seedRequirements()) {
            requiredAreas.add(row.requiredArea());
        }

        boolean isTotalSatisfied = earned >= required; // SEED 총학점 충족 여부

        // SEED 세부 영역 이수 여부
        boolean isAreaSatisfied  = false;
        if (!requiredAreas.isEmpty()) { // 필요 영역은 1개 이상 존재 필수.
            for (String area : requiredAreas) {
                int nowEarned = earnedByArea.getOrDefault(area, 0); // 해당 영역 취득 학점

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