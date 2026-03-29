package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.MajorEvaluation;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.loadmodel.MajorCreditRuleRow;
import com.khuoo.gradmanager.grad.loadmodel.UserMajorRow;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// 전공 판정 계산기
@Slf4j
@Component
public class MajorEvaluator {

    public MajorEvaluation evaluate(GradLoadData data, List<CourseRow> validCourses) {

        boolean hasMajors = !data.userMajors().isEmpty(); // 사용자 전공 존재 여부
        if (!hasMajors) { return new MajorEvaluation(false, true, List.of()); } // 전공 없을 경우 졸업요건 충족 처리

        // 전공+전공타입(주/부전공 등)별 rule(필요학점)저장
        Map<String, MajorCreditRuleRow> ruleMap = new HashMap<>();
        for (MajorCreditRuleRow rule : data.majorCreditRules()) {
            String key = rule.majorId() + "|" + rule.majorType();
            ruleMap.putIfAbsent(key, rule);
        }

        List<MajorEvaluation.MajorItemEvaluation> majors = new ArrayList<>(); // 전공별 요약 리스트
        boolean allSatisfied = true; // 전공 전체 졸업요건 충족 여부

        for (UserMajorRow userMajor : data.userMajors()) {
            String key = userMajor.majorId() + "|" + userMajor.majorType();
            MajorCreditRuleRow rule = ruleMap.get(key); // 본인 전공+전공타입과 맞는 규칙을 가져옴.

            int requiredTotal = rule != null ? rule.requiredMajorTotalCredits() : 0;    // 전공 총 필요학점(규칙이 없다면 0)
            int requiredCore = rule != null ? rule.requiredMajorCoreCredits() : 0;      // 전공필수 필요학점(규칙이 없다면 0)

            int earnedCore = 0;       // 전공필수 취득학점 누적
            int earnedElective = 0;   // 전공선택 취득학점 누적

            for (CourseRow course : validCourses) {
                if (!"전공".equals(course.courseCategory())) { continue; } // 전공이 아닐 경우 판정X

                // 전공필수 / 전공선택이 아니면 전공 학점으로 인정하지 않음
                String recognition = course.recognitionType();
                if (!"전공필수".equals(recognition) && !"전공선택".equals(recognition)) { continue; }

                // 사용자 인정 타입과 과목 자체 분류가 다르면 제외 (오류가 아니면 같아야함.)
                if (!recognition.equals(course.courseSubcategory())) { continue; }

                // 현재 판정 중인 전공에 귀속된 과목만 집계
                Long majorId = course.majorId();
                if (majorId == null || !majorId.equals(userMajor.majorId())) { continue; }

                // 전필/전선 구분하여 취득학점 누적
                if ("전공필수".equals(recognition)) {
                    earnedCore += course.earnedCredits();
                } else {
                    earnedElective += course.earnedCredits();
                }
            }

            MajorEvaluation.MajorItemEvaluation item =
                    new MajorEvaluation.MajorItemEvaluation(
                            userMajor.majorId(),
                            userMajor.majorName(),
                            userMajor.majorType(),
                            requiredTotal,
                            requiredCore,
                            earnedCore,
                            earnedElective
                    );

            majors.add(item);

            if (!item.isSatisfied()) { allSatisfied = false; } // 하나라도 미충족 → 전체 미충족
        }

        return new MajorEvaluation(true, allSatisfied, majors);
    }
}