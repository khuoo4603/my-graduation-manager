package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.CultureEvaluation;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.CultureRuleRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// 교양 졸업요건 충족여부 확인
@Component
public class CultureEvaluator {

    public CultureEvaluation evaluate(GradLoadData data, List<CourseRow> validCourses) {
        int required = data.template().totalCultureCredits();  // 교양 필요학점

        int earnedTotal = 0; // 교양 취득학점
        Map<String, Integer> earnedByCategory = new HashMap<>(); // <이수구분, 취득학점> 저장

        for (CourseRow course : validCourses) {
            // 교양이 아니면 로직X
            if (!"교양".equals(course.courseCategory())) { continue;}

            earnedTotal += course.earnedCredits();

            // 만약 교양선택이 있으면 list내부에 포함하지 않음.
            String subcategory = course.courseSubcategory();
            if (subcategory == null || "교양선택".equals(subcategory)) { continue; }

            earnedByCategory.merge(subcategory, course.earnedCredits(), Integer::sum); // 이수구분에 맞춰 취득학점 합산
        }

        List<CultureEvaluation.CultureRuleEvaluation> rules = new ArrayList<>();
        boolean allRulesSatisfied = true;

        for (CultureRuleRow rule : data.cultureRules()) {
            int earned = earnedByCategory.getOrDefault(rule.ruleCategory(), 0); // 현재 rule의 취득학점을 확인(현재 rule의 강의을 수강한적 없다면 학점 0)

            // 교양 세부판정 요약에 들어갈 객체를 생성하려 list에 저장
            CultureEvaluation.CultureRuleEvaluation ruleEvaluation =
                    new CultureEvaluation.CultureRuleEvaluation(
                            rule.ruleCategory(),
                            rule.requiredCredits(),
                            earned
                    );
            rules.add(ruleEvaluation);

            // 각 이수구분마다 취득학점 >= 필요학점 검사.
            if (!ruleEvaluation.isSatisfied()) { allRulesSatisfied = false; }
        }

        boolean satisfied = (earnedTotal >= required) && allRulesSatisfied; // allRulesSatisfied와 총 교양 필요학점을 모두 충족하는지
        return new CultureEvaluation(required, earnedTotal, satisfied, rules);
    }

}