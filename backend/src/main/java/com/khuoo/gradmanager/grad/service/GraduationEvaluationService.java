package com.khuoo.gradmanager.grad.service;

import com.khuoo.gradmanager.course.support.AcademicTermPolicy;
import com.khuoo.gradmanager.grad.domain.MissingItemsBuilder;
import com.khuoo.gradmanager.grad.domain.evaluator.CultureEvaluator;
import com.khuoo.gradmanager.grad.domain.evaluator.MajorEvaluator;
import com.khuoo.gradmanager.grad.domain.evaluator.MajorExplorationEvaluator;
import com.khuoo.gradmanager.grad.domain.evaluator.OverallEvaluator;
import com.khuoo.gradmanager.grad.domain.evaluator.SeedEvaluator;
import com.khuoo.gradmanager.grad.domain.result.CultureEvaluation;
import com.khuoo.gradmanager.grad.domain.result.MajorEvaluation;
import com.khuoo.gradmanager.grad.domain.result.MajorExplorationEvaluation;
import com.khuoo.gradmanager.grad.domain.result.SeedEvaluation;
import com.khuoo.gradmanager.grad.dto.GraduationStatusResponse;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GraduationEvaluationService {

    private final CultureEvaluator cultureEvaluator;
    private final SeedEvaluator seedEvaluator;
    private final MajorEvaluator majorEvaluator;
    private final MajorExplorationEvaluator majorExplorationEvaluator;
    private final OverallEvaluator overallEvaluator;
    private final MissingItemsBuilder missingItemsBuilder;

    // 로드된 졸업판정 데이터를 평가 후 응답 DTO로 변환
    public GraduationStatusResponse evaluate(GradLoadData gradLoadData) {
        // 졸업판정에 사용할 수강 이력을 공용 전처리 정책으로 정리
        List<CourseRow> activeCourses = AcademicTermPolicy.selectCourses(gradLoadData.courses()).activeCourses();

        List<CourseRow> validCourses = new ArrayList<>();
        for (CourseRow course : activeCourses) {
            String grade = course.grade();
            // F, NP 성적은 취득학점과 졸업요건 계산에서 제외
            if (!"F".equals(grade) && !"NP".equals(grade)) {
                validCourses.add(course);
            }
        }

        // 각 DTO 섹션별 졸업판정
        CultureEvaluation cultureEvaluation = cultureEvaluator.evaluate(gradLoadData, validCourses);
        SeedEvaluation seedEvaluation = seedEvaluator.evaluate(gradLoadData, validCourses);
        MajorEvaluation majorEvaluation = majorEvaluator.evaluate(gradLoadData, validCourses);
        MajorExplorationEvaluation majorExplorationEvaluation =
                majorExplorationEvaluator.evaluate(gradLoadData, validCourses);

        // 전체요약 데이터 (전체 총 취득학점, 전체 졸업 요건 여부)
        int totalEarnedCredits = 0;
        for (CourseRow course : validCourses) {
            // 최종 평가 대상 과목만 총 취득학점에 합산
            totalEarnedCredits += course.earnedCredits();
        }

        boolean isOverallSatisfied = overallEvaluator.evaluate(
                gradLoadData,
                totalEarnedCredits,
                cultureEvaluation,
                seedEvaluation,
                majorEvaluation,
                majorExplorationEvaluation
        );

        // 부족 항목 List 생성
        List<GraduationStatusResponse.MissingItem> missingItems = missingItemsBuilder.build(
                gradLoadData,
                totalEarnedCredits,
                cultureEvaluation,
                seedEvaluation,
                majorEvaluation,
                majorExplorationEvaluation
        );

        // 평가 결과를 응답용 DTO 섹션으로 직접 변환
        GraduationStatusResponse.Template templateDto = new GraduationStatusResponse.Template(
                gradLoadData.template().templateId(),
                gradLoadData.template().templateName(),
                gradLoadData.template().applicableYear()
        );

        int totalRequiredCredits = gradLoadData.template().totalRequiredCredits(); // 총 졸업 필요학점
        int totalShortageCredits = Math.max(0, totalRequiredCredits - totalEarnedCredits); // 부족 총학점 계산
        GraduationStatusResponse.Overall overallDto = new GraduationStatusResponse.Overall(
                isOverallSatisfied,
                totalRequiredCredits,
                totalEarnedCredits,
                totalShortageCredits
        );

        List<GraduationStatusResponse.Culture.CultureRule> cultureRules = new ArrayList<>();
        for (var ruleEvaluation : cultureEvaluation.rules()) {
            // 교양 세부 규칙 응답 DTO 규격으로 변환
            cultureRules.add(
                    new GraduationStatusResponse.Culture.CultureRule(
                            ruleEvaluation.category(),
                            ruleEvaluation.required(),
                            ruleEvaluation.earned(),
                            ruleEvaluation.shortage(),
                            ruleEvaluation.isSatisfied()
                    )
            );
        }
        GraduationStatusResponse.Culture cultureDto = new GraduationStatusResponse.Culture(
                cultureEvaluation.required(),
                cultureEvaluation.earned(),
                cultureEvaluation.shortage(),
                cultureEvaluation.isSatisfied(),
                cultureRules
        );

        // SEED 세부 내역은 고정 영역 순서로 응답을 구성
        List<GraduationStatusResponse.Seed.SeedAreaCredits> seedAreas = List.of(
                new GraduationStatusResponse.Seed.SeedAreaCredits(
                        "Science",
                        seedEvaluation.earnedByArea().getOrDefault("Science", 0)
                ),
                new GraduationStatusResponse.Seed.SeedAreaCredits(
                        "Economy",
                        seedEvaluation.earnedByArea().getOrDefault("Economy", 0)
                ),
                new GraduationStatusResponse.Seed.SeedAreaCredits(
                        "Environment",
                        seedEvaluation.earnedByArea().getOrDefault("Environment", 0)
                ),
                new GraduationStatusResponse.Seed.SeedAreaCredits(
                        "Diversity",
                        seedEvaluation.earnedByArea().getOrDefault("Diversity", 0)
                )
        );
        GraduationStatusResponse.Seed seedDto = new GraduationStatusResponse.Seed(
                seedEvaluation.required(),
                seedEvaluation.earned(),
                seedEvaluation.shortage(),
                seedEvaluation.requiredAreas(),
                seedEvaluation.minAreaCredits(),
                seedAreas,
                seedEvaluation.isAreaSatisfied(),
                seedEvaluation.isTotalSatisfied(),
                seedEvaluation.isSatisfied()
        );

        List<GraduationStatusResponse.Major.MajorItem> majorItems = new ArrayList<>();
        for (var majorItemEvaluation : majorEvaluation.majors()) {
            // 전공별 판정 결과 응답 DTO 규격으로 변환
            majorItems.add(
                    new GraduationStatusResponse.Major.MajorItem(
                            majorItemEvaluation.majorId(),
                            majorItemEvaluation.majorName(),
                            majorItemEvaluation.majorType(),
                            majorItemEvaluation.requiredTotal(),
                            majorItemEvaluation.requiredCore(),
                            majorItemEvaluation.earnedCore(),
                            majorItemEvaluation.earnedElective(),
                            majorItemEvaluation.earnedTotal(),
                            majorItemEvaluation.isSatisfied()
                    )
            );
        }
        GraduationStatusResponse.Major majorDto = new GraduationStatusResponse.Major(
                majorEvaluation.hasMajors(),
                majorEvaluation.isSatisfied(),
                majorItems
        );

        GraduationStatusResponse.MajorExploration majorExplorationDto =
                new GraduationStatusResponse.MajorExploration(
                        majorExplorationEvaluation.required(),
                        majorExplorationEvaluation.earnedTotal(),
                        majorExplorationEvaluation.shortageTotal(),
                        majorExplorationEvaluation.requiredMyDept(),
                        majorExplorationEvaluation.earnedMyDept(),
                        majorExplorationEvaluation.shortageMyDept(),
                        majorExplorationEvaluation.isSatisfied()
                );

        // 판정 가능 상태에서는 reasons/message 없이 평가 결과만 반환
        return new GraduationStatusResponse(
                true,
                List.of(),
                null,
                templateDto,
                overallDto,
                cultureDto,
                seedDto,
                majorDto,
                majorExplorationDto,
                missingItems
        );
    }
}
