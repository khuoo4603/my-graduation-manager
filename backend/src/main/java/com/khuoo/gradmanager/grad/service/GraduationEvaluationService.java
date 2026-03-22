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
import com.khuoo.gradmanager.grad.loadmodel.CourseMasterRow;
import com.khuoo.gradmanager.grad.loadmodel.CourseRow;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.loadmodel.GraduationTemplateRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        // 졸업판정에 사용할 수강 이력을 전처리
        Map<Long, CourseMasterRow> courseMasterById = gradLoadData.courseMastersById(); // 과목 분류(교양/전공/SEED 등) 확인용 course_master MAP
        Map<Long, CourseRow> courseById = new HashMap<>(); // course_id 기준으로 수강 이력을 빠르게 찾기 위한 MAP
        for (CourseRow course : gradLoadData.courses()) {
            courseById.put(course.courseId(), course);
        }

        List<CourseRow> activeCourses;
        // 수강 이력이 없으면 전처리 없이 빈 목록 그대로 사용
        if (courseById.isEmpty()) {
            activeCourses = gradLoadData.courses();
        } else {
            Map<Long, CourseRow> latestCoursesByGroup = new HashMap<>(); // 같은 원본 과목 묶음에서 최신 수강 이력 1건만 보관
            for (CourseRow course : gradLoadData.courses()) {
                Long originalCourseId = course.retakeCourseId(); // 재수강이면 원본 과목 course_id부터 시작
                Set<Long> visitedCourseIds = new HashSet<>(); // 비정상 재수강 체인/순환 참조 방지용 방문 기록 (A <- B 재수강, B <- A 재수강 금지 / A <- B <- C 재수강 체인 확인)

                // 재수강 원본 과목을 따라가며 최종 재수강 그룹을 완성
                while (originalCourseId != null) {
                    // 이미 방문한 course_id면 순환 참조로 보고 가장 작은 id를 그룹 키로 사용
                    if (!visitedCourseIds.add(originalCourseId)) {
                        originalCourseId = visitedCourseIds.stream()
                                .min(Long::compareTo)
                                .orElse(course.courseId());
                        break;
                    }

                    CourseRow originalCourse = courseById.get(originalCourseId); // 현재 원본 후보 수강 이력 조회
                    // 원본 과목이 없거나 재수강한 과목이 아니면 종료
                    if (originalCourse == null || originalCourse.retakeCourseId() == null) { break; }

                    // 현재 원본 후보도 재수강이면 한 단계 더 이전 원본으로 이동
                    originalCourseId = originalCourse.retakeCourseId();
                }

                long groupKey = originalCourseId == null ? course.courseId() : originalCourseId; // 재수강이 아니면 현재 검색중인 수강내역ID, 재수강이면 원본 수강내역ID
                CourseRow currentLatest = latestCoursesByGroup.get(groupKey); // 현재 그룹에서 최신으로 선택된 수강 이력

                // 아직 그룹에 과목이 없으면 현재 과목을 판정용 데이터로 입력
                if (currentLatest == null) {
                    latestCoursesByGroup.put(groupKey, course);
                    continue;
                }

                // 수강 연도가 더 큰 과목을 최신 수강 이력을 판정용 데이터로 입력
                if (course.takenYear() != currentLatest.takenYear()) {
                    if (course.takenYear() > currentLatest.takenYear()) {
                        latestCoursesByGroup.put(groupKey, course);
                    }
                    continue;
                }

                // 연도가 같으면 학기 순서(1 -> SUMMER -> 2 -> WINTER)로 최신 여부를 판단
                int candidateTermOrder = switch (AcademicTermPolicy.normalize(course.takenTerm())) {
                    case "1" -> 1;
                    case "SUMMER" -> 2;
                    case "2" -> 3;
                    case "WINTER" -> 4;
                    default -> 0;
                };
                int currentTermOrder = switch (AcademicTermPolicy.normalize(currentLatest.takenTerm())) {
                    case "1" -> 1;
                    case "SUMMER" -> 2;
                    case "2" -> 3;
                    case "WINTER" -> 4;
                    default -> 0;
                };

                // 같은 연도에서는 더 뒤 학기에 수강한 과목을 판정용 데이터로 입력
                if (candidateTermOrder != currentTermOrder) {
                    if (candidateTermOrder > currentTermOrder) {
                        latestCoursesByGroup.put(groupKey, course);
                    }
                    continue;
                }

                // 연도와 학기까지 같으면 course_id가 더 큰 수강 이력을 판정용 데이터로 입력
                if (course.courseId() > currentLatest.courseId()) {
                    latestCoursesByGroup.put(groupKey, course);
                }
            }

            // 같은 원본 과목 묶음에서 최신 수강 이력만 최종 평가 대상으로 사용
            activeCourses = new ArrayList<>(latestCoursesByGroup.values());
        }

        List<CourseRow> validCourses = new ArrayList<>();
        for (CourseRow course : activeCourses) {
            String grade = course.grade(); // 최신 수강 이력의 성적 확인

            // F, NP 성적은 취득학점과 졸업요건 계산에서 제외
            if (!"F".equals(grade) && !"NP".equals(grade)) {
                validCourses.add(course);
            }
        }

        // 각 Dto 섹션 별 졸업판정
        CultureEvaluation cultureEvaluation = cultureEvaluator.evaluate(gradLoadData, validCourses, courseMasterById);
        SeedEvaluation seedEvaluation = seedEvaluator.evaluate(gradLoadData, validCourses, courseMasterById);
        MajorEvaluation majorEvaluation = majorEvaluator.evaluate(gradLoadData, validCourses, courseMasterById);
        MajorExplorationEvaluation majorExplorationEvaluation = majorExplorationEvaluator.evaluate(gradLoadData, validCourses);

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
        GraduationStatusResponse.Template templateDto = toTemplateDto(gradLoadData.template());
        GraduationStatusResponse.Overall overallDto = toOverallDto(gradLoadData, totalEarnedCredits, isOverallSatisfied);
        GraduationStatusResponse.Culture cultureDto = toCultureDto(cultureEvaluation);
        GraduationStatusResponse.Seed seedDto = toSeedDto(seedEvaluation);
        GraduationStatusResponse.Major majorDto = toMajorDto(majorEvaluation);
        GraduationStatusResponse.MajorExploration majorExplorationDto = toMajorExplorationDto(majorExplorationEvaluation);

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

    // 템플릿 판정 결과를 응답 DTO 규격으로 변환
    private GraduationStatusResponse.Template toTemplateDto(GraduationTemplateRow template) {
        return new GraduationStatusResponse.Template(
                template.templateId(),
                template.templateName(),
                template.applicableYear()
        );
    }

    // 전체 졸업 충족 여부와 총학점 요약을 응답 DTO 규격으로 변환
    private GraduationStatusResponse.Overall toOverallDto(
            GradLoadData gradLoadData,
            int totalEarnedCredits,
            boolean isOverallSatisfied
    ) {
        int totalRequiredCredits = gradLoadData.template().totalRequiredCredits(); // 템플릿 기준 총 필요학점
        int totalShortageCredits = Math.max(0, totalRequiredCredits - totalEarnedCredits); // 총학점 기준 부족 학점 계산

        return new GraduationStatusResponse.Overall(
                isOverallSatisfied,
                totalRequiredCredits,
                totalEarnedCredits,
                totalShortageCredits
        );
    }

    // 교양 판정 결과를 응답 DTO 규격으로 변환
    private GraduationStatusResponse.Culture toCultureDto(CultureEvaluation cultureEvaluation) {
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

        return new GraduationStatusResponse.Culture(
                cultureEvaluation.required(),
                cultureEvaluation.earned(),
                cultureEvaluation.shortage(),
                cultureEvaluation.isSatisfied(),
                cultureRules
        );
    }

    // SEED 판정 결과를 응답 DTO 규격으로 변환
    private GraduationStatusResponse.Seed toSeedDto(SeedEvaluation seedEvaluation) {
        // SEED 세부 내역은 고정 영역 순서로 응답을 구성
        List<GraduationStatusResponse.Seed.SeedAreaCredits> seedAreas = List.of(
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
                seedAreas,
                seedEvaluation.isAreaSatisfied(),
                seedEvaluation.isTotalSatisfied(),
                seedEvaluation.isSatisfied()
        );
    }

    // 전공 판정 결과를 응답 DTO 규격으로 변환
    private GraduationStatusResponse.Major toMajorDto(MajorEvaluation majorEvaluation) {
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

        return new GraduationStatusResponse.Major(
                majorEvaluation.hasMajors(),
                majorEvaluation.isSatisfied(),
                majorItems
        );
    }

    // 전공탐색 판정 결과를 응답 DTO 규격으로 변환
    private GraduationStatusResponse.MajorExploration toMajorExplorationDto(
            MajorExplorationEvaluation majorExplorationEvaluation
    ) {
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