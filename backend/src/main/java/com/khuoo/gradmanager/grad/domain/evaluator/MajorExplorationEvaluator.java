package com.khuoo.gradmanager.grad.domain.evaluator;

import com.khuoo.gradmanager.grad.domain.result.MajorExplorationEvaluation;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import org.springframework.stereotype.Component;

import java.util.List;

// 전공탐색 졸업요건 충족여부 확인
@Component
public class MajorExplorationEvaluator {
    private static final int REQUIRED_MY_DEPT = 3; // 본인학부 전공탐색 최소학점 기준

    public MajorExplorationEvaluation evaluate(
            GradLoadData data,              // 사용자 전공/전공규칙 포함 입력 데이터
            List<CourseRow> validCourses    // F/NP 제외 수강 목록
    ) {
        int required = data.template().totalMajorExplorationCredits(); // 템플릿 전공탐색 필요학점

        int earnedTotal = 0;   // 전공탐색 총 취득학점
        int earnedMyDept = 0;  // 본인학부 전공탐색 취득학점

        for (CourseRow course : validCourses) {
            if (!"전공탐색".equals(course.recognitionType())) { continue; } // 전공탐색만 판정

            earnedTotal += course.earnedCredits();

            // 해당 강의가 본인학부의 강의일 경우 earnedMyDept 누적
            if (course.attributedDepartmentId() != null &&
                    course.attributedDepartmentId().equals(data.userDepartmentId())) {
                earnedMyDept += course.earnedCredits();
            }
        }

        // 총 취득학점 >= 총 필요학점 And 본인학부 3학점 이수
        boolean satisfied =  earnedTotal >= required && earnedMyDept >= REQUIRED_MY_DEPT;

        return new MajorExplorationEvaluation(
                required,
                earnedTotal,
                REQUIRED_MY_DEPT,
                earnedMyDept,
                satisfied
        );
    }
}