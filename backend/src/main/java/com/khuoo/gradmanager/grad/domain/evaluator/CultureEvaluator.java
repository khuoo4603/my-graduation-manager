package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.CultureEvaluation;
import com.khuoo.gradmanager.grad.loadmodel.CourseMasterRow;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.CultureRuleRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import org.springframework.stereotype.Component;

import java.util.*;


// 교양 졸업요건 충족여부 확인
@Component
public class CultureEvaluator {

    public CultureEvaluation evaluate(
            GradLoadData data,                       // 로딩된 판정 입력 데이터
            List<CourseRow> validCourses,            // F/NP 제외된 수강 목록
            Map<Long, CourseMasterRow> masterById    // course_master 빠른 조회용 캐시(강의ID, 교양/전공, 이수구분, SEED)
    ) {
        int required = data.template().totalCultureCredits(); // 교양 필요학점

        int earnedTotal = 0; // 교양 취득학점
        Map<String, Integer> earnedByCategory = new HashMap<>(); // <이수구분, 취득학점> 저장

        for (CourseRow course : validCourses) {
            CourseMasterRow masterId = masterById.get(course.courseMasterId());
            if (masterId == null) { continue; } // 강의가 존재하지 않으면 로직처리 X
            if (!"교양".equals(masterId.courseCategory())) { continue; }// 교양이 아니면 로직X

            earnedTotal += course.earnedCredits();

            String sub = masterId.courseSubcategory();
            if (sub == null) { continue; } // 이수구분이 없으면 처리 X
            if ("교양선택".equals(sub)) { continue; } // 만약 교양선택이 있으면 list내부에 포함하지 않음.

            earnedByCategory.merge(sub, course.earnedCredits(), Integer::sum); // 이수구분에 맞춰 취득학점 합산
        }

        List<CultureEvaluation.CultureRuleEvaluation> rules = new ArrayList<>();
        boolean allRulesSatisfied = true;

        for (CultureRuleRow rule : data.cultureRules()) {
            int earned = earnedByCategory.getOrDefault(rule.ruleCategory(), 0); // 현재 rule의 취득학점을 확인(현재 rule의 강의을 수강한적 없다면 학점 0)

            // 교양 세부판정 요약에 들어갈 객체를 생성하려 list에 저장
            CultureEvaluation.CultureRuleEvaluation ruleEval = new CultureEvaluation.CultureRuleEvaluation(rule.ruleCategory(), rule.requiredCredits(), earned);
            rules.add(ruleEval);

            // 각 이수구분마다 취득학점 >= 필요학점 검사.
            if (!ruleEval.isSatisfied()) { allRulesSatisfied = false; }
        }

        boolean satisfied = (earnedTotal >= required) && allRulesSatisfied; // allRulesSatisfied와 총 교양 필요학점을 모두 충족하는지
        return new CultureEvaluation(required, earnedTotal, satisfied, rules);
    }

}