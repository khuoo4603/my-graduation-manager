package com.khuoo.gradmanager.grad.service;

import com.khuoo.gradmanager.grad.domain.evaluator.*;
import com.khuoo.gradmanager.grad.domain.MissingItemsBuilder;
import com.khuoo.gradmanager.grad.domain.result.*;
import com.khuoo.gradmanager.grad.dto.GraduationStatusResponse;
import com.khuoo.gradmanager.grad.loadmodel.CourseMasterRow;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class GraduationEvaluationService {

    private final CultureEvaluator cultureEvaluator;
    private final SeedEvaluator seedEvaluator;
    private final MajorEvaluator majorEvaluator;
    private final MajorExplorationEvaluator majorExplorationEvaluator;
    private final OverallEvaluator overallEvaluator;
    private final MissingItemsBuilder missingItemsBuilder;

    public GraduationStatusResponse evaluate(GradLoadData gradLoadData) {
        // 졸업판정에 필요한 데이터 가공
        Map<Long, CourseMasterRow> courseMasterById = gradLoadData.courseMastersById(); // course_master 검색/분류용 데이터(강의ID, 교양/전공, 이수구분, SEED)
        List<CourseRow> validCourses = filterValidCourses(gradLoadData.courses()); // F/NP는 모든 집계에서 제외

        // 각 Dto 색션 별 졸업판정
        CultureEvaluation cultureEvaluation = cultureEvaluator.evaluate(gradLoadData, validCourses, courseMasterById); // 교양
        SeedEvaluation seedEvaluation = seedEvaluator.evaluate(gradLoadData, validCourses, courseMasterById); // SEED
        MajorEvaluation majorEvaluation = majorEvaluator.evaluate(gradLoadData, validCourses, courseMasterById); // 전공 (전필, 전선)
        MajorExplorationEvaluation majorExplorationEvaluation = majorExplorationEvaluator.evaluate(gradLoadData, validCourses); // 전공탐색

        // 전체요약 데이터 (전체 총 취득학점, 전체 졸업 요건 이부)
        int totalEarnedCredits = sumEarnedCredits(validCourses); // 총 취득학점
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

        GraduationEvaluationResult evaluationResult = new GraduationEvaluationResult(
                gradLoadData.template().templateId(),           // GraduationTemplateRow에 저장된 템플릿 ID
                gradLoadData.template().templateName(),         // GraduationTemplateRow에 저장된 템플릿 이름
                gradLoadData.template().applicableYear(),       // GraduationTemplateRow에 저장된 적용 년도
                gradLoadData.template().totalRequiredCredits(), // GraduationTemplateRow에 저장된 총 필요 학점
                totalEarnedCredits,
                cultureEvaluation,
                seedEvaluation,
                majorEvaluation,
                majorExplorationEvaluation,
                isOverallSatisfied
        );

        // 최종 Dto구조로 결합
        return toResponseDto(evaluationResult, missingItems);
    }

    // 성적이 F/NP인 강의는 모든 집계에서 제외
    private List<CourseRow> filterValidCourses(List<CourseRow> courses) {
        List<CourseRow> validCourses = new ArrayList<>();

        for (CourseRow course : courses) {
            String grade = course.grade();
            if (!"F".equals(grade) && !"NP".equals(grade)) { validCourses.add(course); }
        }

        return validCourses;
    }

    // F/NP 강의를 제외한 나머지 강의 취득학점 (총 취득학점)
    private int sumEarnedCredits(List<CourseRow> validCourses) {
        int total = 0;

        for (CourseRow course : validCourses) {
            total += course.earnedCredits();
        }

        return total;
    }


    // 최종 Dto구조로 결합
    private GraduationStatusResponse toResponseDto(
            GraduationEvaluationResult evaluationResult, // 도메인 평가 결과
            List<GraduationStatusResponse.MissingItem> missingItems // 부족 항목
    ) {
        GraduationStatusResponse.Template templateDto = toTemplateDto(evaluationResult);
        GraduationStatusResponse.Overall overallDto = toOverallDto(evaluationResult);
        GraduationStatusResponse.Culture cultureDto = toCultureDto(evaluationResult.culture());
        GraduationStatusResponse.Seed seedDto = toSeedDto(evaluationResult.seed());
        GraduationStatusResponse.Major majorDto = toMajorDto(evaluationResult.major());
        GraduationStatusResponse.MajorExploration majorExplorationDto = toMajorExplorationDto(evaluationResult.majorExploration());

        return new GraduationStatusResponse(
                templateDto,
                overallDto,
                cultureDto,
                seedDto,
                majorDto,
                majorExplorationDto,
                missingItems
        );
    }

    private GraduationStatusResponse.Template toTemplateDto(GraduationEvaluationResult evaluationResult) {
        return new GraduationStatusResponse.Template(
                evaluationResult.templateId(),
                evaluationResult.templateName(),
                evaluationResult.templateYear()
        );
    }

    private GraduationStatusResponse.Overall toOverallDto(GraduationEvaluationResult evaluationResult) {
        return new GraduationStatusResponse.Overall(
                evaluationResult.overallSatisfied(),
                evaluationResult.totalRequired(),
                evaluationResult.totalEarned(),
                evaluationResult.totalShortage()
        );
    }

    private GraduationStatusResponse.Culture toCultureDto(CultureEvaluation cultureEvaluation) {
        List<GraduationStatusResponse.Culture.CultureRule> cultureRules = new ArrayList<>();
        for (var ruleEvaluation : cultureEvaluation.rules()) {
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

        return new GraduationStatusResponse.Culture(
                cultureEvaluation.required(),
                cultureEvaluation.earned(),
                cultureEvaluation.shortage(),
                cultureEvaluation.isSatisfied(),
                cultureRules
        );
    }

    private GraduationStatusResponse.Seed toSeedDto(SeedEvaluation seedEvaluation) {
        List<GraduationStatusResponse.Seed.SeedAreaCredits> areas = List.of(
                new GraduationStatusResponse.Seed.SeedAreaCredits("Science",
                        seedEvaluation.earnedByArea().getOrDefault("Science", 0)),
                new GraduationStatusResponse.Seed.SeedAreaCredits("Economy",
                        seedEvaluation.earnedByArea().getOrDefault("Economy", 0)),
                new GraduationStatusResponse.Seed.SeedAreaCredits("Environment",
                        seedEvaluation.earnedByArea().getOrDefault("Environment", 0)),
                new GraduationStatusResponse.Seed.SeedAreaCredits("Diversity",
                        seedEvaluation.earnedByArea().getOrDefault("Diversity", 0))
        );

        return new GraduationStatusResponse.Seed(
                seedEvaluation.required(),
                seedEvaluation.earned(),
                seedEvaluation.shortage(),
                seedEvaluation.requiredAreas(),
                seedEvaluation.minAreaCredits(),
                areas,
                seedEvaluation.isAreaSatisfied(),
                seedEvaluation.isTotalSatisfied(),
                seedEvaluation.isSatisfied()
        );
    }

    private GraduationStatusResponse.Major toMajorDto(MajorEvaluation majorEvaluation) {
        List<GraduationStatusResponse.Major.MajorItem> majorItems = new ArrayList<>();
        for (var majorItemEvaluation : majorEvaluation.majors()) {
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

        return new GraduationStatusResponse.Major(
                majorEvaluation.hasMajors(),
                majorEvaluation.isSatisfied(),
                majorItems
        );
    }

    private GraduationStatusResponse.MajorExploration toMajorExplorationDto(MajorExplorationEvaluation majorExplorationEvaluation) {
        return new GraduationStatusResponse.MajorExploration(
                majorExplorationEvaluation.required(),
                majorExplorationEvaluation.earnedTotal(),
                majorExplorationEvaluation.shortageTotal(),
                majorExplorationEvaluation.requiredMyDept(),
                majorExplorationEvaluation.earnedMyDept(),
                majorExplorationEvaluation.shortageMyDept(),
                majorExplorationEvaluation.isSatisfied()
                );
    }

}